# CLAUDE.md

此文件为Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 沟通语言
请保持用中文与我沟通。

## 🎨 设计系统
**⚠️ 重要提醒：所有UI开发必须严格遵循设计系统！**

👉 **[查看完整设计系统文档](DESIGN_SYSTEM.md)** 👈

在进行任何UI相关的开发工作之前，请务必阅读设计系统文档，确保视觉和交互的一致性。设计系统包含：
- 语义化颜色系统和主题配置
- 响应式设计规范和断点系统
- 组件库使用指南和最佳实践
- 动画系统和现代UI效果
- 完整的代码示例和禁止事项


## 云原生架构的"细菌式"特征

1. 精简小巧
微服务：每个服务专注单一功能，像细菌基因一样精简
容器化：最小化运行环境，去除冗余依赖
Serverless：按需执行，真正做到"能量"（计算资源）高效利用
2. 模块化
服务网格：服务间通过标准化接口通信，如同操纵子的调控机制
API Gateway：统一的"基因表达"入口
Kubernetes Operators：可组合的自动化模块
3. 自包含性强
容器镜像：完整打包运行环境，实现真正的"复制-粘贴"
Helm Charts：标准化的部署模板，便于跨环境"基因转移"
GitOps：声明式配置，易于复制和传播



## 项目架构

这是一个云原生部署的AI词汇查询应用，已完整部署到生产环境：

- **@ai-voca/frontend**: React + TypeScript + Vite前端应用，包含API Routes
- **@ai-voca/shared**: 共享类型定义和工具函数
- **数据库 (Supabase)**: PostgreSQL + 内置用户认证系统  
- **AI服务 (AiHubMix)**: 智能单词解释API

### 关键架构模式

**无服务器架构**: 完全基于Vercel API Routes，无需维护传统服务器。所有后端逻辑通过`packages/frontend/api/`目录下的函数实现。

**用户认证**: 集成Supabase认证系统，支持用户注册、登录、JWT token验证。所有API调用都需要认证。

**类型安全**: 虽然移除了workspace依赖，但在API Routes中内联了所有类型定义，确保类型安全。

**AI集成**: 通过无服务器函数直接调用AiHubMix API，包含完整的XML解析和错误处理逻辑。


**数据流**: 前端 → Vercel API Routes → AiHubMix AI / Supabase → 前端显示。`useWordQuery` hook管理整个前端状态生命周期。

## 生产环境

### 🌐 在线访问
**生产环境**: https://ai-voca-frontend.vercel.app

### 🔧 环境变量配置
生产环境在Vercel中配置以下环境变量：

```env
# 前端环境变量
VITE_SUPABASE_URL=https://syryqvbhfvjbctrdxcbv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Routes环境变量  
SUPABASE_URL=https://syryqvbhfvjbctrdxcbv.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI服务配置
AIHUBMIX_API_KEY=sk-qMWbiOmv6BhwydD4858197B955D94d189e451aC4C5Ac26E1
AIHUBMIX_API_URL=https://aihubmix.com/v1
AIHUBMIX_MODEL=gemini-2.5-flash-lite-preview-06-17
```

## 核心命令

### 开发
```bash
# 启动开发服务器（仅前端）
npm run dev

# 前端开发服务器在3000端口
npm run dev:frontend

# 构建前端（生产部署会自动构建）
npm run build:frontend
```

### 测试和质量检查
```bash
# 运行测试
npm run test

# 代码检查
npm run lint

# 清理构建产物
npm run clean
```

## API架构

无服务器API提供以下端点：

### 用户认证相关
- 通过Supabase SDK自动处理注册、登录
- JWT token自动管理
- 行级安全(RLS)保护用户数据

### 单词查询API
- `GET /api/words/query` - 使用URL参数查询单词
- `POST /api/words/query` - 使用JSON body查询单词
- `GET /api/user/stats` - 获取用户查询统计

### API特性
- **认证保护**: 所有API都需要JWT token认证
- **无限查询**: 移除了查询次数限制
- **查询记录**: 自动保存查询历史到数据库
- **错误处理**: 完善的错误处理和用户反馈
- **XML解析**: 内联的XML解析逻辑处理AI响应

### API参数说明
```typescript
// 查询请求参数
interface WordQueryRequest {
  word: string;              // 要查询的单词
  includeExample?: boolean;  // 是否包含例句，默认true
}

// 响应数据结构（支持词形还原）
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

// 查询响应（包含重试参数）
interface WordQueryResponse {
  success: boolean;
  data?: WordExplanation | null;
  error?: string;
  rawResponse?: string;
  timestamp: number;
  queryCount?: number;
  inputParams?: {               // 重试机制参数
    word: string;
    includeExample: boolean;
    timestamp: number;
  };
}
```

