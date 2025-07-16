# CLAUDE.md

此文件为Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 沟通语言
请保持用中文与我沟通。

## 编程哲学
Monolithic Repository

## 项目架构

这是一个单体仓库的AI词汇查询应用，包含三个主要包：

- **@ai-voca/shared**: 前端和后端共享的TypeScript类型和工具函数
- **@ai-voca/backend**: 与AiHubMix AI服务集成的Express.js REST API
- **@ai-voca/frontend**: 使用Vite构建的React前端应用

### 关键架构模式

**类型安全**: 所有包都使用TypeScript，在`@ai-voca/shared/src/types/index.ts`中定义共享类型。核心类型包括`WordQueryRequest`、`WordQueryResponse`和`WordExplanation`。

**AI集成**: 后端的`WordService`类处理所有对AiHubMix的AI API调用。它使用共享工具函数来格式化单词和生成AI提示，然后将AI响应解析回结构化数据。

**数据流**: 前端 → 后端API → AiHubMix AI → 后端处理 → 前端显示。`useWordQuery` hook管理整个前端状态生命周期。

**模块解析**: 单体仓库使用TypeScript路径映射(`@ai-voca/shared`)和npm工作区进行包管理。

## 核心命令

### 开发
```bash
# 在开发模式下启动前端和后端
npm run dev

# 单独启动服务
npm run dev:frontend  # React开发服务器在3000端口
npm run dev:backend   # Express服务器在3001端口

# 构建所有包（必须先构建shared包）
npm run build

# 构建单个包
npm run build:frontend
npm run build:backend
```

### 测试和质量检查
```bash
# 运行所有包的测试
npm run test

# 运行所有包的代码检查
npm run lint

# 清理所有构建产物和node_modules
npm run clean
```

### 包特定命令
```bash
# 使用npm工作区处理特定包
npm run dev -w @ai-voca/frontend
npm run build -w @ai-voca/shared
npm run test -w @ai-voca/backend
```

## 环境配置

复制`.env.example`到`.env`并配置：

```env
AIHUBMIX_API_KEY=your_api_key_here
AIHUBMIX_API_URL=https://aihubmix.com/v1/chat/completions
AIHUBMIX_MODEL=gemini-2.0-flash  # 或 gpt-4o-mini
PORT=3001
NODE_ENV=development
REACT_APP_API_URL=http://localhost:3001
```

## API架构

后端提供两个主要端点：
- `GET /api/words/query` - 使用URL参数查询单词
- `POST /api/words/query` - 使用JSON body查询单词
- `GET /health` - 健康检查端点

前端在`vite.config.ts`中使用代理配置，在开发期间将`/api`请求路由到后端。

## 共享模块系统

`@ai-voca/shared`包包含：
- **类型**: API请求/响应和AI集成的核心接口
- **工具**: 验证函数(`isValidWord`)、格式化函数(`formatWord`, `formatTimestamp`)和提示生成工具
- **零依赖**: 共享包没有外部依赖，避免冲突

## 关键开发注意事项

**构建顺序**: 必须先构建共享包再构建后端，因为后端导入编译后的共享代码。

**类型导入**: 对于仅类型导入，使用`import type`从共享包中导入以避免运行时依赖。

**错误处理**: `WordService`类处理所有AI API错误并将其转换为用户友好的消息。前端组件应该处理网络错误和API错误响应。

**状态管理**: `useWordQuery` hook集中管理所有查询状态（加载、错误、结果）并为组件提供清晰的API。

## 开发工作流

1. 启动开发服务器: `npm run dev`
2. 前端运行在 http://localhost:3000 并配置API代理
3. 后端运行在 http://localhost:3001 并启用CORS
4. 访问API文档: http://localhost:3001/api/words
5. 健康检查: http://localhost:3001/health

当修改共享类型或工具时，在测试前重新构建共享包。