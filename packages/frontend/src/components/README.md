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
- ✅ 快捷键支持（Enter提交）
- ✅ 加载状态显示

**Props接口**:
```typescript
interface WordQueryFormProps {
  onQuery: (word: string, includeExample?: boolean) => void;
  loading: boolean;
  onClear: () => void;
  disabled?: boolean;
}
```

**使用示例**:
```typescript
<WordQueryForm 
  onQuery={handleQuery}
  loading={loading}
  onClear={handleClear}
  disabled={!user}
/>
```

### WordResult.tsx - 查询结果展示
**功能**: 展示单词查询结果

**特性**:
- ✅ 词形还原信息显示
- ✅ 完整单词信息展示（音标、词性、释义等）
- ✅ 例句列表显示
- ✅ 智能重试功能
- ✅ 原始响应查看
- ✅ HTML内容安全渲染

**Props接口**:
```typescript
interface WordResultProps {
  result: WordQueryResponse | null;
  onClear: () => void;
  onRetry: () => void;
  loading: boolean;
}
```

**显示内容**:
```typescript
// 展示的单词信息
{
  word: "单词本身",
  text: "词形还原后的原形",
  lemmatizationExplanation: "词形还原说明",
  pronunciation: "音标",
  partOfSpeech: "词性",
  definition: "中文释义（支持HTML）",
  simpleExplanation: "英文解释",
  examples: [/* 例句数组 */],
  synonyms: [/* 同义词 */],
  antonyms: [/* 反义词 */],
  etymology: "词源信息",
  memoryTips: "记忆技巧"
}
```

## 🎨 样式设计

### CSS模块化
每个组件都有对应的CSS文件：
```
AuthModal.tsx     → AuthModal.css
LoginForm.tsx     → LoginForm.css
UserProfile.tsx   → UserProfile.css
WordQueryForm.tsx → WordQueryForm.css
WordResult.tsx    → WordResult.css
```

### 设计原则
- **一致性**: 统一的颜色、字体、间距规范
- **响应式**: 适配不同屏幕尺寸
- **可访问性**: 支持键盘导航和屏幕阅读器
- **现代化**: 简洁的现代UI设计

### 主题色彩
```css
:root {
  --primary-color: #3498db;     /* 主色调 - 蓝色 */
  --secondary-color: #2c3e50;   /* 次要色 - 深灰 */
  --success-color: #27ae60;     /* 成功色 - 绿色 */
  --error-color: #e74c3c;       /* 错误色 - 红色 */
  --warning-color: #f39c12;     /* 警告色 - 橙色 */
  --background-color: #f8f9fa;  /* 背景色 - 浅灰 */
  --text-color: #2c3e50;        /* 文本色 - 深灰 */
  --border-color: #dee2e6;      /* 边框色 - 中灰 */
}
```

## 🔧 开发规范

### 组件设计原则
1. **单一职责**: 每个组件只负责一个功能
2. **Props类型**: 使用TypeScript定义清晰的Props接口
3. **状态管理**: 优先使用useState和useEffect
4. **错误处理**: 组件内部处理可预见的错误
5. **可测试性**: 便于单元测试的组件结构

### 命名规范
- **组件名**: PascalCase（如 `AuthModal`）
- **文件名**: 与组件名一致（如 `AuthModal.tsx`）
- **CSS类名**: kebab-case（如 `.auth-modal`）
- **Props名**: camelCase（如 `onClose`）

### 代码结构
```typescript
// 1. 导入部分
import React, { useState, useEffect } from 'react';
import './ComponentName.css';

// 2. 类型定义
interface ComponentProps {
  // Props定义
}

// 3. 组件实现
export const ComponentName: React.FC<ComponentProps> = ({ 
  // Props解构
}) => {
  // 4. 状态和副作用
  const [state, setState] = useState();
  
  // 5. 事件处理函数
  const handleEvent = () => {
    // 处理逻辑
  };
  
  // 6. 渲染部分
  return (
    <div className="component-name">
      {/* JSX内容 */}
    </div>
  );
};
```

## 🧪 测试策略

### 单元测试
- **组件渲染**: 测试组件是否正常渲染
- **Props传递**: 测试Props是否正确传递和处理
- **事件处理**: 测试用户交互事件
- **状态变化**: 测试状态更新逻辑

### 集成测试
- **组件协作**: 测试组件间的交互
- **Context使用**: 测试Context的正确使用
- **API集成**: 测试API调用的集成

---

**📦 组件状态**: ✅ 生产环境稳定运行  
**🎨 UI框架**: 自定义CSS + 响应式设计  
**🔧 开发模式**: TypeScript + React Hooks