import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());

// 静态文件服务（先提供 API 路由，再提供静态文件）
const distPath = join(__dirname, 'dist');

// API 路由处理 - 返回 404 或者代理到 Vercel Functions
app.all('/api/*', (req, res) => {
  console.log(`API request: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'API endpoint not available in Zeabur deployment. Please use Vercel deployment for full functionality.',
    suggestion: 'Visit https://ai-voca-frontend.vercel.app for the full experience'
  });
});

// 静态文件服务
app.use(express.static(distPath));

// SPA 回退路由
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build files not found. Please run npm run build first.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${distPath}`);
});