# @ai-voca/frontend

AI单词查询前端应用，基于React + TypeScript + Vite构建的现代化单页应用。

## 功能特性

- ⚡ **快速开发**: 基于Vite的快速构建工具
- 🎨 **现代UI**: 响应式设计，支持移动端
- 🔧 **TypeScript**: 完整的类型安全支持
- 📱 **响应式**: 适配桌面和移动设备
- 🚀 **性能优化**: 代码分割和懒加载
- 🔍 **智能查询**: 实时单词验证和错误处理

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

创建 `.env` 文件：

```env
# 后端API地址
VITE_API_URL=http://localhost:3001

# 开发环境
VITE_NODE_ENV=development
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

### 4. 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
├── components/              # React组件
│   ├── WordQueryForm.tsx   # 单词查询表单
│   ├── WordQueryForm.css   # 表单样式
│   ├── WordResult.tsx      # 查询结果展示
│   └── WordResult.css      # 结果样式
├── hooks/                  # 自定义Hooks
│   └── useWordQuery.ts     # 单词查询Hook
├── utils/                  # 工具函数
│   └── api.ts             # API客户端
├── App.tsx                # 主应用组件
├── App.css                # 主应用样式
├── main.tsx               # 应用入口
└── index.css              # 全局样式
```

## 核心组件

### WordQueryForm

单词查询表单组件，提供用户输入界面：

```typescript
import { WordQueryForm } from './components/WordQueryForm';

<WordQueryForm 
  onQuery={handleQuery}
  loading={loading}
  onClear={handleClear}
/>
```

**Props**:
- `onQuery`: 查询回调函数
- `loading`: 加载状态
- `onClear`: 清空回调函数

### WordResult

查询结果展示组件：

```typescript
import { WordResult } from './components/WordResult';

<WordResult 
  result={queryResult}
  onClear={handleClear}
/>
```

**Props**:
- `result`: 查询结果数据
- `onClear`: 清空回调函数

### useWordQuery Hook

封装单词查询逻辑的自定义Hook：

```typescript
import { useWordQuery } from './hooks/useWordQuery';

const { 
  result, 
  loading, 
  error, 
  queryWord, 
  clearResult 
} = useWordQuery();

// 查询单词
await queryWord('hello', 'zh', true);

// 清空结果
clearResult();
```

**返回值**:
- `result`: 查询结果
- `loading`: 加载状态
- `error`: 错误信息
- `queryWord`: 查询函数
- `clearResult`: 清空函数

## API 集成

### API 客户端

基于Axios的API客户端，提供统一的接口调用：

```typescript
import { wordApi } from './utils/api';

// 查询单词
const result = await wordApi.queryWord({
  word: 'hello',
  language: 'zh',
  includeExample: true
});

// 获取API状态
const status = await wordApi.getApiStatus();

// 获取API文档
const docs = await wordApi.getApiDocs();
```

### 错误处理

自动处理网络错误和API错误：

```typescript
// 网络错误
if (!error.response) {
  error.message = '网络连接失败，请检查网络设置';
}

// API错误
if (error.response?.status === 401) {
  error.message = 'API密钥无效';
}
```

## 样式设计

### 设计原则

- **简洁明了**: 清晰的界面布局，突出核心功能
- **响应式**: 适配不同屏幕尺寸
- **用户友好**: 直观的交互设计和反馈

### 颜色方案

```css
:root {
  --primary-color: #3498db;     /* 主色调 */
  --secondary-color: #2c3e50;   /* 次要色调 */
  --success-color: #27ae60;     /* 成功色 */
  --error-color: #e74c3c;       /* 错误色 */
  --warning-color: #f39c12;     /* 警告色 */
  --background-color: #f5f5f5;  /* 背景色 */
  --text-color: #333;           /* 文本色 */
}
```

### 组件样式

- **表单组件**: 圆角设计，清晰的边框和阴影
- **按钮**: 渐变背景，悬停效果
- **结果展示**: 卡片式布局，分层展示信息

## 开发

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
  \"compilerOptions\": {
    \"target\": \"ES2020\",
    \"lib\": [\"ES2020\", \"DOM\", \"DOM.Iterable\"],
    \"module\": \"ESNext\",
    \"moduleResolution\": \"bundler\",
    \"jsx\": \"react-jsx\",
    \"strict\": true
  }
}
```

#### Vite配置

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@ai-voca/shared': resolve(__dirname, '../shared/src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

## 部署

### 构建优化

```bash
# 构建生产版本
npm run build

# 分析构建结果
npm run analyze
```

### 静态部署

构建后的文件位于 `dist/` 目录，可部署到任何静态文件服务器：

- **Netlify**: 直接拖拽 `dist` 目录
- **Vercel**: 连接Git仓库自动部署
- **GitHub Pages**: 使用Actions自动部署

### 环境变量

生产环境配置：

```env
VITE_API_URL=https://your-backend-domain.com
VITE_NODE_ENV=production
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

### 测试文件

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

## 许可证

MIT License