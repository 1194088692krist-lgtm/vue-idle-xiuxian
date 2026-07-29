/**
 * useDebugLog — 轻量环形日志收集器
 *
 * 设计目标：
 * 1. 拦截 console.log/warn/error，保留最近 N 条用于调试面板查看
 * 2. 环形缓冲：超出上限自动丢弃最旧，内存稳定
 * 3. 生产环境也启用（用户报 bug 时需要现场抓日志）
 * 4. 低开销：每条日志只存文本 + 时间戳 + 级别，不存对象引用
 *
 * 容量取舍：200 条
 * - 战斗密度：约 10-20 场战斗的关键日志
 * - 时间跨度：挂机约 3-5 分钟活动期，足够复现一次 bug
 * - 复制体量：约 30-60KB，复制粘贴友好，不会撑爆剪贴板
 */

import { ref, readonly } from 'vue'

const MAX_LOGS = 200
const logs = ref([])
let installed = false

function formatArg(arg) {
  if (arg === null) return 'null'
  if (arg === undefined) return 'undefined'
  if (typeof arg === 'string') return arg
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg)
  if (arg instanceof Error) return arg.stack || (arg.message + '\n' + arg.stack)
  if (arg instanceof HTMLElement) return `<${arg.tagName.toLowerCase()}${arg.id ? '#' + arg.id : ''}${arg.className ? '.' + (typeof arg.className === 'string' ? arg.className.split(' ')[0] : '') : ''}>`
  try {
    // 对象/数组：JSON 序列化，截断长字符串避免单条日志过大
    const json = JSON.stringify(arg, (key, val) => {
      if (typeof val === 'string' && val.length > 200) return val.slice(0, 200) + '…(' + val.length + ')'
      if (typeof val === 'function') return '[Function]'
      return val
    }, 0)
    return json && json.length > 500 ? json.slice(0, 500) + '…' : json
  } catch (_) {
    return String(arg)
  }
}

function appendLog(level, args) {
  const text = Array.from(args).map(formatArg).join(' ')
  const time = new Date()
  const ts = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}.${String(time.getMilliseconds()).padStart(3, '0')}`
  logs.value.push({ ts, level, text })
  // 环形缓冲：超过上限丢弃最旧
  if (logs.value.length > MAX_LOGS) {
    logs.value.splice(0, logs.value.length - MAX_LOGS)
  }
}

/**
 * 安装 console 拦截器（幂等，全局只装一次）
 * 在 main.js 中调用 installDebugLog() 即可
 */
export function installDebugLog() {
  if (installed) return
  installed = true

  // 包装原方法，保留原始行为（其他 devtools 仍能看到完整日志）
  const origLog = console.log
  const origWarn = console.warn
  const origError = console.error

  console.log = function (...args) {
    appendLog('log', args)
    origLog.apply(console, args)
  }
  console.warn = function (...args) {
    appendLog('warn', args)
    origWarn.apply(console, args)
  }
  console.error = function (...args) {
    appendLog('error', args)
    origError.apply(console, args)
  }

  // 捕获未处理的异常
  window.addEventListener('error', (e) => {
    appendLog('error', ['[Uncaught]', e.message, e.error?.stack || ''])
  })
  window.addEventListener('unhandledrejection', (e) => {
    appendLog('error', ['[UnhandledPromise]', e.reason?.message || e.reason || ''])
  })

  // 标记安装完成
  appendLog('log', ['[DebugLog] 已启用日志收集，容量 ' + MAX_LOGS + ' 条'])
}

/**
 * 导出日志为纯文本（用于一键复制）
 * 格式：[HH:MM:SS.mmm] [LEVEL] text
 */
export function exportLogs() {
  return logs.value.map(l => `[${l.ts}] [${l.level.toUpperCase()}] ${l.text}`).join('\n')
}

/**
 * 清空日志
 */
export function clearLogs() {
  logs.value.splice(0, logs.value.length)
}

/**
 * composable 入口
 */
export function useDebugLog() {
  return {
    logs: readonly(logs),
    exportLogs,
    clearLogs
  }
}
