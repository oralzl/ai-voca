#!/usr/bin/env node

/**
 * 开发服务器启动脚本
 * 同时运行 Vite 开发服务器和 Vercel Functions
 */

const { spawn } = require('child_process');
const { createServer } = require('vite');

async function startDevServer() {
  console.log('🚀 启动开发服务器...');

  // 启动 Vite 开发服务器
  const viteServer = await createServer({
    server: {
      port: 3000,
      proxy: {
        // 将 API 请求代理到 Vercel Functions
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    }
  });

  await viteServer.listen();

  console.log('✅ Vite 开发服务器已启动: http://localhost:3000');
  console.log('📡 API 请求将被代理到 Vercel Functions...');

  // 启动 Vercel Functions（在不同端口）
  console.log('🔧 启动 Vercel Functions...');
  
  const vercelProcess = spawn('vercel', ['dev', '--listen', '3001', '--yes'], {
    stdio: 'inherit',
    shell: true
  });

  vercelProcess.on('error', (err) => {
    console.error('❌ Vercel CLI 启动失败:', err.message);
    console.log('💡 请确保已安装 Vercel CLI: npm i -g vercel');
  });

  // 处理进程退出
  process.on('SIGINT', () => {
    console.log('\n👋 关闭开发服务器...');
    viteServer.close();
    vercelProcess.kill();
    process.exit(0);
  });
}

startDevServer().catch(console.error);