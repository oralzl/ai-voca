# Supabase 环境变量问题修复总结

## 问题概述

在 Vercel 部署时出现 `Error: Missing Supabase environment variables` 错误，这是由于在模块加载时就检查环境变量导致的。

## 修复内容

### 1. 修复的文件

#### `packages/frontend/api/user/stats.ts`
- **版本**: 2.0.0 → 2.1.0
- **修复**: 移除了模块级别的环境变量检查，改为在 handler 函数中运行时检查
- **状态**: ✅ 已修复

#### `packages/frontend/api/words/query.ts`
- **版本**: 3.0.1 → 3.0.2 → 3.0.3
- **修复**: 
  - 移除了模块加载时的 console.log 语句
  - 修复了 `saveQueryRecord` 函数中的 supabase 变量访问问题
  - 改为使用 `initializeSupabase()` 函数确保客户端正确初始化
- **状态**: ✅ 已修复

#### `packages/frontend/lib/api/supabase.ts`
- **修复**: 将直接导出的 Supabase 客户端改为导出初始化函数
- **原因**: 避免在模块加载时创建客户端实例
- **状态**: ✅ 已修复

### 2. 新增的文件

#### `packages/frontend/api/test-env.ts`
- **用途**: 测试环境变量是否正确加载
- **端点**: `GET /api/test-env`
- **功能**: 返回所有环境变量的状态信息

#### `scripts/deploy-check.sh`
- **用途**: 部署环境检查脚本
- **功能**: 检查 Node.js 版本、环境变量、文件结构等

#### `docs/troubleshooting/supabase-env-issue.md`
- **用途**: 详细的故障排除文档
- **内容**: 问题描述、解决方案、预防措施

## 修复原理

### 问题原因
在 Vercel 的无服务器函数环境中，环境变量可能在模块加载时还没有正确初始化。如果在模块加载时就检查环境变量，会导致错误。

### 解决方案
1. **延迟初始化**: 在 handler 函数中而不是模块加载时检查环境变量
2. **错误处理**: 使用 try-catch 包装环境变量检查
3. **函数式导出**: 导出初始化函数而不是直接导出实例
4. **运行时访问**: 确保所有环境变量访问都在运行时进行

## 关键修复点

### 1. saveQueryRecord 函数修复
**问题**: 函数直接使用全局 `supabase` 变量，可能在模块加载时访问
**解决**: 改为调用 `initializeSupabase()` 函数确保客户端正确初始化

```typescript
// ❌ 之前的方式
const { error } = await supabase.from('word_queries').insert(...);

// ✅ 修复后的方式
const supabaseClient = initializeSupabase();
const { error } = await supabaseClient.from('word_queries').insert(...);
```

### 2. 环境变量访问时机
**问题**: 在函数定义中访问环境变量
**解决**: 确保所有环境变量访问都在函数调用时进行

## 验证方法

### 1. 本地测试
```bash
# 运行部署检查脚本
./scripts/deploy-check.sh

# 启动开发服务器
cd packages/frontend
npm run dev:api
```

### 2. 环境变量测试
访问 `http://localhost:3001/api/test-env` 检查环境变量状态

### 3. Vercel 部署测试
部署到 Vercel 后，访问 `https://your-domain.vercel.app/api/test-env` 验证环境变量

## 预防措施

1. **代码审查**: 确保新的 API 文件不在模块级别检查环境变量
2. **测试**: 使用 `test-env.ts` API 验证环境变量配置
3. **文档**: 参考故障排除文档了解最佳实践
4. **函数调用**: 避免在模块加载时调用可能访问环境变量的函数

## 提交历史

- `6affe2c`: 初始修复 - 修复模块级别的环境变量检查
- `48e0ac2`: 深度修复 - 修复 saveQueryRecord 函数的 supabase 初始化问题

## 下一步

1. 部署到 Vercel 验证修复效果
2. 监控日志确保没有新的环境变量错误
3. 更新其他可能受影响的文件（如果有）

## 相关链接

- [故障排除文档](./supabase-env-issue.md)
- [测试 API](../packages/frontend/api/test-env.ts)
- [部署检查脚本](../../scripts/deploy-check.sh) 