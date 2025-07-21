# Utils - 工具函数库

此目录包含前端应用的工具函数，提供API调用、数据处理等通用功能。

## 📋 工具函数列表

- **`api.ts`** - API客户端和HTTP请求封装

## 🌐 api.ts - API客户端

### 功能概述
封装应用的所有API调用，提供类型安全的HTTP客户端，统一处理认证、错误和响应格式。

### 核心功能
- ✅ **HTTP客户端** - 基于Axios的请求封装
- ✅ **认证集成** - 自动添加JWT token
- ✅ **错误处理** - 统一的错误响应处理
- ✅ **类型安全** - 完整的TypeScript类型定义
- ✅ **请求拦截** - 自动添加认证头和配置

### API客户端配置
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { supabase } from '../lib/supabase';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 自动添加认证token
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理认证错误
    if (error.response?.status === 401) {
      // 重定向到登录页或刷新token
    }
    
    return Promise.reject(error);
  }
);
```

## 🔧 API接口定义

### 单词查询API
```typescript
interface WordQueryAPI {
  queryWord: (request: WordQueryRequest) => Promise<WordQueryResponse>;
  getUserStats: () => Promise<UserStatsResponse>;
}

// 单词查询
const queryWord = async (request: WordQueryRequest): Promise<WordQueryResponse> => {
  try {
    const response = await apiClient.post<WordQueryResponse>('/words/query', request);
    return response.data;
  } catch (error: any) {
    throw new APIError(
      error.response?.data?.error || error.message,
      error.response?.status || 500
    );
  }
};

// 用户统计
const getUserStats = async (): Promise<UserStatsResponse> => {
  try {
    const response = await apiClient.get<UserStatsResponse>('/user/stats');
    return response.data;
  } catch (error: any) {
    throw new APIError(
      error.response?.data?.error || error.message,
      error.response?.status || 500
    );
  }
};
```

### 健康检查API
```typescript
// 系统健康检查
const healthCheck = async (): Promise<HealthResponse> => {
  try {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  } catch (error: any) {
    throw new APIError('健康检查失败', 500);
  }
};
```

## 🛡️ 错误处理

### 自定义错误类
```typescript
export class APIError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}
```

### 错误分类处理
```typescript
const handleAPIError = (error: any): never => {
  if (error.response) {
    // 服务器响应错误
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        throw new APIError(data.error || '请求参数错误', 400, 'BAD_REQUEST');
      case 401:
        throw new APIError('请先登录', 401, 'UNAUTHORIZED');
      case 403:
        throw new APIError('没有权限执行此操作', 403, 'FORBIDDEN');
      case 429:
        throw new APIError('请求过于频繁，请稍后再试', 429, 'RATE_LIMIT');
      case 500:
        throw new APIError('服务器内部错误', 500, 'INTERNAL_ERROR');
      default:
        throw new APIError(data.error || `请求失败 (${status})`, status);
    }
  } else if (error.request) {
    // 网络错误
    throw new APIError('网络连接失败，请检查网络设置', 0, 'NETWORK_ERROR');
  } else {
    // 其他错误
    throw new APIError(error.message || '未知错误', 500, 'UNKNOWN_ERROR');
  }
};
```

## 🔐 认证集成

### Token管理
```typescript
// 获取当前认证token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('获取认证token失败:', error);
    return null;
  }
};

// 检查token是否有效
const isTokenValid = async (): Promise<boolean> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return !error && !!user;
  } catch (error) {
    return false;
  }
};
```

### 自动重新认证
```typescript
// 请求拦截器中的token处理
apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  
  if (!token) {
    // 重定向到登录页或抛出认证错误
    throw new APIError('用户未登录', 401, 'NOT_AUTHENTICATED');
  }
  
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器中的token刷新
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 尝试刷新token
      try {
        await supabase.auth.refreshSession();
        // 重试原请求
        return apiClient.request(error.config);
      } catch (refreshError) {
        // 刷新失败，重定向到登录页
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
```

## 📊 请求监控

### 请求日志
```typescript
// 请求日志中间件
const requestLogger = (config: AxiosRequestConfig) => {
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
    data: config.data,
    params: config.params,
    timestamp: new Date().toISOString()
  });
  
  return config;
};

// 响应日志中间件
const responseLogger = (response: any) => {
  console.log(`[API Response] ${response.status} ${response.config.url}`, {
    data: response.data,
    duration: Date.now() - response.config.metadata?.startTime,
    timestamp: new Date().toISOString()
  });
  
  return response;
};
```

### 性能监控
```typescript
// 添加请求时间戳
apiClient.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

// 计算请求耗时
apiClient.interceptors.response.use((response) => {
  const duration = Date.now() - response.config.metadata?.startTime;
  
  // 记录慢请求
  if (duration > 5000) {
    console.warn(`[Slow Request] ${response.config.url} took ${duration}ms`);
  }
  
  return response;
});
```

## 🚀 性能优化

### 请求缓存
```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};
```

### 请求去重
```typescript
const pendingRequests = new Map<string, Promise<any>>();

const dedupeRequest = async (key: string, request: () => Promise<any>) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = request();
  pendingRequests.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
};
```

## 📱 导出接口

```typescript
// 导出API对象
export const wordApi = {
  queryWord,
  getUserStats
};

export const systemApi = {
  healthCheck
};

// 导出工具函数
export {
  APIError,
  getAuthToken,
  isTokenValid
};

// 导出类型
export type {
  WordQueryRequest,
  WordQueryResponse,
  UserStatsResponse,
  HealthResponse
};
```

---

**📦 模块状态**: ✅ 生产环境稳定运行  
**🌐 HTTP客户端**: Axios + 自动认证  
**🛡️ 错误处理**: 分类处理 + 用户友好提示