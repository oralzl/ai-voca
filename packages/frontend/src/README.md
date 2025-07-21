# Source Code - React前端源码

此目录包含React前端应用的所有源代码，采用现代化的TypeScript + React Hooks架构。

## 📁 目录结构

```
src/
├── components/          # React组件
│   ├── Auth/           # 认证相关组件
│   ├── WordQueryForm   # 单词查询表单
│   └── WordResult      # 查询结果展示
├── contexts/           # React Context
├── hooks/             # 自定义Hooks
├── lib/               # 库配置
├── utils/             # 工具函数
├── App.tsx            # 主应用组件
├── main.tsx           # 应用入口
└── *.css              # 样式文件
```

## 🧩 核心组件

### 应用结构
- **`App.tsx`** - 主应用组件，包含整体布局和状态管理
- **`main.tsx`** - React应用入口，挂载到DOM

### 认证系统
- **`contexts/AuthContext.tsx`** - 全局认证状态管理
- **`components/Auth/`** - 登录、注册、用户资料组件

### 单词查询
- **`components/WordQueryForm.tsx`** - 单词输入和查询表单
- **`components/WordResult.tsx`** - 查询结果展示和重试功能
- **`hooks/useWordQuery.ts`** - 单词查询逻辑封装

## 🔧 技术栈

### 核心框架
- **React 18** - 现代化的React框架
- **TypeScript** - 完整的类型安全支持
- **Vite** - 快速的构建工具

### 状态管理
- **React Context** - 全局状态管理（认证状态）
- **React Hooks** - 组件内状态管理
- **Custom Hooks** - 业务逻辑封装

### UI和样式
- **CSS Modules** - 模块化样式管理
- **响应式设计** - 适配桌面和移动设备
- **现代化UI** - 简洁的界面设计

### 数据获取
- **Axios** - HTTP客户端
- **Supabase Client** - 数据库和认证客户端
- **错误处理** - 完整的错误边界处理

## 🚀 开发特性

### 热重载
```bash
npm run dev  # 启动开发服务器，支持热重载
```

### 类型检查
```bash
npm run type-check  # TypeScript类型检查
```

### 代码规范
```bash
npm run lint  # ESLint代码检查
```

### 构建优化
```bash
npm run build  # 生产环境构建
```

## 🎯 设计模式

### 组件化设计
- **单一职责**: 每个组件只负责一个功能
- **可复用性**: 组件设计考虑复用场景
- **Props接口**: 清晰的组件属性定义

### Hooks模式
- **逻辑分离**: 业务逻辑从UI组件中分离
- **状态共享**: 通过Custom Hooks共享状态逻辑
- **副作用管理**: 使用useEffect管理副作用

### Context模式
- **全局状态**: 跨组件的状态共享
- **避免Props钻透**: 减少不必要的属性传递
- **类型安全**: TypeScript类型的Context定义

## 🛡️ 错误处理

### 错误边界
```typescript
// 组件级错误处理
try {
  const result = await queryWord(word);
  setResult(result);
} catch (error) {
  setError(error.message);
}
```

### 网络错误
- **超时处理**: 设置合理的请求超时时间
- **重试机制**: 网络失败时的自动重试
- **用户反馈**: 友好的错误提示信息

### 认证错误
- **自动登出**: token过期时自动清除认证状态
- **重定向**: 未认证用户的页面重定向
- **状态同步**: 认证状态的实时同步

## 📱 响应式设计

### 断点设计
```css
/* 移动设备 */
@media (max-width: 768px) { }

/* 平板设备 */
@media (min-width: 769px) and (max-width: 1024px) { }

/* 桌面设备 */
@media (min-width: 1025px) { }
```

### 适配策略
- **弹性布局**: 使用Flexbox和Grid布局
- **相对单位**: rem、em、%等相对单位
- **图片适配**: 响应式图片处理

## 🔄 状态管理流程

### 认证流程
```
登录请求 → AuthContext → 更新状态 → 组件重渲染
```

### 查询流程
```
输入单词 → useWordQuery → API调用 → 状态更新 → UI更新
```

### 错误流程
```
发生错误 → 错误捕获 → 状态更新 → 错误提示
```

---

**📦 目录状态**: ✅ 生产环境运行中  
**🔧 技术架构**: React 18 + TypeScript + Vite  
**🎨 设计模式**: 组件化 + Hooks + Context