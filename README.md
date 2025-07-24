# AI词汇查询应用

基于AI的智能英文单词查询应用，提供详细的中文解释、音标、例句等信息。现已部署在Vercel，支持用户注册和无限制查询。

## 🌐 在线访问

**生产环境**: https://ai-voca-frontend.vercel.app

立即访问，注册账号开始使用！

## 📋 项目概述

这是一个现代化的英文单词查询应用，用户可以注册登录后无限制地查询英文单词，获得AI生成的详细中文解释。项目采用无服务器架构，完全部署在云端。

### 🌟 主要特性

- 🤖 **AI驱动**: 集成AiHubMix AI模型，提供智能单词解释
- 👤 **用户系统**: 完整的注册、登录、认证功能
- ♾️ **无限查询**: 移除查询次数限制，用户可自由使用
- 🧠 **词形还原**: 支持词形还原（lemmatization）分析，识别单词原形
- 🔄 **重试功能**: 智能重试机制，可重新查询相同单词
- 🏷️ **XML智能解析**: 处理AI返回的复杂XML标签格式
- 🇨🇳 **中文专精**: 专注于中文解释，提供高质量的中文释义
- 📱 **响应式设计**: 适配桌面和移动设备
- 🔧 **类型安全**: 完整的TypeScript支持
- ☁️ **无服务器架构**: 基于Vercel + Supabase的现代云架构
- 🛡️ **安全认证**: JWT token认证，环境变量配置
- 📖 **查询历史**: 保存用户查询记录

## 🏗️ 技术架构

### 部署架构
```
├── 前端 (Vercel)           # React + TypeScript + Vite
│   ├── 用户界面             # 注册、登录、单词查询
│   ├── API Routes          # 无服务器函数
│   └── 静态资源            
├── 数据库 (Supabase)       # PostgreSQL + 认证
│   ├── 用户管理            # 注册、登录、JWT
│   ├── 查询记录            # 历史查询存储
│   └── 数据安全            # RLS行级安全
└── AI服务 (AiHubMix)       # AI单词解释API
```

### 代码结构
```
ai-voca-2/
├── packages/
│   ├── frontend/           # React前端应用 (Vercel部署)
│   │   ├── src/           # React组件、hooks、utils
│   │   ├── api/           # Vercel API Routes (后端功能)
│   │   └── lib/           # Supabase客户端配置
│   └── shared/            # 共享类型定义和工具
├── docs/                  # 项目文档 (详见下方文档导航)
├── package.json          # 根目录配置
└── README.md             # 项目说明
```


## 🚀 功能特性

### 🔐 用户认证系统
- **注册功能**: 邮箱注册，自动创建用户档案
- **登录登出**: 安全的JWT token认证
- **会话管理**: 自动保持登录状态
- **权限控制**: 只有登录用户可以查询单词

### 🔍 智能单词查询
- **AI解释**: 基于AiHubMix AI的智能单词解释
- **词形还原**: 自动识别单词原形（如running → run）
- **全面信息**: 包含音标、词性、定义、例句、同义词等
- **中文专精**: 提供准确的中文释义和解释

### 🔄 重试功能
- **智能重试**: 一键重新查询，获取新的AI响应
- **参数保存**: 自动保存查询参数，无需重新输入
- **独立会话**: 每次重试都是全新的AI对话

### 📊 数据管理
- **查询历史**: 自动保存所有查询记录
- **无限制**: 移除了查询次数限制
- **数据安全**: 行级安全保护用户数据

## 🛠 本地开发

### 环境要求
- Node.js 18+
- npm 9+

### 快速开始

```bash
# 克隆项目
git clone <repository-url>
cd ai-voca-2

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入相应的API密钥

# 启动开发服务器
npm run dev
```

### 环境变量配置

开发环境需要配置以下环境变量：

```env
# AiHubMix API 配置
AIHUBMIX_API_KEY=your_api_key_here
AIHUBMIX_API_URL=https://aihubmix.com/v1
AIHUBMIX_MODEL=gemini-2.5-flash-lite-preview-06-17

# Supabase配置（开发环境）
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 开发命令

```bash
# 开发
npm run dev              # 启动前后端开发服务器
npm run dev:frontend     # 仅启动前端 (localhost:3000)

# 构建
npm run build            # 构建所有包
npm run build:frontend   # 构建前端

