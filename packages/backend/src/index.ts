import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { wordRouter } from './routes/word';
import { errorHandler } from './middleware/errorHandler';

// 加载环境变量 - 从项目根目录
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

// 调试信息
console.log('环境变量路径:', envPath);
console.log('API密钥是否存在:', !!process.env.AIHUBMIX_API_KEY);
console.log('API密钥前缀:', process.env.AIHUBMIX_API_KEY?.substring(0, 10) + '...');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/words', wordRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/words`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;