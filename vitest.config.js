import { defineConfig } from 'vitest/config'

// 单元测试配置：用 jsdom 环境，避免依赖 DOM 的插件在模块加载时报错
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
})
