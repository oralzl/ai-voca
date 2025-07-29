# Vercel预览环境配置指南

## 配置步骤

### 1. 创建Supabase测试项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 点击 "New project" 创建新项目
3. 项目设置：
   - **Organization**: 选择您的组织
   - **Name**: `ai-voca-test`
   - **Database Password**: 设置强密码（请记录）
   - **Region**: 选择最近的区域（建议选择与生产环境相同）
4. 等待项目创建完成（约2-3分钟）

### 2. 配置测试数据库

1. 在新创建的Supabase项目中，点击左侧 "SQL Editor"
2. 创建新查询，粘贴 `docs/configurations/database/test-database-setup.sql` 中的完整SQL脚本
3. 点击 "Run" 执行脚本
4. 确认所有表和函数都创建成功

### 3. 获取测试项目的密钥

在Supabase项目设置中获取以下信息：

1. 进入 **Settings** → **API**
2. 记录以下信息：
   ```
   Project URL: https://[your-test-project-id].supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 4. 在Vercel中配置环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的 `ai-voca-frontend` 项目
3. 进入 **Settings** → **Environment Variables**

#### 预览环境配置

为 **Preview** 环境添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-------|------|
| `SUPABASE_URL` | `https://[your-test-project-id].supabase.co` | Preview |
| `SUPABASE_SERVICE_KEY` | `[your-test-service-key]` | Preview |
| `SUPABASE_ANON_KEY` | `[your-test-anon-key]` | Preview |
| `VITE_SUPABASE_URL` | `https://[your-test-project-id].supabase.co` | Preview |
| `VITE_SUPABASE_ANON_KEY` | `[your-test-anon-key]` | Preview |

#### AI服务配置（可与生产环境共用）

| 变量名 | 值 | 环境 |
|--------|-------|------|
| `AIHUBMIX_API_KEY` | `sk-qMWbiOmv6BhwydD4858197B955D94d189e451aC4C5Ac26E1` | Preview |
| `AIHUBMIX_API_URL` | `https://aihubmix.com/v1` | Preview |
| `AIHUBMIX_MODEL` | `gemini-2.5-flash-lite-preview-06-17` | Preview |

#### 配置截图

完成后，您的环境变量配置应该类似这样：

```
Environment Variables:
┌─ Production (main branch) ────────────────────────────────┐
│ SUPABASE_URL=https://syryqvbhfvjbctrdxcbv.supabase.co     │
│ SUPABASE_SERVICE_KEY=eyJhbGci...（生产密钥）               │
│ VITE_SUPABASE_URL=https://syryqvbhfvjbctrdxcbv.supabase.co│
│ VITE_SUPABASE_ANON_KEY=eyJhbGci...（生产密钥）            │
│ AIHUBMIX_API_KEY=sk-qMWbiOmv...                           │
└───────────────────────────────────────────────────────────┘

┌─ Preview (其他分支) ──────────────────────────────────────┐
│ SUPABASE_URL=https://[test-project].supabase.co          │
│ SUPABASE_SERVICE_KEY=eyJhbGci...（测试密钥）               │
│ VITE_SUPABASE_URL=https://[test-project].supabase.co     │
│ VITE_SUPABASE_ANON_KEY=eyJhbGci...（测试密钥）            │
│ AIHUBMIX_API_KEY=sk-qMWbiOmv...（可以共用）               │
└───────────────────────────────────────────────────────────┘
```

### 5. 测试配置

配置完成后，您可以通过以下方式测试：

1. **创建测试分支**：
   ```bash
   git checkout -b test/vercel-preview-setup
   ```

2. **提交任意小改动**：
   ```bash
   echo "// 测试预览环境配置" >> packages/frontend/src/App.tsx
   git add .
   git commit -m "test: 测试预览环境配置"
   git push origin test/vercel-preview-setup
   ```

3. **获取预览链接**：
   - 在GitHub中创建Pull Request
   - Vercel机器人会自动评论预览链接
   - 或在Vercel Dashboard的Deployments中查看

4. **验证功能**：
   - 访问预览链接
   - 尝试注册新用户
   - 测试单词查询功能
   - 确认所有功能正常工作

## 环境变量管理最佳实践

### 安全性考虑

- ✅ **Service Role Key** 只在服务端使用，不会暴露给前端
- ✅ **Anon Key** 会暴露给前端，但有行级安全保护
- ✅ **测试环境** 使用独立数据库，不会影响生产数据
- ✅ **AI API Key** 可以共用，但注意配额限制

### 变量命名规范

- **VITE_** 前缀：前端可访问的环境变量
- **无前缀**：仅服务端（API Routes）可访问
- **一致命名**：测试和生产环境使用相同的变量名

### 故障排除

如果预览环境不工作，检查以下项目：

1. **环境变量格式**：
   - 确保没有多余的空格或换行符
   - 特别注意JWT token的格式

2. **Supabase配置**：
   - 确认测试项目的RLS策略已启用
   - 验证API密钥的有效性

3. **Vercel配置**：
   - 确认环境变量只对Preview环境生效
   - 检查部署日志中的错误信息

4. **数据库连接**：
   - 在Supabase测试项目中检查实时日志
   - 确认数据库表结构完整

## 完成确认

配置完成后，您应该能够：

- ✅ 从任何非main分支创建预览部署
- ✅ 预览环境使用独立的测试数据库
- ✅ 生产环境不受测试影响
- ✅ 可以安全地测试后端API修改

接下来可以进行第三步：创建功能分支测试新的部署流程。