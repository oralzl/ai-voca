import { createServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';

const app = express();

// 代理 API 请求到生产环境
app.use('/api', createProxyMiddleware({
  target: 'https://ai-voca-frontend.vercel.app',
  changeOrigin: true,
}));

// 创建 Vite 开发服务器
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

app.use(vite.middlewares);

app.listen(3000, () => {
  console.log('开发服务器运行在 http://localhost:3000');
  console.log('API 请求将代理到 https://ai-voca-frontend.vercel.app');
});