# Contexts - React上下文管理

此目录包含应用的全局状态管理，使用React Context API实现跨组件的状态共享。

## 📋 Context列表

- **`AuthContext.tsx`** - 用户认证状态管理

## 🔐 AuthContext.tsx - 认证上下文

### 功能概述
管理应用的用户认证状态，提供登录、注册、登出等功能，并在所有组件间共享用户信息。

### 核心功能
- ✅ **用户状态管理** - 当前登录用户信息
- ✅ **会话管理** - JWT token的存储和验证
- ✅ **认证操作** - 登录、注册、登出功能
- ✅ **自动恢复** - 页面刷新时恢复用户状态
- ✅ **加载状态** - 认证操作的加载状态管理

### 类型定义
```typescript
// 用户信息接口
interface User {
  id: string;
  email: string;
  user_metadata: {
    display_name?: string;
  };
  created_at: string;
}

// 认证上下文接口
interface AuthContextType {
  user: User | null;                    // 当前用户
  session: Session | null;              // 当前会话
  loading: boolean;                     // 加载状态
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}
```

### Provider组件
```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 认证方法实现...
  
  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Hook使用
```typescript
// 在组件中使用认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 组件中的使用示例
const MyComponent = () => {
  const { user, signIn, signOut, loading } = useAuth();
  
  if (loading) return <div>加载中...</div>;
  
  return (
    <div>
      {user ? (
        <div>
          <p>欢迎，{user.email}</p>
          <button onClick={signOut}>登出</button>
        </div>
      ) : (
        <button onClick={() => signIn(email, password)}>登录</button>
      )}
    </div>
  );
};
```

## 🔧 核心功能实现

### 用户注册
```typescript
const signUp = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<AuthResponse> => {
  setLoading(true);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });
    
    if (error) throw error;
    
    // 自动登录
    if (data.user && data.session) {
      setUser(data.user);
      setSession(data.session);
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  } finally {
    setLoading(false);
  }
};
```

### 用户登录
```typescript
const signIn = async (
  email: string, 
  password: string
): Promise<AuthResponse> => {
  setLoading(true);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    if (data.user && data.session) {
      setUser(data.user);
      setSession(data.session);
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  } finally {
    setLoading(false);
  }
};
```

### 用户登出
```typescript
const signOut = async (): Promise<void> => {
  setLoading(true);
  
  try {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  } catch (error) {
    console.error('Sign out error:', error);
  } finally {
    setLoading(false);
  }
};
```

### 会话恢复
```typescript
useEffect(() => {
  // 获取初始会话
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  // 监听认证状态变化
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

## 🛡️ 安全特性

### Token管理
- **自动续期**: Supabase自动处理token刷新
- **安全存储**: token存储在httpOnly cookie中
- **过期处理**: token过期时自动登出

### 状态同步
- **跨标签页**: 多个标签页的认证状态同步
- **实时更新**: 认证状态变化的实时响应
- **持久化**: 用户关闭浏览器后重新打开保持登录

### 错误处理
```typescript
// 统一的错误处理
const handleAuthError = (error: any) => {
  switch (error.message) {
    case 'Invalid login credentials':
      return '邮箱或密码错误';
    case 'Email already in use':
      return '该邮箱已被注册';
    case 'Password should be at least 6 characters':
      return '密码至少需要6位字符';
    default:
      return error.message || '操作失败，请稍后重试';
  }
};
```

## 📊 使用模式

### 应用入口配置
```typescript
// main.tsx 或 App.tsx
import { AuthProvider } from './contexts/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 应用路由 */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};
```

### 认证保护路由
```typescript
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

### 条件渲染
```typescript
const Navigation = () => {
  const { user } = useAuth();
  
  return (
    <nav>
      {user ? (
        <UserMenu user={user} />
      ) : (
        <LoginButton />
      )}
    </nav>
  );
};
```

## 🔄 状态流转

### 认证状态图
```
初始状态 (loading: true)
    ↓
检查本地session
    ↓
有session → 已登录状态 (user: User, loading: false)
    ↓
无session → 未登录状态 (user: null, loading: false)
    ↓
用户操作 (登录/登出)
    ↓
更新状态并通知所有订阅组件
```

### 事件监听
```typescript
// 监听认证状态变化
supabase.auth.onAuthStateChange((event, session) => {
  switch (event) {
    case 'SIGNED_IN':
      console.log('用户已登录');
      break;
    case 'SIGNED_OUT':
      console.log('用户已登出');
      break;
    case 'TOKEN_REFRESHED':
      console.log('Token已刷新');
      break;
    case 'USER_UPDATED':
      console.log('用户信息已更新');
      break;
  }
});
```

---

**📦 Context状态**: ✅ 生产环境稳定运行  
**🔐 认证服务**: Supabase Auth  
**🔄 状态管理**: React Context + Local Storage