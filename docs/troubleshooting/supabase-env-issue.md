# Supabase 环境变量问题故障排除

## 问题描述

在 Vercel 部署时出现以下错误：

```
Error: Missing Supabase environment variables
    at <anonymous> (/vercel/path0/packages/frontend/api/user/stats.ts:19:9)
```

## 问题原因

这个问题是由于在模块加载时就检查环境变量导致的。在 Vercel 的无服务器函数环境中，环境变量可能在模块加载时还没有正确初始化。

## 解决方案

### 1. 修复 API 文件

所有 API 文件都应该在运行时而不是模块加载时检查环境变量。以下是修复模式：

**❌ 错误的方式（模块加载时检查）：**
```typescript
// 在文件顶部直接检查环境变量
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

**✅ 正确的方式（运行时检查）：**
```typescript
// 在 handler 函数中检查环境变量
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    res.status(500).json({
      success: false,
      error: 'Server configuration error'
    });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  // ... 其余代码
}
```

### 2. 已修复的文件

以下文件已经修复了这个问题：

- `packages/frontend/api/user/stats.ts` - 版本 2.1.0
- `packages/frontend/api/words/query.ts` - 版本 3.0.2
- `packages/frontend/api/favorites/list.ts` - 已使用 try-catch 模式
- `packages/frontend/api/favorites/check.ts` - 已使用 try-catch 模式
- `packages/frontend/api/favorites/toggle.ts` - 已使用 try-catch 模式
- `packages/frontend/lib/api/supabase.ts` - 改为导出初始化函数

### 3. 环境变量配置

确保在 Vercel 中正确设置了以下环境变量：

- `SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_SERVICE_KEY` - Supabase 服务密钥
- `SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `AIHUBMIX_API_KEY` - AI Hub Mix API 密钥

### 4. 测试环境变量

创建了一个测试 API 来检查环境变量是否正确加载：

```
GET /api/test-env
```

这个 API 会返回所有环境变量的状态。

### 5. 部署检查脚本

使用以下脚本检查部署环境：

```bash
./scripts/deploy-check.sh
```

## 预防措施

1. **避免模块级别的环境变量检查**：不要在文件顶部直接检查环境变量
2. **使用延迟初始化**：在 handler 函数中初始化 Supabase 客户端
3. **添加错误处理**：使用 try-catch 包装环境变量检查
4. **添加日志**：记录环境变量检查的结果以便调试

## 相关文件

- `packages/frontend/api/test-env.ts` - 环境变量测试 API
- `scripts/deploy-check.sh` - 部署检查脚本
- `docs/troubleshooting/` - 故障排除文档目录 