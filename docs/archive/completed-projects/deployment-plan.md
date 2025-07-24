# AI词汇应用部署方案

## 📋 项目概述

本文档规划了基于 **Supabase + Vercel + Cloudflare** 的完全免费部署方案，并详细说明了用户注册登录功能的实现方案。

## 🏗️ 架构设计

### 总体架构图

```
用户 → Cloudflare CDN → Vercel 前端 → Vercel Serverless Functions → Supabase 数据库
                                           ↓
                                    AiHubMix AI 服务
```

### 核心组件

1. **前端部署**: Vercel 静态托管 (React + Vite)
2. **后端部署**: Vercel Serverless Functions (Express.js → API Routes)
3. **数据库**: Supabase (PostgreSQL + Auth + Real-time)
4. **CDN**: Cloudflare (域名管理 + 加速 + 安全)
5. **认证**: Supabase Auth (Email/Google/GitHub)

## 🔑 用户认证功能设计

### 认证流程

1. **注册/登录**: 通过 Supabase Auth
2. **会话管理**: JWT Token + Refresh Token
3. **权限控制**: 基于用户 ID 的查询限制
4. **免费额度**: 每用户每日查询次数限制

### 用户数据模型

```sql
-- 用户表 (Supabase Auth 自动管理)
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户扩展信息表
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name VARCHAR(100),
  avatar_url TEXT,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 查询历史表
CREATE TABLE public.word_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  word VARCHAR(100) NOT NULL,
  query_params JSONB,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 索引优化
  INDEX idx_user_queries ON user_id,
  INDEX idx_word_search ON word,
  INDEX idx_created_at ON created_at
);

-- 用户查询限制表
CREATE TABLE public.user_query_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  daily_queries INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  max_daily_queries INTEGER DEFAULT 100,
  
  -- 每日自动重置
  CONSTRAINT valid_daily_queries CHECK (daily_queries >= 0)
);
```

### 权限策略 (RLS)

```sql
-- 启用行级安全
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_query_limits ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own queries" ON public.word_queries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own limits" ON public.user_query_limits
  FOR ALL USING (auth.uid() = user_id);
```

## 🚀 部署方案详解

### 1. Supabase 配置

#### 1.1 数据库设置
```bash
# 创建 Supabase 项目
1. 访问 https://supabase.com
2. 创建新项目 (免费计划: 500MB 数据库, 50MB 文件存储)
3. 获取项目 URL 和 anon key
4. 执行上述 SQL 创建表结构
```

#### 1.2 认证设置
```javascript
// Supabase Auth 配置
const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}
```

### 2. Vercel 部署

#### 2.1 前端部署
```bash
# 部署前端到 Vercel
1. 连接 GitHub 仓库到 Vercel
2. 设置构建命令: npm run build:frontend
3. 设置输出目录: packages/frontend/dist
4. 配置环境变量 (见下文)
```

#### 2.2 后端迁移到 API Routes
```typescript
// 将 Express.js 后端迁移到 Vercel API Routes
// api/words/query.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { WordService } from '../../packages/backend/src/services/WordService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 认证检查
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // 查询限制检查
  const { data: limits } = await supabase
    .from('user_query_limits')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  if (limits && limits.daily_queries >= limits.max_daily_queries) {
    return res.status(429).json({ error: 'Daily query limit exceeded' });
  }
  
  // 处理查询
  const wordService = new WordService();
  const result = await wordService.queryWord(req.body);
  
  // 记录查询历史
  await supabase.from('word_queries').insert({
    user_id: user.id,
    word: req.body.word,
    query_params: req.body,
    response_data: result
  });
  
  // 更新查询计数
  await supabase.rpc('increment_daily_queries', { user_id: user.id });
  
  res.json(result);
}
```

### 3. Cloudflare 配置

#### 3.1 域名设置
```bash
# Cloudflare DNS 配置
1. 添加域名到 Cloudflare
2. 配置 CNAME 记录指向 Vercel
3. 启用 SSL/TLS (Full 模式)
4. 配置页面规则优化缓存
```

#### 3.2 性能优化
```javascript
// cloudflare-workers.js (可选)
// 边缘缓存静态资源
export default {
  async fetch(request) {
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);
    
    // 检查缓存
    let response = await cache.match(cacheKey);
    if (!response) {
      response = await fetch(request);
      
      // 缓存静态资源
      if (request.url.includes('/assets/')) {
        response = new Response(response.body, response);
        response.headers.set('Cache-Control', 'public, max-age=86400');
        await cache.put(cacheKey, response.clone());
      }
    }
    
    return response;
  }
};
```

## 🔧 技术实现细节

### 1. 前端改造

#### 1.1 添加认证组件
```typescript
// packages/frontend/src/components/Auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AuthContextType {
  user: any;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### 1.2 更新 API 调用
```typescript
// packages/frontend/src/hooks/useWordQuery.ts
import { useAuth } from '../components/Auth/AuthProvider';

