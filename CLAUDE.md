# CLAUDE.md

此文件为Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 沟通语言
请保持用中文与我沟通。

## 编程哲学
Monolithic Repository

- 精简小巧：每一行“代码”都需要消耗能量，因此必须高效。
- 模块化：基因被组织成可互换的“操纵子”单元（operons）。
- 自包含性强：非常容易被“复制-粘贴”——这正是水平基因转移的基础。
- 可读性强：清晰注释、readme.md 、 example



## 项目架构

这是一个单体仓库的AI词汇查询应用，包含三个主要包：

- **@ai-voca/shared**: 前端和后端共享的TypeScript类型和工具函数
- **@ai-voca/backend**: 与AiHubMix AI服务集成的Express.js REST API
- **@ai-voca/frontend**: 使用Vite构建的React前端应用

### 关键架构模式

**类型安全**: 所有包都使用TypeScript，在`@ai-voca/shared/src/types/index.ts`中定义共享类型。核心类型包括`WordQueryRequest`、`WordQueryResponse`和`WordExplanation`。

**AI集成**: 后端的`WordService`类通过统一的`AiHubMixClient`封装类处理所有AI API调用。它使用共享工具函数来格式化单词和生成AI提示，然后将AI响应解析回结构化数据。系统现在专注于中文词汇解释，并支持词形还原（lemmatization）分析。

**重试机制**: 系统支持智能重试功能，通过在AI响应中嵌入`<input>`标签保存查询参数，实现自包含的重试机制。每次重试都是独立的AI会话，不会继承上下文。

**数据流**: 前端 → 后端API → AiHubMix AI → 后端处理 → 前端显示。`useWordQuery` hook管理整个前端状态生命周期，包括重试功能。

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
AIHUBMIX_API_URL=https://aihubmix.com/v1
AIHUBMIX_MODEL=gemini-2.5-flash-lite-preview-06-17  # 或 gpt-4o-mini
AIHUBMIX_TIMEOUT=30000
PORT=3001
NODE_ENV=development
REACT_APP_API_URL=http://localhost:3001
```

## API架构

后端提供两个主要端点：
- `GET /api/words/query` - 使用URL参数查询单词
- `POST /api/words/query` - 使用JSON body查询单词
- `GET /health` - 健康检查端点

### API参数说明
```typescript
// 查询请求参数（简化版本，移除了language参数）
interface WordQueryRequest {
  word: string;              // 要查询的单词
  includeExample?: boolean;  // 是否包含例句，默认true
}

// 响应数据结构（新增词形还原字段）
interface WordExplanation {
  word: string;                        // 原始单词
  text?: string;                       // lemma后的单词
  lemmatizationExplanation?: string;   // 词形还原说明
  pronunciation?: string;              // 音标
  partOfSpeech?: string;              // 词性
  definition: string;                 // 中文释义
  simpleExplanation?: string;         // 英文简单解释
  examples?: WordExample[];           // 例句数组
  synonyms?: string[];                // 同义词
  antonyms?: string[];                // 反义词
  etymology?: string;                 // 词源信息
  memoryTips?: string;                // 记忆技巧
}
```

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

**状态管理**: `useWordQuery` hook集中管理所有查询状态（加载、错误、结果）并为组件提供清晰的API。包括新增的`retryQuery`功能，支持使用原始参数重新查询。

## 开发工作流

1. 启动开发服务器: `npm run dev`
2. 前端运行在 http://localhost:3000 并配置API代理
3. 后端运行在 http://localhost:3001 并启用CORS
4. 访问API文档: http://localhost:3001/api/words
5. 健康检查: http://localhost:3001/health

当修改共享类型或工具时，在测试前重新构建共享包。


## 重要更新记录

### v1.1.0 - 词形还原功能更新
- **移除语言选择**: 系统现在专注于中文解释，移除了英文版本支持
- **新增词形还原**: 添加词形还原分析和显示功能
- **优化提示词**: 采用新的XML格式提示词，提升AI响应质量
- **多word处理**: 支持AI返回多个单词解释，前端智能显示第一个
- **API简化**: 移除了language参数，简化了API接口

### v1.2.0 - 智能重试功能
- **重试机制**: 新增智能重试功能，支持一键重新查询
- **参数嵌入**: 在AI响应中使用`<input>`标签保存查询参数
- **参数提取**: 前端通过`extractInputParams`函数提取查询参数
- **状态管理**: 完善的重试状态管理，包括加载状态显示
- **独立会话**: 每次重试都是独立的AI会话，不继承上下文
- **类型扩展**: 扩展`WordQueryResponse`接口添加`inputParams`字段
- **UI优化**: 重试按钮仅在有参数时显示，支持加载状态

### v1.1.1 - 灵活XML标签处理
- **智能标签解析**: 支持AI返回的额外XML标签（如 `<item>`）
- **列表自动转换**: 多个 `<item>` 自动转换为HTML无序列表
- **HTML安全处理**: 自动清理危险标签，保留安全元素
- **优雅降级**: 未知标签被安全移除，保留文本内容
- **前端HTML渲染**: 支持在定义、解释、记忆技巧中显示格式化内容