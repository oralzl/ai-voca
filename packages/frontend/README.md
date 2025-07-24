# @ai-voca/frontend

AI词汇查询前端应用，基于React + TypeScript + Vite构建的现代化云原生单页应用。现已完整部署到生产环境。

## 🌐 在线访问

**生产环境**: https://ai-voca-frontend.vercel.app

立即注册账号开始使用！

## 🎨 设计系统

**⚠️ 重要提醒：所有UI开发必须严格遵循设计系统！**

👉 **[查看完整设计系统文档](../../DESIGN_SYSTEM.md)** 👈

在进行任何UI相关的开发工作之前，请务必阅读设计系统文档，确保视觉和交互的一致性。

## 功能特性

- ⚡ **云原生架构**: 基于Vercel的无服务器部署
- 👤 **用户认证**: 完整的注册、登录、JWT认证系统
- ♾️ **无限查询**: 用户可无限制查询英文单词
- 🤖 **AI驱动**: 集成AiHubMix AI，提供智能单词解释
- 🧠 **词形还原**: 支持lemmatization分析，识别单词原形
- 🔄 **智能重试**: 一键重试机制，获取新的AI响应
- 🏷️ **XML智能解析**: 处理AI返回的复杂XML格式
- 🇨🇳 **中文专精**: 提供高质量的中文释义和解释
- 📱 **响应式设计**: 适配桌面和移动设备，遵循设计系统规范
- 🔧 **TypeScript**: 完整的类型安全支持
- 🛡️ **安全认证**: JWT token认证，环境变量配置
- 📖 **查询历史**: 自动保存用户查询记录

## 技术架构

### 云原生技术栈
```
前端 (React + Vite)
├── 用户界面层
│   ├── 认证组件 (登录/注册)
│   ├── 查询组件 (单词查询)
│   └── 结果组件 (智能显示)
├── API Routes (Vercel Functions)
│   ├── /api/words/query (单词查询)
│   └── /api/user/stats (用户统计)
├── 数据层 (Supabase)
│   ├── 用户认证 (JWT)
│   ├── 查询记录 (PostgreSQL)
│   └── 行级安全 (RLS)
└── AI服务 (AiHubMix)
    ├── 智能解释
    ├── 词形还原
    └── XML响应
```

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-voca-2
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

创建 `.env` 文件：

```env
# Supabase配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Routes配置 (用于本地开发)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
AIHUBMIX_API_KEY=your_api_key
AIHUBMIX_API_URL=https://aihubmix.com/v1
AIHUBMIX_MODEL=gemini-2.5-flash-lite-preview-06-17
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

### 5. 构建生产版本

```bash
npm run build
```

## 项目结构

```
packages/frontend/
├── src/                         # React前端源码
│   ├── components/              # React组件
│   │   ├── Auth/               # 认证相关组件
│   │   │   ├── AuthModal.tsx   # 认证模态框
│   │   │   ├── LoginForm.tsx   # 登录表单
│   │   │   ├── SignupForm.tsx  # 注册表单
│   │   │   └── UserProfile.tsx # 用户资料
│   │   ├── WordQueryForm.tsx   # 单词查询表单
│   │   └── WordResult.tsx      # 查询结果展示
│   ├── contexts/               # React Context
│   │   └── AuthContext.tsx     # 认证上下文
│   ├── hooks/                  # 自定义Hooks
│   │   └── useWordQuery.ts     # 单词查询Hook
│   ├── utils/                  # 工具函数
│   │   └── api.ts             # API客户端
│   ├── lib/                   # 库配置
│   │   └── supabase.ts        # Supabase客户端
│   ├── App.tsx                # 主应用组件
│   └── main.tsx               # 应用入口
├── api/                        # Vercel API Routes
│   ├── words/
│   │   └── query.ts           # 单词查询API
│   └── user/
│       └── stats.ts           # 用户统计API
├── examples/                   # 使用示例
│   ├── components-example.jsx  # 组件使用示例
│   └── hooks-example.jsx      # Hooks使用示例
└── dist/                      # 构建输出目录
```

## 核心组件

### 1. 认证系统

#### AuthContext
认证上下文，管理用户状态：

```typescript
import { useAuth } from '../contexts/AuthContext';

const { user, session, loading, signIn, signUp, signOut } = useAuth();

// 登录
await signIn('user@example.com', 'password');

// 注册
await signUp('user@example.com', 'password', 'Display Name');

// 登出
await signOut();
```

#### AuthModal
认证模态框组件：

```typescript
import { AuthModal } from './components/Auth/AuthModal';

<AuthModal 
  isOpen={showAuth}
  onClose={() => setShowAuth(false)}
  initialMode="login"
/>
```

### 2. 单词查询系统

#### WordQueryForm
单词查询表单组件：

```typescript
import { WordQueryForm } from './components/WordQueryForm';

<WordQueryForm 
  onQuery={handleQuery}
  loading={loading}
  onClear={handleClear}
/>
```

#### WordResult
查询结果展示组件：

```typescript
import { WordResult } from './components/WordResult';

<WordResult 
  result={queryResult}
  onClear={handleClear}
  onRetry={handleRetry}
/>
```

### 3. useWordQuery Hook

封装单词查询逻辑的自定义Hook：

```typescript
import { useWordQuery } from './hooks/useWordQuery';

const { 
  result, 
  loading, 
  error, 
  queryWord, 
  clearResult,
  retryQuery 
} = useWordQuery();

// 查询单词
await queryWord('hello', true);

