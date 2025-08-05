# Components - React组件库

此目录包含应用的所有React组件，采用模块化设计，每个组件职责单一且可复用。

## 📁 组件结构

```
components/
├── Auth/                    # 认证相关组件
│   ├── AuthModal.tsx       # 认证模态框
│   ├── LoginForm.tsx       # 登录表单
│   ├── SignupForm.tsx      # 注册表单
│   └── UserProfile.tsx     # 用户资料
├── WordQueryForm.tsx        # 单词查询表单
├── WordResult.tsx          # 查询结果展示
├── SentenceDisplay.tsx     # 句子展示组件
└── *.css                   # 对应的样式文件
```

## 🔐 认证组件 (Auth/)

### AuthModal.tsx - 认证模态框
**功能**: 统一的登录/注册模态框容器

**Props接口**:
```typescript
interface AuthModalProps {
  isOpen: boolean;           // 是否显示模态框
  onClose: () => void;       // 关闭回调
  initialMode?: 'login' | 'signup';  // 初始模式
}
```

**使用示例**:
```typescript
<AuthModal 
  isOpen={showAuth}
  onClose={() => setShowAuth(false)}
  initialMode="login"
/>
```

### LoginForm.tsx - 登录表单
**功能**: 用户登录表单组件

**特性**:
- ✅ 邮箱密码验证
- ✅ 表单状态管理
- ✅ 错误提示显示
- ✅ 加载状态处理

**Props接口**:
```typescript
interface LoginFormProps {
  onSuccess: () => void;     // 登录成功回调
  onSwitchToSignup: () => void;  // 切换到注册
}
```

### SignupForm.tsx - 注册表单
**功能**: 用户注册表单组件

**特性**:
- ✅ 用户信息收集（邮箱、密码、显示名）
- ✅ 密码强度验证
- ✅ 重复密码确认
- ✅ 注册成功处理

**Props接口**:
```typescript
interface SignupFormProps {
  onSuccess: () => void;     // 注册成功回调
  onSwitchToLogin: () => void;   // 切换到登录
}
```

### UserProfile.tsx - 用户资料
**功能**: 显示用户信息和操作

**特性**:
- ✅ 用户信息展示（邮箱、注册时间）
- ✅ 登出功能
- ✅ 查询统计显示
- ✅ 用户头像处理

**Props接口**:
```typescript
interface UserProfileProps {
  user: User;               // 用户信息
  onLogout: () => void;     // 登出回调
}
```

## 🔍 查询组件

### WordQueryForm.tsx - 单词查询表单
**功能**: 单词输入和查询功能

**特性**:
- ✅ 单词输入验证
- ✅ 实时输入提示
- ✅ 查询历史记录
- ✅ 响应式设计

**Props接口**:
```typescript
interface WordQueryFormProps {
  onQuery: (word: string) => void;  // 查询回调
  loading?: boolean;                 // 加载状态
}
```

### WordResult.tsx - 查询结果展示
**功能**: 单词查询结果的详细展示

**特性**:
- ✅ 多维度信息展示（释义、例句、词性等）
- ✅ 收藏功能集成
- ✅ 响应式布局
- ✅ 加载状态处理

**Props接口**:
```typescript
interface WordResultProps {
  result: WordQueryResult;   // 查询结果
  onFavorite: (word: string) => void;  // 收藏回调
  isFavorited?: boolean;     // 是否已收藏
}
```

## 📚 复习组件

### SentenceDisplay.tsx - 句子展示组件
**功能**: 显示生成的复习句子，支持目标词高亮和新词汇提示

**特性**:
- ✅ 目标词高亮显示
- ✅ 新词汇提示功能
- ✅ 难度等级显示
- ✅ 可展开详细信息
- ✅ 响应式设计
- ✅ 工具提示集成

**Props接口**:
```typescript
interface SentenceDisplayProps {
  item: GeneratedItem;       // 生成的句子数据
  showNewTerms?: boolean;    // 是否显示新词汇提示
  expandable?: boolean;      // 是否可展开详细信息
  className?: string;        // 自定义样式类
}
```

**使用示例**:
```typescript
<SentenceDisplay
  item={generatedItem}
  showNewTerms={true}
  expandable={true}
  className="mb-4"
/>
```

**核心功能**:
- **目标词高亮**: 自动识别并高亮显示句子中的目标词汇
- **新词汇提示**: 显示可能的新词汇及其释义和CEFR等级
- **难度评估**: 显示句子的预测CEFR等级
- **详细信息**: 可展开查看生成理由和新词汇详情
- **响应式布局**: 适配不同屏幕尺寸

**子组件**:
- `HighlightedText`: 高亮显示目标词的文本组件
- `NewTermsTooltip`: 新词汇提示组件
- `DifficultyBadge`: 难度等级显示组件

## 🎨 UI组件 (ui/)

### 基础组件
- `button.tsx` - 按钮组件
- `input.tsx` - 输入框组件
- `card.tsx` - 卡片容器
- `badge.tsx` - 标签组件
- `dialog.tsx` - 对话框组件
- `form.tsx` - 表单组件
- `label.tsx` - 标签组件
- `separator.tsx` - 分割线组件
- `skeleton.tsx` - 骨架屏组件
- `tooltip.tsx` - 工具提示组件

### 复合组件
- `enhanced-search-input.tsx` - 增强搜索输入框
- `dropdown-menu.tsx` - 下拉菜单
- `sidebar.tsx` - 侧边栏组件
- `sheet.tsx` - 侧边面板
- `tabs.tsx` - 标签页组件
- `collapsible.tsx` - 可折叠组件

## 📋 组件开发规范

### 1. 文件命名
- 使用 PascalCase 命名组件文件
- 组件名与文件名保持一致
- 使用 `.tsx` 扩展名

### 2. 组件结构
```typescript
/**
 * @fileoverview 组件描述
 * @module ComponentName
 * @description 详细功能说明
 */

import React from 'react';
import { ComponentProps } from './types';

interface ComponentProps {
  // Props 定义
}

export function ComponentName({ ... }: ComponentProps) {
  // 组件实现
}

export default ComponentName;
```

### 3. Props 设计原则
- 使用 TypeScript 接口定义 Props
- 提供合理的默认值
- 支持扩展性（className、style等）
- 添加 JSDoc 注释

### 4. 样式规范
- 使用 Tailwind CSS 类名
- 支持暗色模式
- 响应式设计
- 无障碍访问支持

### 5. 状态管理
- 使用 React Hooks
- 避免过度复杂的状态
- 提供清晰的状态更新接口

### 6. 错误处理
- 提供错误边界
- 显示友好的错误信息
- 支持重试机制

### 7. 性能优化
- 使用 React.memo 优化渲染
- 避免不必要的重新渲染
- 合理使用 useCallback 和 useMemo

### 8. 测试支持
- 组件应该是可测试的
- 提供测试友好的接口
- 支持模拟用户交互

## 🔧 组件使用指南

### 导入组件
```typescript
// 默认导入
import SentenceDisplay from '../components/SentenceDisplay';

// 命名导入
import { SentenceDisplay } from '../components/SentenceDisplay';
```

### 类型导入
```typescript
import type { GeneratedItem } from '@ai-voca/shared';
```

### 样式定制
```typescript
<SentenceDisplay
  item={item}
  className="custom-class"
  showNewTerms={true}
  expandable={true}
/>
```

## 📝 更新日志

### v1.0.0
- ✅ 基础认证组件
- ✅ 单词查询组件
- ✅ 复习系统组件
- ✅ UI组件库集成
- ✅ 响应式设计支持
- ✅ 暗色模式支持