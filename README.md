# AI单词查询应用 - 单体仓库

基于AI的智能单词查询应用，采用单体仓库(Monorepo)架构，提供前端、后端和共享模块的统一开发环境。

## 📋 项目概述

这是一个现代化的单词查询应用，用户可以输入单词并获得详细的AI生成解释，包括释义、例句、同义词等信息。项目采用单体仓库架构，便于代码复用和统一管理。

### 🌟 主要特性

- 🤖 **AI驱动**: 集成AiHubMix AI模型，提供智能单词解释
- 🧠 **词形还原**: 支持词形还原（lemmatization）分析，识别单词原形
- 🏗️ **单体仓库**: 统一管理前端、后端和共享代码
- 🇨🇳 **中文专精**: 专注于中文解释，提供高质量的中文释义
- 📱 **响应式设计**: 适配桌面和移动设备
- 🔧 **类型安全**: 完整的TypeScript支持
- ⚡ **现代化工具**: Vite、Express、React等现代技术栈
- 🛡️ **错误处理**: 完善的错误处理和用户反馈
- 📖 **完整文档**: 详细的API文档和使用示例

## 🏗️ 项目架构

```
ai-voca-2/
├── packages/
│   ├── frontend/          # React前端应用
│   │   ├── src/
│   │   │   ├── components/    # React组件
│   │   │   ├── hooks/        # 自定义Hooks
│   │   │   └── utils/        # 工具函数
│   │   ├── examples/         # 使用示例
│   │   └── README.md
│   ├── backend/           # Node.js后端API
│   │   ├── src/
│   │   │   ├── routes/       # API路由
│   │   │   ├── services/     # 业务逻辑
│   │   │   └── middleware/   # 中间件
│   │   ├── examples/         # API使用示例
│   │   └── README.md
│   └── shared/            # 共享代码
│       ├── types/            # TypeScript类型定义
│       ├── utils/            # 共享工具函数
│       ├── examples/         # 使用示例
│       └── README.md
├── docs/                  # 项目文档
├── package.json          # 根目录配置
├── tsconfig.json         # TypeScript配置
├── .env.example          # 环境变量模板
└── README.md             # 项目说明
```

## 🚀 快速开始

### 1. 环境要求

- Node.js 18+ 
- npm 9+
- 现代浏览器支持

### 2. 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd ai-voca-2

# 安装所有依赖
npm install
```

### 3. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

配置以下环境变量：

```env
# AiHubMix API 配置
AIHUBMIX_API_KEY=your_api_key_here
AIHUBMIX_API_URL=https://aihubmix.com/v1/chat/completions
AIHUBMIX_MODEL=gemini-2.5-flash-lite-preview-06-17

# 服务器配置
PORT=3001
NODE_ENV=development

# 前端配置
REACT_APP_API_URL=http://localhost:3001
```

### 4. 启动开发服务器

```bash
# 启动前端和后端（推荐）
npm run dev

# 或者单独启动
npm run dev:frontend    # 前端 (http://localhost:3000)
npm run dev:backend     # 后端 (http://localhost:3001)
```

### 5. 访问应用

- 前端应用: http://localhost:3000
- 后端API: http://localhost:3001
- API文档: http://localhost:3001/api/words
- 健康检查: http://localhost:3001/health

## 📦 包说明

### @ai-voca/frontend
React前端应用，提供用户界面和交互体验。

**主要功能:**
- 单词输入和查询表单
- AI解释结果展示
- 响应式设计
- 错误处理和加载状态

**技术栈:**
- React 18
- TypeScript
- Vite
- CSS3

### @ai-voca/backend
Node.js后端API服务，处理单词查询请求。

**主要功能:**
- RESTful API接口
- AiHubMix AI集成
- 请求验证和错误处理
- 安全中间件

**技术栈:**
- Node.js
- Express
- TypeScript
- Axios

### @ai-voca/shared
共享类型定义和工具函数。

**主要功能:**
- TypeScript类型定义
- 验证和格式化工具
- AI提示词生成
- 零依赖设计

## 🔧 开发指南

### 常用命令

```bash
# 开发
npm run dev              # 启动前后端开发服务器
npm run dev:frontend     # 仅启动前端
npm run dev:backend      # 仅启动后端

# 构建
npm run build            # 构建所有包
npm run build:frontend   # 构建前端
npm run build:backend    # 构建后端

# 测试
npm run test             # 运行所有测试
npm run lint             # 代码检查

