import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import pkg from './package.json'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  base: './',
  server: {
    host: '0.0.0.0',
    port: 2025,
    allowedHosts: true,
    watch: {
      ignored: [
        '**/.pnpm-store/**',
        '**/node_modules/**',
        '**/.git/**',
        '**/docs/**',
        '**/public/**'
      ]
    }
  },
  build: {
    outDir: 'docs',
    minify: 'terser',
    chunkSizeWarningLimit: 800,
    // 素材/装备图标已压缩到 3-7KB（96x96），内联为 base64 避免每次渲染都发网络请求
    // 修复「素材图标加载延迟非常大」的问题：内联后图标随 JS bundle 一次性加载，0 网络请求
    assetsInlineLimit: 8192,
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (id.includes('node_modules')) {
            if (id.includes('naive-ui')) return 'naive-ui'
            if (id.includes('vue')) return 'vue-vendor'
            if (id.includes('pinia')) return 'pinia-vendor'
            return 'vendor'
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: () => {
          return 'assets/[ext]/[name]-[hash].[ext]'
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        {
          'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar']
        }
      ]
    }),
    Components({
      resolvers: [NaiveUiResolver()]
    }),
    // CSS 异步加载插件：把 <link rel="stylesheet"> 改为 preload，
    // 让浏览器解析 HTML 时立即渲染 inline loading 占位，不被外部 CSS 阻塞首次绘制
    // CSS 仍会在加载完后立即应用（onload 回退为 stylesheet），不会出现长时间无样式
    {
      name: 'async-css-load',
      transformIndexHtml(html) {
        return html.replace(
          /<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
          (match, href) => `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">`
        )
      }
    },
    // Service Worker 版本注入：把 sw.js 中的 __SW_VERSION__ 占位符
    // 替换为 v{version}_{timestamp}，发版时 SW 自动更新 + 清理旧缓存
    {
      name: 'sw-version-inject',
      closeBundle: () => {
        const __dirname = path.dirname(fileURLToPath(import.meta.url))
        const swPath = path.resolve(__dirname, 'docs/sw.js')
        if (!fs.existsSync(swPath)) return
        const version = `v${pkg.version}_${Date.now()}`
        const content = fs.readFileSync(swPath, 'utf8')
        fs.writeFileSync(swPath, content.replace(/__SW_VERSION__/g, version))
      }
    }
  ],
  worker: {
    format: 'es'
  }
})
