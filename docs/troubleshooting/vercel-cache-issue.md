# Vercel 缓存问题排查指南

## 问题描述

当修复了代码中的错误后，Vercel 仍然显示旧的错误信息，错误行号与实际代码不匹配。例如：
- 错误显示：`user/stats.ts` 第19行有环境变量检查错误
- 实际代码：第19行是函数定义，环境变量检查已移至 handler 函数内部

## 可能的原因

1. **Vercel 构建缓存**
   - Vercel 使用了缓存的依赖和构建输出
   - 缓存的 Source Map 导致错误行号映射不正确

2. **部署同步延迟**
   - Git 推送后，Vercel 需要时间触发新的构建
   - 预览环境可能需要额外时间完成部署

3. **TypeScript 编译问题**
   - TypeScript 编译后的 JavaScript 行号与源代码不一致
   - Source Map 生成或更新问题

## 解决方案

### 方案1：强制清除缓存

1. **添加版本标记**
   ```typescript
   console.log('User stats handler started - v2.0.0', { 
     // ... 其他日志
   });
   ```

2. **修改 vercel.json**
   - 更改构建配置可以触发完整重建

3. **通过 Vercel Dashboard**
   - 访问项目设置
   - 找到 "Environment Variables" 或 "Functions"
   - 点击 "Redeploy" 并选择 "Clear build cache"

### 方案2：创建临时替代文件

如果问题持续存在，可以创建一个简化版本的 API 来测试：

```typescript
// api/user/stats-v2.ts
export default async function handler(req, res) {
  // 简化的实现，只返回模拟数据
  res.json({
    success: true,
    data: {
      totalQueries: 0,
      todayQueries: 0,
      remainingQueries: 100
    }
  });
}
```

然后临时更新前端调用：
```typescript
// 将 /api/user/stats 改为 /api/user/stats-v2
```

### 方案3：手动触发重新部署

```bash
# 1. 创建一个空提交
git commit --allow-empty -m "chore: 触发Vercel重新部署"

# 2. 推送到远程
git push origin test/preview-environment-setup

# 3. 或者使用 Vercel CLI
vercel --force
```

### 方案4：检查 Vercel 函数日志

1. 访问 Vercel Dashboard
2. 进入项目 → Functions 标签
3. 查看 `api/user/stats` 的实时日志
4. 查看是否有版本标记（如 "v2.0.0"）来确认使用的代码版本

## 预防措施

1. **使用版本标记**
   - 在关键修复后添加版本号到日志中
   - 便于确认部署的代码版本

2. **监控部署状态**
   - 推送代码后立即检查 Vercel Dashboard
   - 等待部署完成后再测试

3. **使用 Vercel CLI**
   - 本地使用 `vercel dev` 测试
   - 使用 `vercel --prod` 直接部署

## 相关链接

- [Vercel 缓存文档](https://vercel.com/docs/concepts/deployments/build-cache)
- [Vercel 函数日志](https://vercel.com/docs/concepts/functions/logs)
- [清除构建缓存](https://vercel.com/docs/concepts/deployments/build-cache#clearing-the-build-cache)