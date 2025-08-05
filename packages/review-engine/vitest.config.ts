/**
 * @fileoverview Vitest 测试配置文件
 * @description 复习系统核心引擎的测试框架配置
 * @author thiskee
 * 
 * 任务 1.3 完成文件
 * 配置 Vitest 测试环境和覆盖率报告
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test-utils/**'
      ]
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache']
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}) 