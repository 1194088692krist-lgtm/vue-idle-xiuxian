// 游戏版本号：每次发布时递增
// 格式：主版本.次版本.修订号（build日期）
export const GAME_VERSION = '2.1.0'
export const GAME_VERSION_NAME = '天道劫起'
export const GAME_VERSION_DATE = '2026-07-28'

// 构建时注入的最新 Git 提交短 hash（vite.config.js 的 define 读取 git rev-parse --short HEAD）
// dev/build 均会注入；若未注入（极端环境）回退为 'dev'，避免 ReferenceError
// 用于登录页版本号下方展示，快速确认当前部署对应的提交
/* eslint-disable no-undef */
export const COMMIT_HASH = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev'
/* eslint-enable no-undef */