// 重试查询（使用相同参数）
await retryQuery();

// 清空结果
clearResult();
```

**返回值**:
- `result`: 查询结果，包含单词解释和重试参数
- `loading`: 加载状态
- `error`: 错误信息
- `queryWord`: 查询函数，需要登录状态
- `clearResult`: 清空函数
- `retryQuery`: 重试函数，使用保存的参数

## API Routes 集成

### API 客户端

基于Axios的API客户端，自动处理认证：

```typescript
import { wordApi } from './utils/api';

// 查询单词（需要登录）
const result = await wordApi.queryWord({
  word: 'hello',
  includeExample: true
});

// 获取用户统计
const stats = await wordApi.getUserStats();
```

### 认证处理

所有API调用自动携带认证token：

```typescript
// 自动从Supabase session获取token
const token = session?.access_token;

// 请求头自动添加
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 错误处理

智能错误处理和用户友好提示：

```typescript
// 认证错误
if (error.response?.status === 401) {
  error.message = '请先登录';
}

// 网络错误
if (!error.response) {
  error.message = '网络连接失败，请检查网络设置';
}
```

## 新功能特性

### 1. 词形还原

系统自动识别单词的词形变化：

```typescript
// 查询 "running" 会自动还原为 "run"
const result = await queryWord('running', true);

// 结果包含词形还原信息
console.log(result.data?.text); // "run"
console.log(result.data?.lemmatizationExplanation); // "running是run的现在分词形式"
```

### 2. 智能重试

一键重试功能，使用保存的查询参数：

```typescript
// 查询后，结果包含重试参数
if (result?.inputParams) {
  // 显示重试按钮
  <button onClick={retryQuery}>重试</button>
}
```

### 3. 无限查询

移除了查询次数限制，用户可以无限制地查询单词：

```typescript
// 不再有查询限制检查
// 用户可以随意查询任意数量的单词
await queryWord('word1', true);
await queryWord('word2', true);
// ... 无限制
```

## 样式设计

### 🎨 设计系统遵循

项目严格遵循 **[DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)** 中定义的设计规范：

- **语义化颜色**: 使用 `text-primary`, `bg-muted` 等语义化标记，禁止直接颜色值
- **响应式设计**: 移动优先的断点系统 (`sm:`, `md:`, `lg:`, `xl:`)
- **现代UI效果**: 玻璃拟态、渐变、动画等现代化效果
- **一致性保证**: 统一的设计语言和组件风格

### 设计原则

- **现代化**: 简洁的界面布局，突出核心功能
- **响应式**: 适配不同屏幕尺寸，遵循设计系统断点
- **用户友好**: 直观的交互设计和反馈
- **一致性**: 严格遵循设计系统规范

### ⚠️ 重要提醒

所有新的UI组件开发都必须：
1. 使用语义化颜色标记（如 `text-foreground`, `bg-card`）
2. 遵循响应式设计模式
3. 应用统一的动画效果（如 `hover-lift`, `hover-scale`）
4. 参考设计系统文档中的完整示例

## 开发指南

### 🎨 UI开发规范

在开始开发前，请务必阅读 **[设计系统文档](../../DESIGN_SYSTEM.md)**：

1. **使用语义化颜色** - 绝不使用 `text-blue-500` 等直接颜色
2. **遵循响应式设计** - 采用移动优先的设计模式
3. **应用设计系统组件** - 优先使用已定义的组件模式
4. **保持一致性** - 所有UI元素都要符合设计系统规范

### 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 开发配置

#### TypeScript配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true
  }
}
```

#### Vite配置

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

## 部署

### Vercel部署（推荐）

1. **连接Git仓库**: 在Vercel控制台连接GitHub仓库
2. **配置环境变量**: 添加所需的环境变量
3. **自动部署**: 推送代码自动触发部署

### 环境变量配置

生产环境在Vercel中配置：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
AIHUBMIX_API_KEY=your_api_key
AIHUBMIX_API_URL=https://aihubmix.com/v1
AIHUBMIX_MODEL=gemini-2.5-flash-lite-preview-06-17
```

### 构建优化

```bash
# 构建生产版本
npm run build

# 分析构建结果
npm run analyze
```

## 测试

### 单元测试

```bash
# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage

# 监听模式
npm run test:watch
```

### 测试文件示例

```typescript
// __tests__/WordQueryForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { WordQueryForm } from '../components/WordQueryForm';

test('renders word input', () => {
  render(<WordQueryForm onQuery={jest.fn()} loading={false} onClear={jest.fn()} />);
  const input = screen.getByPlaceholderText('请输入要查询的单词...');
  expect(input).toBeInTheDocument();
});
```

## 版本历史

### v2.0.0 (当前) - 云原生部署版本
- ☁️ 完整迁移到Vercel + Supabase云架构
- 👤 新增用户注册和认证系统
- ♾️ 移除查询次数限制，支持无限查询
- 🚀 生产环境部署和优化

### v1.2.0 - 智能重试功能
- 🔄 新增智能重试机制
- 📊 独立会话设计
- 🔧 完善的状态管理

### v1.1.0 - 词形还原功能
- ✨ 新增词形还原分析功能
- 🇨🇳 专注中文解释
- 🎯 优化AI提示词

## 许可证

MIT License

---

**🌐 在线体验**: https://ai-voca-frontend.vercel.app  
**📧 问题反馈**: [GitHub Issues](https://github.com/oralzl/ai-voca/issues)  
**🔄 最后更新**: 2024年7月