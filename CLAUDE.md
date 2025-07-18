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

**状态管理**: `useWordQuery` hook集中管理所有查询状态（加载、错误、结果）并为组件提供清晰的API。

## 开发工作流

1. 启动开发服务器: `npm run dev`
2. 前端运行在 http://localhost:3000 并配置API代理
3. 后端运行在 http://localhost:3001 并启用CORS
4. 访问API文档: http://localhost:3001/api/words
5. 健康检查: http://localhost:3001/health

当修改共享类型或工具时，在测试前重新构建共享包。

## AI提示词系统

### 当前提示词格式
系统使用专门设计的中文提示词，要求AI返回严格的XML格式：

```xml
<word>
  <text>lemma后的单词</text>
  <lemmatization_explanation>对词形还原结果的简要说明（如有）</lemmatization_explanation>
  <pronunciation>音标（如果适用）</pronunciation>
  <part_of_speech>词性（兼容多词性）</part_of_speech>
  <definition>中文释义</definition>
  <simple_explanation>用常见单词平白地介绍这个单词的英文注释</simple_explanation>
  <examples>
    <example>
      <sentence>英文例句</sentence>
      <translation>中文翻译</translation>
    </example>
  </examples>
  <synonyms>
    <synonym>同义词1</synonym>
  </synonyms>
  <antonyms>
    <antonym>反义词1</antonym>
  </antonyms>
  <etymology>用中文介绍词源信息</etymology>
  <memory_tips>用中文介绍记忆技巧</memory_tips>
</word>
```

### 词形还原分析
系统现在支持词形还原（lemmatization）分析，能够：
- 识别动词时态变化（如 "running" → "run", "went" → "go"）
- 识别名词复数形式（如 "cats" → "cat", "children" → "child"）
- 识别形容词比较级（如 "better" → "good", "fastest" → "fast"）
- 处理同形异义词（如 "leaves" → "leaf"和"leave"）

### 多word响应处理
当AI返回多个 `<word>` 块时：
- 前端只解析和显示第一个word的结构化信息
- 原始响应保持完整，用户可以查看所有AI返回的内容
- 这确保了重要信息不会丢失，同时保持UI的简洁性

## 重要更新记录

### v1.1.0 - 词形还原功能更新
- **移除语言选择**: 系统现在专注于中文解释，移除了英文版本支持
- **新增词形还原**: 添加词形还原分析和显示功能
- **优化提示词**: 采用新的XML格式提示词，提升AI响应质量
- **多word处理**: 支持AI返回多个单词解释，前端智能显示第一个
- **API简化**: 移除了language参数，简化了API接口