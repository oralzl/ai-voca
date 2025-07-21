/**
 * @fileoverview Vite构建配置
 * @module vite.config
 * @description 前端应用的Vite构建工具配置，包括React插件、路径别名和开发服务器设置
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@ai-voca/shared': resolve(__dirname, '../shared/src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      // 开发环境下，将 API 请求代理到生产环境
      '/api': {
        target: 'https://ai-voca-frontend.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});