# @ai-voca/backend

AI单词查询后端API服务，基于Express.js构建，提供RESTful API接口。

## 功能特性

- 🚀 **RESTful API**: 标准的REST API设计
- 🔐 **AI集成**: 集成AiHubMix AI模型API
- 📝 **类型安全**: 完整的TypeScript支持
- 🛡️ **安全防护**: 集成Helmet、CORS等安全中间件
- 📊 **日志记录**: 完整的请求/响应日志
- ⚡ **性能优化**: 请求缓存和超时控制

## 安装

```bash
npm install @ai-voca/backend
```

## 快速开始

### 1. 环境配置

复制 `.env.example` 文件为 `.env` 并配置环境变量：

```env
# AiHubMix API 配置
AIHUBMIX_API_KEY=your_api_key_here
AIHUBMIX_API_URL=https://aihubmix.com/v1/chat/completions
AIHUBMIX_MODEL=gpt-4o-mini

# 服务器配置
PORT=3001
NODE_ENV=development

# 前端URL（用于CORS）
FRONTEND_URL=http://localhost:3000
```

### 2. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

### 3. 验证服务

访问 `http://localhost:3001/health` 检查服务状态

## API 文档

### 基础信息

- **Base URL**: `http://localhost:3001`
- **Content-Type**: `application/json`

### 端点列表

#### 1. 健康检查

```
GET /health
```

**响应**:
```json
{
  \"status\": \"ok\",
  \"timestamp\": \"2024-01-01T12:00:00.000Z\",
  \"version\": \"1.0.0\"
}
```

#### 2. 单词查询 (GET)

```
GET /api/words/query?word=hello&language=zh&includeExample=true
```

**参数**:
- `word` (string, required): 要查询的单词
- `language` (string, optional): 解释语言，默认为 'zh'
- `includeExample` (boolean, optional): 是否包含例句，默认为 true

**响应**:
```json
{
  \"success\": true,
  \"data\": {
    \"word\": \"hello\",
    \"pronunciation\": \"həˈləʊ\",
    \"partOfSpeech\": \"interjection\",
    \"definition\": \"用于打招呼的感叹词\",
    \"example\": \"Hello, how are you?\",
    \"synonyms\": [\"hi\", \"greetings\"],
    \"antonyms\": [\"goodbye\"],
    \"etymology\": \"来自古英语...\"
  },
  \"timestamp\": 1704099600000
}
```

#### 3. 单词查询 (POST)

```
POST /api/words/query
Content-Type: application/json

{
  \"word\": \"hello\",
  \"language\": \"zh\",
  \"includeExample\": true
}
```

**请求体**:
```typescript
interface WordQueryRequest {
  word: string;
  language?: 'zh' | 'en';
  includeExample?: boolean;
}
```

**响应**: 同GET方法

#### 4. API信息

```
GET /api/words
```

返回API文档和使用说明。

### 错误处理

所有API返回标准错误格式：

```json
{
  \"success\": false,
  \"error\": \"错误信息\",
  \"timestamp\": 1704099600000
}
```

**常见错误码**:
- `400`: 请求参数错误
- `401`: API密钥无效
- `429`: 请求频率超限
- `500`: 服务器内部错误

## 项目结构

```
src/
├── index.ts              # 应用入口
├── routes/
│   └── word.ts          # 单词查询路由
├── services/
│   └── WordService.ts   # 单词查询服务
└── middleware/
    └── errorHandler.ts  # 错误处理中间件
```

## 核心服务

### WordService

负责与AI API交互的核心服务类：

```typescript
import { WordService } from './services/WordService';

const wordService = new WordService();

// 查询单词
const result = await wordService.queryWord({
  word: 'hello',
  language: 'zh',
  includeExample: true
});
```

### 错误处理

全局错误处理中间件，提供统一的错误响应格式：

```typescript
import { errorHandler } from './middleware/errorHandler';

app.use(errorHandler);
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建
npm run build

# 启动
npm start

# 测试
npm run test

# 代码检查
npm run lint
```

## 部署

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3001

CMD [\"node\", \"dist/index.js\"]
```

### 环境变量

生产环境必需的环境变量：

```env
AIHUBMIX_API_KEY=your_production_api_key
AIHUBMIX_API_URL=https://aihubmix.com/v1/chat/completions
AIHUBMIX_MODEL=gpt-4o-mini
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

## 监控

### 日志

使用Morgan中间件记录HTTP请求日志：

```
GET /api/words/query?word=hello 200 1234ms
POST /api/words/query 200 2345ms
```

### 健康检查

定期检查 `/health` 端点确保服务正常运行。

## 许可证

MIT License