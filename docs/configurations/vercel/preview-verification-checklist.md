# 预览环境验证清单

## 配置验证步骤

### 1. 确认Vercel自动部署

✅ **步骤检查**：
- [ ] 推送 `test/preview-environment-setup` 分支完成
- [ ] Vercel自动检测到新分支并开始构建
- [ ] 在Vercel Dashboard的Deployments页面看到新的预览部署
- [ ] 获得预览链接（格式：`https://ai-voca-git-test-preview-environment-setup-username.vercel.app`）

**如何查看**：
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入ai-voca-frontend项目
3. 在Deployments页面查看最新的预览部署

### 2. 环境变量生效验证

✅ **检查项目**：
- [ ] 页面顶部显示黄色的"🧪 测试环境 - Preview Environment"横幅
- [ ] 横幅显示表明环境检测逻辑正常工作
- [ ] 页面可以正常加载，没有环境变量相关错误

**预期结果**：
- 预览环境显示环境指示器
- 生产环境（https://ai-voca-frontend.vercel.app）不显示指示器

### 3. 数据库连接验证

✅ **功能测试**：
- [ ] 可以正常注册新用户
- [ ] 注册后自动创建用户配置和查询限制记录
- [ ] 登录功能正常工作
- [ ] JWT token验证正常

**测试数据分离**：
- [ ] 在Supabase测试项目中可以看到新注册的用户
- [ ] 生产数据库中没有测试用户数据
- [ ] 两个环境的用户数据完全独立

### 4. 核心功能验证

✅ **单词查询功能**：
- [ ] 可以正常查询单词（如"hello"）
- [ ] AI响应正常返回XML格式结果
- [ ] 查询记录正确保存到测试数据库
- [ ] 错误处理机制正常工作

✅ **用户界面功能**：
- [ ] 搜索页面正常工作
- [ ] 结果页面正常显示
- [ ] 重试功能正常工作
- [ ] 响应式设计在移动端正常

✅ **收藏功能（如果已实现）**：
- [ ] 可以收藏单词
- [ ] 收藏列表正常显示
- [ ] 收藏数据保存到测试数据库

### 5. API Routes验证

✅ **后端API测试**：
- [ ] `/api/words/query` 端点正常工作
- [ ] `/api/user/stats` 端点正常工作
- [ ] 认证中间件正常验证JWT token
- [ ] 错误响应格式正确

**手动测试方法**：
```bash
# 在浏览器开发者工具中测试API
# 1. 登录后获取token
# 2. 在Console中运行：
fetch('/api/words/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('supabase.auth.token')
  },
  body: JSON.stringify({ word: 'test' })
}).then(r => r.json()).then(console.log)
```

### 6. 性能和安全验证

✅ **安全检查**：
- [ ] 环境变量没有在前端暴露（检查Network面板）
- [ ] 数据库查询受RLS保护
- [ ] JWT token格式正确且有效

✅ **性能检查**：
- [ ] 页面加载速度正常
- [ ] API响应时间合理（通常<5秒）
- [ ] 没有控制台错误或警告

## 常见问题排除

### 问题1：预览环境没有显示环境指示器

**可能原因**：
- 环境变量配置不正确
- 环境检测逻辑有误

**解决方法**：
1. 检查Vercel中Preview环境的环境变量配置
2. 确认`VITE_SUPABASE_URL`包含测试项目ID
3. 在浏览器控制台检查：
   ```javascript
   console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('hostname:', window.location.hostname);
   ```

### 问题2：数据库连接失败

**症状**：
- 注册或登录失败
- API请求返回500错误
- 控制台显示Supabase连接错误

**解决方法**：
1. 确认测试数据库SQL脚本已正确执行
2. 检查Supabase测试项目的URL和密钥
3. 验证RLS策略已启用
4. 检查API Routes的环境变量配置

### 问题3：AI服务调用失败

**症状**：
- 单词查询返回错误
- API响应中显示AI服务连接问题

**解决方法**：
1. 确认`AIHUBMIX_API_KEY`配置正确
2. 检查API配额是否足够
3. 验证网络连接正常

### 问题4：样式或功能异常

**可能原因**：
- 构建过程中的依赖问题
- 环境差异导致的兼容性问题

**解决方法**：
1. 检查Vercel构建日志
2. 确认所有依赖都已正确安装
3. 对比生产环境的功能表现

## 验证完成确认

**当所有检查项都通过时**：
- ✅ 预览环境成功配置
- ✅ 测试数据库独立运行
- ✅ 所有核心功能正常工作
- ✅ 生产环境不受影响

**接下来可以**：
1. 创建Pull Request将分支合并到main
2. 或者继续在预览环境中测试其他功能
3. 将这个工作流程文档化供团队使用

## 应急恢复

如果预览环境出现严重问题：

1. **回滚分支**：
   ```bash
   git checkout main
   git branch -D test/preview-environment-setup
   ```

2. **删除预览部署**：
   在Vercel Dashboard中手动删除有问题的部署

3. **重置环境变量**：
   如果配置错误，重新配置Preview环境的环境变量

4. **数据库重置**：
   如果测试数据库有问题，删除并重新创建Supabase测试项目