# Hooks - 自定义React Hooks

此目录包含应用的自定义React Hooks，封装了业务逻辑和状态管理，提供可复用的功能模块。

## 📋 Hooks列表

- **`useWordQuery.ts`** - 单词查询功能封装

## 🔍 useWordQuery.ts - 单词查询Hook

### 功能概述
封装单词查询的完整业务逻辑，包括API调用、状态管理、错误处理和重试功能。

### 核心功能
- ✅ **单词查询** - 调用API进行单词查询
- ✅ **状态管理** - 查询结果、加载状态、错误信息
- ✅ **智能重试** - 使用保存的参数重新查询
- ✅ **结果清除** - 清空查询结果
- ✅ **错误处理** - 网络错误和业务错误的处理

### Hook接口
```typescript
interface UseWordQueryReturn {
  result: WordQueryResponse | null;     // 查询结果
  loading: boolean;                     // 加载状态
  error: string | null;                 // 错误信息
  queryWord: (word: string, includeExample?: boolean) => Promise<void>;
  clearResult: () => void;              // 清除结果
  retryQuery: () => Promise<void>;      // 重试查询
}

const useWordQuery = (): UseWordQueryReturn => {
  // Hook实现
};
```

### 基本使用
```typescript
const MyComponent = () => {
  const { 
    result, 
    loading, 
    error, 
    queryWord, 
    clearResult, 
    retryQuery 
  } = useWordQuery();

  const handleSubmit = async (word: string) => {
    await queryWord(word, true);
  };

  if (loading) return <div>查询中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      {result && (
        <div>
          <h3>{result.data?.word}</h3>
          <p>{result.data?.definition}</p>
          <button onClick={retryQuery}>重试</button>
          <button onClick={clearResult}>清除</button>
        </div>
      )}
    </div>
  );
};
```

## 🔧 实现细节

### 状态管理
```typescript
const useWordQuery = () => {
  const [result, setResult] = useState<WordQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 查询函数实现...
};
```

### 查询函数
```typescript
const queryWord = useCallback(async (
  word: string, 
  includeExample: boolean = true
) => {
  // 重置状态
  setLoading(true);
  setError(null);

  try {
    // 调用API
    const response = await wordApi.queryWord({
      word: word.trim(),
      includeExample
    });

    setResult(response);
  } catch (err: any) {
    // 错误处理
    const errorMessage = err.response?.data?.error || err.message || '查询失败';
    setError(errorMessage);
    setResult(null);
  } finally {
    setLoading(false);
  }
}, []);
```

### 重试功能
```typescript
const retryQuery = useCallback(async () => {
  if (!result?.inputParams) {
    setError('无法重试：缺少查询参数');
    return;
  }

  const { word, includeExample } = result.inputParams;
  await queryWord(word, includeExample);
}, [result, queryWord]);
```

### 清除功能
```typescript
const clearResult = useCallback(() => {
  setResult(null);
  setError(null);
}, []);
```

## 🛡️ 错误处理

### 网络错误
```typescript
const handleNetworkError = (error: any) => {
  if (!error.response) {
    return '网络连接失败，请检查网络设置';
  }
  
  switch (error.response.status) {
    case 401:
      return '请先登录';
    case 403:
      return '没有权限执行此操作';
    case 429:
      return '请求过于频繁，请稍后再试';
    case 500:
      return '服务器内部错误，请稍后重试';
    default:
      return error.response.data?.error || '查询失败';
  }
};
```

### 业务错误
```typescript
const handleBusinessError = (response: WordQueryResponse) => {
  if (!response.success) {
    throw new Error(response.error || '查询失败');
  }
  
  if (!response.data) {
    throw new Error('未获取到单词信息');
  }
};
```

## 📊 状态管理模式

### 加载状态流转
```
初始状态: { loading: false, result: null, error: null }
    ↓
开始查询: { loading: true, result: null, error: null }
    ↓
查询成功: { loading: false, result: data, error: null }
    ↓
查询失败: { loading: false, result: null, error: message }
```

### 重试状态
```typescript
// 重试条件检查
const canRetry = result && result.inputParams && !loading;

// 重试按钮状态
<button 
  disabled={!canRetry}
  onClick={retryQuery}
>
  {loading ? '重试中...' : '重试'}
</button>
```

## 🚀 性能优化

### 防抖处理
```typescript
const debouncedQuery = useMemo(
  () => debounce(queryWord, 300),
  [queryWord]
);

// 在输入框中使用防抖查询
const handleInputChange = (value: string) => {
  if (value.trim().length > 2) {
    debouncedQuery(value.trim());
  }
};
```

### 缓存机制
```typescript
const cache = useRef<Map<string, WordQueryResponse>>(new Map());

const queryWordWithCache = useCallback(async (word: string, includeExample: boolean) => {
  const cacheKey = `${word}-${includeExample}`;
  
  // 检查缓存
  if (cache.current.has(cacheKey)) {
    setResult(cache.current.get(cacheKey)!);
    return;
  }
  
  // 执行查询
  await queryWord(word, includeExample);
  
  // 缓存结果
  if (result) {
    cache.current.set(cacheKey, result);
  }
}, [queryWord, result]);
```

### 内存清理
```typescript
useEffect(() => {
  return () => {
    // 组件卸载时清理
    setResult(null);
    setError(null);
    setLoading(false);
  };
}, []);
```

## 🧪 测试策略

### 单元测试
```typescript
import { renderHook, act } from '@testing-library/react';
import { useWordQuery } from './useWordQuery';

describe('useWordQuery', () => {
  it('should handle successful query', async () => {
    const { result } = renderHook(() => useWordQuery());
    
    await act(async () => {
      await result.current.queryWord('hello');
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeDefined();
    expect(result.current.error).toBeNull();
  });
  
  it('should handle query errors', async () => {
    const { result } = renderHook(() => useWordQuery());
    
    await act(async () => {
      await result.current.queryWord(''); // 无效输入
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.result).toBeNull();
  });
});
```

### 集成测试
```typescript
it('should retry with saved parameters', async () => {
  const { result } = renderHook(() => useWordQuery());
  
  // 首次查询
  await act(async () => {
    await result.current.queryWord('test');
  });
  
  const firstResult = result.current.result;
  
  // 重试查询
  await act(async () => {
    await result.current.retryQuery();
  });
  
  // 验证使用了相同参数
  expect(result.current.result?.inputParams).toEqual(
    firstResult?.inputParams
  );
});
```

---

**📦 Hook状态**: ✅ 生产环境稳定运行  
**🔧 业务逻辑**: 完整的单词查询流程封装  
**🚀 性能优化**: 防抖、缓存、内存管理