# 测试和检查
npm run test             # 运行测试
npm run lint             # 代码检查
```

## 📖 API文档

### 单词查询接口

#### GET /api/words/query
查询单词解释（需要登录）

**参数:**
- `word` (string, required): 要查询的单词
- `includeExample` (boolean, optional): 是否包含例句，默认 true

**请求头:**
```
Authorization: Bearer <jwt_token>
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "word": "run",
    "text": "run",
    "lemmatizationExplanation": "running是run的现在分词形式",
    "pronunciation": "rʌn",
    "partOfSpeech": "verb",
    "definition": "跑步；运行；管理",
    "simpleExplanation": "To move quickly using your legs",
    "examples": [
      {
        "sentence": "She is running in the park.",
        "translation": "她正在公园里跑步。"
      }
    ],
    "synonyms": ["jog", "sprint"],
    "antonyms": ["walk", "stop"],
    "etymology": "来自古英语rinnan",
    "memoryTips": "记住run的多重含义"
  },
  "inputParams": {
    "word": "run",
    "includeExample": true,
    "timestamp": 1704099600000
  },
  "timestamp": 1704099600000
}
```

#### POST /api/words/query
POST方式查询单词

**请求体:**
```json
{
  "word": "running",
  "includeExample": true
}
```

### 用户统计接口

#### GET /api/user/stats
获取用户查询统计信息

**响应:**
```json
{
  "success": true,
  "data": {
    "totalQueries": 0,
    "todayQueries": 0,
    "remainingQueries": "unlimited",
    "maxDailyQueries": "unlimited"
  }
}
```

## 🔧 词形还原功能

系统支持智能词形还原分析：

- **动词时态**: `running` → `run` (识别现在分词)
- **名词复数**: `cats` → `cat` (识别复数形式)  
- **形容词比较级**: `better` → `good` (识别比较级)
- **复杂变形**: 处理不规则变化

## 🔄 重试机制

智能重试功能的技术实现：

1. **参数嵌入**: 后端在AI响应中插入`<input>`标签保存查询参数
2. **参数提取**: 前端解析响应中的参数信息
3. **状态管理**: React hooks管理重试状态
4. **独立会话**: 每次重试都是全新的AI对话

## 🚢 部署架构

### 生产环境部署

**前端部署**: Vercel
- 自动构建和部署
- 全球CDN加速
- 无服务器函数支持

**数据库**: Supabase
- PostgreSQL数据库
- 内置用户认证
- 实时API支持

**AI服务**: AiHubMix
- 高性能AI模型
- 稳定的API服务

### 环境变量配置

生产环境在Vercel中配置以下变量：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
AIHUBMIX_API_KEY=your_api_key
AIHUBMIX_API_URL=https://aihubmix.com/v1
AIHUBMIX_MODEL=gemini-2.5-flash-lite-preview-06-17
```

## 🔍 使用示例

### React Hook使用

```jsx
import { useWordQuery } from './hooks/useWordQuery';

function MyComponent() {
  const { result, loading, error, queryWord, retryQuery } = useWordQuery();

  const handleQuery = async () => {
    await queryWord('running', true);
  };

  const handleRetry = async () => {
    await retryQuery(); // 使用原始参数重试
  };

  return (
    <div>
      <button onClick={handleQuery} disabled={loading}>
        {loading ? '查询中...' : '查询'}
      </button>
      {result && (
        <div>
          <h3>{result.data?.word}</h3>
          {result.data?.lemmatizationExplanation && (
            <p>词形还原: {result.data.lemmatizationExplanation}</p>
          )}
          <p>释义: {result.data?.definition}</p>
          
          {/* 重试按钮 */}
          {result.inputParams && (
            <button onClick={handleRetry} disabled={loading}>
              {loading ? '重试中...' : '重试'}
            </button>
          )}
        </div>
      )}
      {error && <div>错误: {error}</div>}
    </div>
  );
}
```

## 🔧 故障排除

### 常见问题

1. **登录问题**
   - 检查网络连接
   - 确认邮箱和密码
   - 尝试注册新账号

2. **查询失败**
   - 检查是否已登录
   - 验证单词拼写
   - 尝试重试功能

3. **开发环境问题**
   ```bash
   # 清理并重新安装
   npm run clean
   npm install
   
   # 检查环境变量
   cat .env
   ```

## 📋 版本历史

### v2.0.0 (当前) - 云原生部署版本
- ☁️ 完整迁移到Vercel + Supabase云架构
- 👤 新增用户注册和认证系统
- ♾️ 移除查询次数限制，支持无限查询
- 🔒 环境变量安全配置，移除所有硬编码
- 📊 查询历史记录和用户统计
- 🚀 生产环境部署和优化

### v1.2.0 - 智能重试功能
- 🔄 新增智能重试机制
- 📊 独立会话设计
- 🔧 完善的状态管理

### v1.1.0 - 词形还原功能  
- ✨ 新增词形还原分析功能
- 🇨🇳 专注中文解释
- 🎯 优化AI提示词

### v1.0.0 - 基础版本
- 🚀 初始发布
- 🤖 AiHubMix AI集成
- 💻 React前端 + Express后端

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交代码 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

### 提交规范

```
✨ feat: 添加新功能
🐛 fix: 修复bug
📝 docs: 更新文档
🎨 style: 代码格式调整
♻️ refactor: 代码重构
✅ test: 添加测试
🔧 chore: 构建过程或辅助工具的变动
```

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 🙏 致谢

- [AiHubMix](https://aihubmix.com) - 提供AI模型API
- [Vercel](https://vercel.com) - 前端托管和无服务器函数
- [Supabase](https://supabase.com) - 数据库和认证服务
- [React](https://react.dev) - 前端框架
- [TypeScript](https://www.typescriptlang.org) - 类型安全

---

**🌐 在线体验**: https://ai-voca-frontend.vercel.app  
**📧 问题反馈**: [GitHub Issues](https://github.com/oralzl/ai-voca/issues)  

立即访问开始使用，无限制查询英文单词！