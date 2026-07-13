import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const PLUGINS_DIR = path.join(PROJECT_ROOT, 'src', 'plugins')
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public')

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// 素材上传配置
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(PUBLIC_DIR, 'assets', req.body.type || 'images')
    await fs.mkdir(uploadPath, { recursive: true })
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage })

// 获取所有游戏数据文件列表
app.get('/api/files', async (req, res) => {
  try {
    const files = await fs.readdir(PLUGINS_DIR)
    const jsFiles = files.filter(f => f.endsWith('.js'))
    res.json({ success: true, files: jsFiles })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// 读取游戏数据文件
app.get('/api/file/:name', async (req, res) => {
  try {
    const filePath = path.join(PLUGINS_DIR, req.params.name)
    const content = await fs.readFile(filePath, 'utf-8')
    res.json({ success: true, name: req.params.name, content })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// 写入游戏数据文件（核心功能：编辑器保存即更新代码）
app.post('/api/file/:name', async (req, res) => {
  try {
    const filePath = path.join(PLUGINS_DIR, req.params.name)
    await fs.writeFile(filePath, req.body.content, 'utf-8')
    res.json({ success: true, message: `已保存 ${req.params.name}` })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// 批量写入多个文件
app.post('/api/files/batch', async (req, res) => {
  try {
    const results = []
    for (const [name, content] of Object.entries(req.body.files)) {
      const filePath = path.join(PLUGINS_DIR, name)
      await fs.writeFile(filePath, content, 'utf-8')
      results.push(name)
    }
    res.json({ success: true, message: `已批量保存 ${results.length} 个文件`, files: results })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// 素材上传
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const filePath = `/assets/${req.body.type || 'images'}/${req.file.originalname}`
    res.json({ success: true, path: filePath, name: req.file.originalname })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// 获取已上传素材列表
app.get('/api/assets/:type?', async (req, res) => {
  try {
    const type = req.params.type || 'images'
    const assetsDir = path.join(PUBLIC_DIR, 'assets', type)
    await fs.mkdir(assetsDir, { recursive: true })
    const files = await fs.readdir(assetsDir)
    const assets = files.map(f => ({
      name: f,
      path: `/assets/${type}/${f}`,
      fullPath: path.join(assetsDir, f)
    }))
    res.json({ success: true, assets })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// Git 状态检查
app.get('/api/git/status', (req, res) => {
  try {
    const status = execSync('git status --short', { cwd: PROJECT_ROOT, encoding: 'utf-8' })
    const branch = execSync('git branch --show-current', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim()
    res.json({ success: true, status, branch, hasChanges: status.trim().length > 0 })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// Git 提交并推送
app.post('/api/git/commit', (req, res) => {
  try {
    const { message } = req.body
    execSync('git add -A', { cwd: PROJECT_ROOT })
    execSync(`git commit -m "${message || 'update game data via editor'}"`, { cwd: PROJECT_ROOT })
    execSync('git push', { cwd: PROJECT_ROOT })
    res.json({ success: true, message: '已提交并推送到GitHub' })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// 导出游戏数据为JSON（方便备份）
app.get('/api/export', async (req, res) => {
  try {
    const files = await fs.readdir(PLUGINS_DIR)
    const data = {}
    for (const file of files.filter(f => f.endsWith('.js'))) {
      data[file] = await fs.readFile(path.join(PLUGINS_DIR, file), 'utf-8')
    }
    res.json({ success: true, data })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// 导入游戏数据
app.post('/api/import', async (req, res) => {
  try {
    for (const [name, content] of Object.entries(req.body.data)) {
      await fs.writeFile(path.join(PLUGINS_DIR, name), content, 'utf-8')
    }
    res.json({ success: true, message: '数据导入成功' })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

const PORT = process.env.PORT || 3456
app.listen(PORT, () => {
  console.log(`修仙游戏编辑器服务已启动: http://localhost:${PORT}`)
  console.log(`项目根目录: ${PROJECT_ROOT}`)
})
