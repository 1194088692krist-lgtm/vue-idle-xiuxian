// 轻量后端代理：持有 GitHub PAT，GMTOOLS 上传立绘/素材时通过本服务写入仓库
// 设计原则：PAT 永远不下发到浏览器。前端只调用普通 HTTP 接口。
//
// 依赖：express, multer, cors, dotenv, node-fetch@2
//
// 环境变量（.env）：
//   GITHUB_TOKEN   必填，Contents API 写入权限的 PAT
//   GITHUB_REPO    必填，形如 "owner/repo"
//   GITHUB_BRANCH  默认 main
//   PORT           默认 8787
//   ALLOWED_ORIGIN 默认 *（生产请改为你的域名）
//
// 接口：
//   GET  /api/health
//   POST /api/upload        multipart: file, path?(default public/portraits)
//   POST /api/commit-text   json: { path, content, message }
//   GET  /api/list?path=...

const express = require('express')
const multer = require('multer')
const cors = require('cors')
const fetch = require('node-fetch')
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const PORT = parseInt(process.env.PORT || '8787', 10)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const GITHUB_REPO = process.env.GITHUB_REPO || ''
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'

const app = express()
app.use(cors({ origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN.split(',') }))
app.use(express.json({ limit: '8mb' }))

// 上传：仅允许 png/jpg/webp
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH,
    hasToken: !!GITHUB_TOKEN
  })
})

// 基础白名单：只允许写 public/ 下
const SAFE_PREFIX = 'public/'
const isSafePath = (p) => {
  if (!p) return false
  if (p.includes('..')) return false
  if (p.startsWith('/')) return false
  return true
}

// 工具：调用 GitHub Contents API 获取现有文件（拿到 sha 才能 update）
async function githubGetFile(repoPath) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURI(repoPath).replace(/^\/+/, '')}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
  const r = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'gmtools-proxy'
    }
  })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`GitHub GET ${r.status}: ${await r.text()}`)
  return await r.json()
}

// 工具：写入文件（创建或更新）
async function githubPutFile(repoPath, base64, message) {
  const existing = await githubGetFile(repoPath).catch(() => null)
  const body = {
    message: message || `upload ${repoPath} via GMTOOLS`,
    content: base64,
    branch: GITHUB_BRANCH
  }
  if (existing && existing.sha) body.sha = existing.sha
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURI(repoPath).replace(/^\/+/, '')}`
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'gmtools-proxy'
    },
    body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error(`GitHub PUT ${r.status}: ${await r.text()}`)
  return await r.json()
}

// 上传立绘
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return res.status(500).json({ ok: false, error: 'GITHUB_TOKEN / GITHUB_REPO 未配置' })
    }
    if (!req.file) return res.status(400).json({ ok: false, error: '缺少 file 字段' })
    const allowed = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ ok: false, error: `不支持的格式：${req.file.mimetype}` })
    }
    const baseDir = (req.body.path || 'public/portraits').replace(/\/$/, '')
    if (!isSafePath(baseDir + '/')) return res.status(400).json({ ok: false, error: '非法路径' })
    const fileName = req.file.originalname || `upload_${Date.now()}.png`
    const repoPath = `${baseDir}/${fileName}`.replace(/^\/+/, '')

    const base64 = req.file.buffer.toString('base64')
    const result = await githubPutFile(repoPath, base64, `upload ${fileName} via GMTOOLS`)

    res.json({
      ok: true,
      path: repoPath,
      fileName,
      branch: GITHUB_BRANCH,
      commitSha: result.commit && result.commit.sha,
      htmlUrl: result.content && result.content.html_url
    })
  } catch (e) {
    console.error('upload error:', e)
    res.status(500).json({ ok: false, error: String(e.message || e) })
  }
})

// 提交文本文件
app.post('/api/commit-text', async (req, res) => {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return res.status(500).json({ ok: false, error: 'GITHUB_TOKEN / GITHUB_REPO 未配置' })
    }
    const { path: repoPath, content, message } = req.body || {}
    if (!repoPath || typeof content !== 'string') {
      return res.status(400).json({ ok: false, error: '需要 path 和 content 字段' })
    }
    if (!isSafePath(repoPath)) return res.status(400).json({ ok: false, error: '非法路径' })
    const base64 = Buffer.from(content, 'utf-8').toString('base64')
    const result = await githubPutFile(repoPath, base64, message)
    res.json({
      ok: true,
      path: repoPath,
      branch: GITHUB_BRANCH,
      commitSha: result.commit && result.commit.sha
    })
  } catch (e) {
    console.error('commit-text error:', e)
    res.status(500).json({ ok: false, error: String(e.message || e) })
  }
})

// 列出某路径下的文件
app.get('/api/list', async (req, res) => {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return res.status(500).json({ ok: false, error: 'GITHUB_TOKEN / GITHUB_REPO 未配置' })
    }
    const repoPath = (req.query.path || 'public/portraits').toString().replace(/^\/+/, '')
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURI(repoPath)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
    const r = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'gmtools-proxy'
      }
    })
    if (!r.ok) return res.status(r.status).json({ ok: false, error: await r.text() })
    const data = await r.json()
    res.json({ ok: true, files: data.map(f => ({ name: f.name, path: f.path, size: f.size, type: f.type })) })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[gmtools-server] listening on :${PORT}`)
  console.log(`[gmtools-server] repo=${GITHUB_REPO} branch=${GITHUB_BRANCH} hasToken=${!!GITHUB_TOKEN}`)
})
