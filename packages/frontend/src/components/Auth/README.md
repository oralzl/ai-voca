# Auth Components - 认证组件集合

用户认证相关的React组件，提供完整的注册、登录、用户管理功能。

## 📋 组件清单

- **`AuthModal.tsx`** - 认证模态框容器
- **`LoginForm.tsx`** - 登录表单组件  
- **`SignupForm.tsx`** - 注册表单组件
- **`UserProfile.tsx`** - 用户资料展示

## 🔧 组件详解

### AuthModal.tsx - 认证模态框
**作用**: 统一的模态框容器，承载登录和注册表单

**核心功能**:
- ✅ 模态框显示/隐藏控制
- ✅ 登录/注册模式切换
- ✅ 背景遮罩和关闭功能
- ✅ 键盘ESC关闭支持

**Props接口**:
```typescript
interface AuthModalProps {
  isOpen: boolean;                    // 模态框开关状态
  onClose: () => void;               // 关闭回调函数
  initialMode?: 'login' | 'signup';  // 初始显示模式
}
```

**使用示例**:
```typescript
const [showAuth, setShowAuth] = useState(false);
const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

<AuthModal
  isOpen={showAuth}
  onClose={() => setShowAuth(false)}
  initialMode={authMode}
/>
```

### LoginForm.tsx - 登录表单
**作用**: 用户登录界面，处理邮箱密码认证

**核心功能**:
- ✅ 表单验证（邮箱格式、密码长度）
- ✅ 登录状态管理（加载、成功、失败）
- ✅ 错误信息显示
- ✅ 记住我功能（可选）

**表单字段**:
```typescript
interface LoginFormData {
  email: string;     // 用户邮箱
  password: string;  // 用户密码
}
```

**验证规则**:
- 邮箱：必须符合邮箱格式
- 密码：最少6位字符
- 实时验证提示

**状态管理**:
```typescript
const [formData, setFormData] = useState({
  email: '',
  password: ''
});
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

### SignupForm.tsx - 注册表单
**作用**: 新用户注册界面，创建用户账号

**核心功能**:
- ✅ 用户信息收集
- ✅ 密码强度验证
- ✅ 重复密码确认
- ✅ 用户协议确认

**表单字段**:
```typescript
interface SignupFormData {
  email: string;           // 邮箱地址
  password: string;        // 登录密码
  confirmPassword: string; // 确认密码
  displayName: string;     // 显示名称
}
```

**验证逻辑**:
- 邮箱唯一性检查
- 密码强度要求（8位以上，包含字母数字）
- 两次密码输入一致性
- 显示名称长度限制（2-20字符）

**注册流程**:
```typescript
1. 表单验证通过
2. 调用Supabase注册API
3. 创建用户档案
4. 自动登录
5. 跳转到主界面
```

### UserProfile.tsx - 用户资料
**作用**: 显示用户信息和账号管理功能

**核心功能**:
- ✅ 用户基本信息展示
- ✅ 账号统计信息
- ✅ 登出功能
- ✅ 用户设置（未来扩展）

**显示信息**:
```typescript
interface UserDisplayInfo {
  email: string;              // 用户邮箱
  displayName?: string;       // 显示名称
  joinDate: string;          // 注册时间
  lastLoginDate: string;     // 最后登录
  totalQueries: number;      // 查询总数
  avatar?: string;           // 用户头像（未来）
}
```

**操作功能**:
- 安全登出（清除本地token）
- 查看使用统计
- 账号设置入口

## 🔐 认证流程

### 登录流程
```
1. 用户输入邮箱密码
2. 前端表单验证
3. 调用Supabase auth.signInWithPassword
4. 成功后保存session到Context
5. 关闭模态框，更新UI状态
```

### 注册流程
```
1. 用户填写注册信息
2. 前端验证（邮箱格式、密码强度等）
3. 调用Supabase auth.signUp
4. 创建用户profile记录
5. 自动登录并更新状态
```

### 登出流程
```
1. 用户点击登出
2. 调用Supabase auth.signOut
3. 清除Context中的用户状态
4. 重定向到未登录状态
```

## 🎨 UI设计特点

### 视觉设计
- **简洁现代**: 清晰的表单布局
- **一致性**: 统一的输入框和按钮样式
- **可访问性**: 支持键盘导航
- **响应式**: 适配移动设备

### 交互体验
- **实时验证**: 输入时即时反馈
- **加载状态**: 操作过程中的视觉反馈
- **错误提示**: 友好的错误信息显示
- **成功反馈**: 操作成功的确认信息

### 样式规范
```css
/* 表单容器 */
.auth-form {
  max-width: 400px;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 输入框样式 */
.auth-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 1rem;
}

/* 提交按钮 */
.auth-button {
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}
```

## 🛡️ 安全考虑

### 输入验证
- **前端验证**: 基本格式和长度检查
- **后端验证**: Supabase的服务端验证
- **XSS防护**: 输入内容转义处理

### 密码安全
- **强度要求**: 最少8位，包含字母和数字
- **传输加密**: HTTPS传输保护
- **存储安全**: Supabase加密存储

### 会话管理
- **JWT Token**: 安全的会话token
- **自动过期**: token过期自动登出
- **单点登录**: 跨标签页的状态同步

## 🔄 状态管理

### Context集成
```typescript
// 使用AuthContext获取认证状态
const { user, signIn, signUp, signOut, loading } = useAuth();

// 登录操作
const handleLogin = async (email: string, password: string) => {
  const { error } = await signIn(email, password);
  if (error) {
    setError(error.message);
  } else {
    onSuccess();
  }
};
```

### 错误处理
```typescript
// 统一的错误处理
const handleAuthError = (error: AuthError) => {
  switch (error.message) {
    case 'Invalid login credentials':
      return '邮箱或密码错误';
    case 'Email already in use':
      return '该邮箱已被注册';
    default:
      return '操作失败，请稍后重试';
  }
};
```

---

**📦 组件状态**: ✅ 生产环境稳定运行  
**🔐 认证方式**: Supabase Auth + JWT  
**🎨 UI风格**: 现代简洁的表单设计