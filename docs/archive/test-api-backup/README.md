# 测试 API 文件备份

这个目录包含了从项目中删除的测试 API 文件的备份。这些文件是为了符合 Vercel Hobby 计划的限制（最多12个 Serverless Functions）而删除的。

## 备份的文件列表

### 根目录测试文件
- `test-env.ts` - 环境变量测试
- `simple-test.ts` - 简单测试
- `test-simple.ts` - 基础测试

### Review 系统测试文件
- `review/test-count-simple.ts` - 复习计数简单测试
- `review/test-count.ts` - 复习计数测试
- `review/test-submit.ts` - 复习提交测试
- `review/test-generate.ts` - 复习生成测试
- `review/test-generate-simple.ts` - 复习生成简单测试
- `review/test-candidates.ts` - 复习候选测试

## 恢复方法

如果需要恢复这些测试文件，可以：

1. 将文件复制回 `packages/frontend/api/` 目录
2. 确保不超过 Vercel Hobby 计划的12个 Serverless Functions 限制
3. 在恢复前先删除一些现有的 API 路由

## 注意事项

- 这些文件主要用于开发和测试目的
- 在生产环境中，这些文件会增加部署的复杂性和成本
- 如果需要使用这些测试文件，建议在本地开发环境中使用，而不是部署到 Vercel

## 删除原因

删除这些文件是为了：
1. 符合 Vercel Hobby 计划的限制（最多12个 Serverless Functions）
2. 减少部署的复杂性和成本
3. 保持生产环境的清洁

当前项目保留了11个生产必需的 API 路由，符合 Vercel Hobby 计划的限制。 