# 清理
npm run clean            # 清理构建文件和依赖
```

### 开发流程

1. **创建新功能**
   - 在相应的包中创建代码
   - 更新共享类型定义（如需要）
   - 添加测试用例

2. **测试验证**
   - 运行单元测试
   - 手动测试功能
   - 检查类型安全

3. **文档更新**
   - 更新组件文档
   - 添加使用示例
   - 更新API文档

### 代码规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint规则
- 组件采用函数式设计
- API遵循RESTful规范
- 错误处理要完整

## 📖 API文档

### 单词查询接口

#### GET /api/words/query

查询单词解释。

**参数:**
- `word` (string, required): 要查询的单词
- `includeExample` (boolean, optional): 是否包含例句，默认 true

**示例:**
```bash
curl \"http://localhost:3001/api/words/query?word=running&includeExample=true\"
```

**响应:**
```json
{
  \"success\": true,
  \"data\": {
    \"word\": \"run\",
    \"text\": \"run\",
    \"lemmatizationExplanation\": \"running是run的现在分词形式，表示正在进行的动作\",
    \"pronunciation\": \"rʌn\",
    \"partOfSpeech\": \"verb\",
    \"definition\": \"跑步；运行；管理\",
    \"simpleExplanation\": \"To move quickly using your legs, or to operate something\",
    \"examples\": [
      {
        \"sentence\": \"She is running in the park.\",
        \"translation\": \"她正在公园里跑步。\"
      }
    ],
    \"synonyms\": [\"jog\", \"sprint\", \"operate\"],
    \"antonyms\": [\"walk\", \"stop\"],
    \"etymology\": \"来自古英语rinnan，意为"流动、跑"，与德语rinnen同源\",
    \"memoryTips\": \"记住run的多重含义：跑步用腿，运行靠动力\"
  },
  \"timestamp\": 1704099600000
}
```

#### POST /api/words/query

POST方式查询单词。

**请求体:**
```json
{
  \"word\": \"running\",
  \"includeExample\": true
}
```

更多API详情请参见 [后端文档](./packages/backend/README.md)。

## 🧠 词形还原功能

### 功能说明

系统现在支持词形还原（lemmatization）分析，能够自动识别输入单词的原形并提供详细说明：

- **动词时态**: `running` → `run` (识别现在分词)
- **名词复数**: `cats` → `cat` (识别复数形式)  
- **形容词比较级**: `better` → `good` (识别比较级)
- **同形异义词**: `leaves` → `leaf/leave` (提供多种可能)

### 使用场景

1. **学习词汇变形**: 理解单词的不同形态
2. **语法分析**: 识别词性和语法功能
3. **词汇扩展**: 通过原形学习更多相关词汇
4. **语言理解**: 提升对英语形态学的认知

### 技术实现

- AI模型自动分析词形变化规律
- 提供中文解释的还原过程
- 支持复杂词形的多重解释
- 优雅降级处理未知词形

## 🔍 使用示例

### 基本用法

```typescript
import { wordApi } from '@ai-voca/frontend/src/utils/api';

// 查询单词（支持词形还原）
const result = await wordApi.queryWord({
  word: 'running',
  includeExample: true
});

if (result.success) {
  console.log('原形:', result.data.text); // "run"
  console.log('词形还原说明:', result.data.lemmatizationExplanation);
  console.log('释义:', result.data.definition);
}
```

### React组件使用

```jsx
import { useWordQuery } from '@ai-voca/frontend/src/hooks/useWordQuery';

function MyComponent() {
  const { result, loading, error, queryWord } = useWordQuery();

  const handleQuery = async () => {
    await queryWord('running', true);
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
        </div>
      )}
      {error && <div>错误: {error}</div>}
    </div>
  );
}
```

更多示例请参见各包的 `examples/` 目录。

## 🚢 部署指南

### 本地部署

```bash
# 构建所有包
npm run build

# 启动生产服务器
npm start
```

### Docker部署

```dockerfile
# 使用官方Node.js镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/shared/package*.json ./packages/shared/

# 安装依赖
RUN npm ci --only=production

# 复制构建文件
COPY packages/backend/dist ./packages/backend/dist
COPY packages/frontend/dist ./packages/frontend/dist
COPY packages/shared/dist ./packages/shared/dist

# 暴露端口
EXPOSE 3001

# 启动应用
CMD [\"node\", \"packages/backend/dist/index.js\"]
```

### 云部署

推荐部署平台：
- **前端**: Vercel、Netlify、GitHub Pages
- **后端**: Railway、Render、Heroku
- **全栈**: AWS、Azure、Google Cloud

## 🔧 故障排除

### 常见问题

1. **API密钥问题**
   ```bash
   # 检查环境变量
   echo $AIHUBMIX_API_KEY
   
   # 重新设置
   export AIHUBMIX_API_KEY=your_key_here
   ```

2. **端口冲突**
   ```bash
   # 查看端口占用
   lsof -i :3001
   
   # 修改端口
   export PORT=3002
   ```

3. **依赖问题**
   ```bash
   # 清理并重新安装
   npm run clean
   npm install
   ```

4. **TypeScript错误**
   ```bash
   # 重新构建共享包
   npm run build -w @ai-voca/shared
   ```

### 获取帮助

- 查看各包的README文档
- 检查examples目录中的示例
- 开启开发者工具查看网络请求
- 查看服务器日志

## 🤝 贡献指南

### 开发环境设置

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

### 贡献类型

- 🐛 Bug修复
- ✨ 新功能开发
- 📝 文档改进
- 🎨 UI/UX优化
- ⚡ 性能优化

### 代码提交规范

```bash
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 🙏 致谢

- [AiHubMix](https://aihubmix.com) - 提供AI模型API
- [React](https://react.dev) - 前端框架
- [Express](https://expressjs.com) - 后端框架
- [TypeScript](https://www.typescriptlang.org) - 类型安全
- [Vite](https://vitejs.dev) - 构建工具

---

## 📋 版本更新

### v1.1.0 (最新) - 词形还原功能
- ✨ 新增词形还原（lemmatization）分析功能
- 🇨🇳 专注中文解释，移除多语言支持
- 🎯 优化AI提示词，采用新的XML格式
- 🔧 API简化，移除language参数
- 🎨 前端UI优化，新增词形还原信息显示
- 📚 多word响应处理，智能显示第一个结果

### v1.0.0 - 基础版本
- 🚀 初始发布，基本单词查询功能
- 🏗️ 单体仓库架构搭建
- 🤖 AiHubMix AI集成
- 💻 React前端 + Express后端
- 📱 响应式设计

---

**项目维护者:** thiskee  
**创建时间:** 2024年1月  
**最后更新:** 2024年7月

如有问题或建议，请创建[Issue](https://github.com/your-repo/issues)或提交[Pull Request](https://github.com/your-repo/pulls)。