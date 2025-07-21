/**
 * @fileoverview Vite + Vercel Functions 配置
 * @description 支持在开发环境中运行 Vercel Functions
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
      // 配置 API 代理
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying API request:', req.method, req.url);
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});