export function useWordQuery() {
  const { user } = useAuth();
  
  const queryWord = async (word: string, includeExample?: boolean) => {
    if (!user) {
      throw new Error('Please sign in to query words');
    }
    
    const { data: session } = await supabase.auth.getSession();
    
    const response = await fetch('/api/words/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session?.access_token}`
      },
      body: JSON.stringify({ word, includeExample })
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Daily query limit exceeded. Please try again tomorrow.');
      }
      throw new Error('Query failed');
    }
    
    return response.json();
  };
  
  return { queryWord };
}
```

### 2. 后端改造

#### 2.1 迁移到 API Routes
```typescript
// api/auth/callback.ts - 处理 OAuth 回调
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;
  
  if (code) {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    
    await supabase.auth.exchangeCodeForSession(String(code));
  }
  
  res.redirect('/');
}
```

#### 2.2 查询限制中间件
```typescript
// lib/middleware/queryLimit.ts
export async function checkQueryLimit(userId: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const today = new Date().toISOString().split('T')[0];
  
  let { data: limits } = await supabase
    .from('user_query_limits')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (!limits) {
    // 创建新的限制记录
    const { data } = await supabase
      .from('user_query_limits')
      .insert({ user_id: userId })
      .select()
      .single();
    limits = data;
  }
  
  // 检查是否需要重置每日计数
  if (limits.last_reset_date !== today) {
    await supabase
      .from('user_query_limits')
      .update({ 
        daily_queries: 0, 
        last_reset_date: today 
      })
      .eq('user_id', userId);
    limits.daily_queries = 0;
  }
  
  return limits;
}
```

## 🌍 环境配置

### 1. Vercel 环境变量
```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI 服务配置
AIHUBMIX_API_KEY=your-ai-api-key
AIHUBMIX_API_URL=https://aihubmix.com/v1
AIHUBMIX_MODEL=gemini-2.5-flash-lite-preview-06-17

# 前端环境变量
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-app.vercel.app
```

### 2. Supabase 环境变量
```env
# 在 Supabase 项目设置中配置
AIHUBMIX_API_KEY=your-ai-api-key
AIHUBMIX_API_URL=https://aihubmix.com/v1
```

## 📊 免费额度分析

### 服务限制对比

| 服务 | 免费额度 | 付费起步价 |
|------|----------|------------|
| **Vercel** | 100GB 带宽/月<br>1000 次函数调用/月 | $20/月 |
| **Supabase** | 500MB 数据库<br>50MB 文件存储<br>50,000 MAU | $25/月 |
| **Cloudflare** | 无限带宽<br>100,000 请求/天 | $0 |

### 预估用户容量

基于免费额度，应用可支持：
- **日活用户**: ~1000 人
- **每用户日查询**: 100 次
- **数据存储**: 约 10,000 查询历史记录
- **文件存储**: 基础 UI 资源

## 🚀 部署步骤

### 第一阶段：基础部署

1. **设置 Supabase 项目**
   ```bash
   # 创建项目并执行 SQL 脚本
   # 配置认证提供商
   # 设置 RLS 策略
   ```

2. **准备代码**
   ```bash
   # 添加认证组件
   npm install @supabase/supabase-js
   
   # 迁移后端到 API Routes
   mkdir -p api/words
   # 创建 API 路由文件
   ```

3. **部署到 Vercel**
   ```bash
   # 连接 GitHub 仓库
   # 配置构建设置
   # 设置环境变量
   ```

4. **配置 Cloudflare**
   ```bash
   # 添加域名
   # 配置 DNS
   # 启用 SSL
   ```

### 第二阶段：功能增强

1. **用户体验优化**
   - 查询历史记录
   - 收藏夹功能
   - 学习进度追踪

2. **性能优化**
   - 查询结果缓存
   - 预加载常用单词
   - 离线支持

3. **扩展功能**
   - 单词本导出
   - 学习统计
   - 社交分享

## 📈 监控和维护

### 1. 性能监控
```typescript
// 使用 Vercel Analytics
import { Analytics } from '@vercel/analytics/react';

// 使用 Supabase 实时监控
const { data, error } = await supabase
  .from('word_queries')
  .select('*', { count: 'exact' })
  .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
```

### 2. 错误追踪
```typescript
// 集成 Sentry (可选)
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 3. 用户反馈
```sql
-- 用户反馈表
CREATE TABLE public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  feedback_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 总结

这个部署方案实现了：

✅ **完全免费**: 利用三个平台的免费额度  
✅ **高性能**: CDN 加速 + 边缘计算  
✅ **安全可靠**: 现代认证 + 数据加密  
✅ **易于扩展**: 微服务架构 + 无服务器  
✅ **用户友好**: 现代 UI + 个性化体验  

通过这个方案，你可以快速部署一个生产就绪的 AI 词汇应用，支持用户注册登录、查询限制、历史记录等完整功能，同时保持零成本运营。

---

*下一步：开始第一阶段部署，或者详细讨论某个具体实现细节。*