## 数据库架构

### Supabase表结构

**user_profiles**: 用户扩展信息
- id (UUID, 关联auth.users)
- display_name (VARCHAR)
- subscription_tier (VARCHAR, 默认'free')
- created_at, updated_at (TIMESTAMP)

**word_queries**: 查询历史记录
- id (UUID)
- user_id (UUID, 关联auth.users)
- word (VARCHAR)
- query_params (JSONB)
- response_data (JSONB)
- created_at (TIMESTAMP)

**user_query_limits**: 查询限制表（目前不使用）
- 保留表结构，但查询功能已移除限制

### 安全机制
- **行级安全(RLS)**: 用户只能访问自己的数据
- **JWT认证**: 所有API调用都需要有效token
- **环境变量**: 所有敏感配置通过环境变量管理

## 开发工作流

### 本地开发
1. 配置环境变量: 复制`.env.example`到`.env`
2. 启动开发服务器: `npm run dev`
3. 前端运行在 http://localhost:3000
4. API调用会路由到Vercel API Routes（本地模拟）

### 生产部署
1. 推送代码到GitHub仓库
2. Vercel自动构建和部署
3. 环境变量在Vercel控制台配置
4. 数据库和认证通过Supabase管理

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

### 智能XML处理
- 支持AI返回的额外标签（如`<item>`, `<tip>`, `<entry>`）
- 自动将多项目转换为HTML列表
- HTML安全处理，防止XSS攻击
- 优雅降级处理未知标签


## 重要更新记录

### v2.0.0 (当前) - 云原生部署版本
- **完整云部署**: 迁移到Vercel + Supabase云架构
- **用户认证系统**: 新增注册、登录、JWT认证
- **移除查询限制**: 用户可无限制查询单词
- **环境变量安全**: 移除所有硬编码，完全使用环境变量
- **无服务器架构**: 使用Vercel API Routes替代Express后端
- **生产环境优化**: 完整的错误处理、安全配置和性能优化

### v1.2.0 - 智能重试功能
- **重试机制**: 新增智能重试功能，支持一键重新查询
- **参数嵌入**: 在AI响应中使用`<input>`标签保存查询参数
- **独立会话**: 每次重试都是独立的AI会话，不继承上下文

### v1.1.1 - 灵活XML标签处理
- **智能标签解析**: 支持AI返回的额外XML标签（如 `<item>`）
- **列表自动转换**: 多个 `<item>` 自动转换为HTML无序列表
- **HTML安全处理**: 自动清理危险标签，保留安全元素

### v1.1.0 - 词形还原功能更新
- **新增词形还原**: 添加词形还原分析和显示功能
- **专注中文解释**: 移除多语言支持，专注中文释义
- **优化提示词**: 采用新的XML格式提示词

### v1.0.0 - 基础版本
- **初始发布**: 基本单词查询功能
- **单体仓库架构**: 传统的前后端分离架构
- **AiHubMix集成**: AI模型API集成

## 关键开发注意事项

**🎨 设计系统合规**: 所有UI组件都必须遵循 [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) 中的规范，使用语义化颜色标记，避免直接颜色值。

**无服务器限制**: API Routes有执行时间和内存限制，需要优化代码性能。

**环境变量**: 前端环境变量必须以`VITE_`开头，API Routes使用标准环境变量。

**认证机制**: 所有API调用都需要在请求头中包含`Authorization: Bearer <token>`。

**错误处理**: 必须处理网络错误、认证错误、AI API错误等各种异常情况。

**类型安全**: 虽然内联了类型定义，但仍要保持严格的TypeScript类型检查。

**JWT Token清理**: 环境变量中的JWT token需要清理换行符和空格，避免header无效。

## 故障排除

### 常见问题

1. **认证失败**: 检查JWT token格式，确保没有换行符
2. **环境变量问题**: 确认Vercel中的环境变量配置正确
3. **API调用失败**: 检查CORS配置和请求格式
4. **数据库连接问题**: 验证Supabase配置和权限设置

### 调试方法

- 查看Vercel函数日志
- 使用浏览器开发者工具检查网络请求
- 检查Supabase仪表板中的实时日志
- 验证环境变量配置

---

**项目状态**: ✅ 已完成部署，功能正常运行
**生产环境**: https://ai-voca-frontend.vercel.app
**维护模式**: 云原生架构，自动扩展，无需手动维护