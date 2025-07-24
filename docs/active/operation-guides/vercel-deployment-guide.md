# Vercel部署指南

## 🎯 GitHub仓库已就绪

✅ **仓库地址**: https://github.com/oralzl/ai-voca  
✅ **代码已推送**: 所有功能代码已上传到GitHub  
✅ **准备部署**: 可以开始Vercel部署流程

## 📋 Vercel部署步骤

### 步骤1：导入GitHub仓库

1. **访问Vercel控制台**
   - 打开 [vercel.com](https://vercel.com)
   - 点击 "Dashboard"（如果已登录）或 "Sign In"

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Import Git Repository"
   - 找到并选择 `oralzl/ai-voca` 仓库
   - 点击 "Import"

### 步骤2：配置项目设置

在项目配置页面中：

1. **项目名称**: `ai-voca`（或您喜欢的名称）

2. **Framework Preset**: `Vite`

3. **根目录**: `packages/frontend`

4. **构建设置**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 步骤3：配置环境变量

在 "Environment Variables" 部分添加以下变量：

```bash
# Supabase 配置
SUPABASE_URL=https://syryqvbhfvjbctrdxcbv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cnlxdmJoZnZqYmN0cmR4Y2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTM3NDksImV4cCI6MjA2ODQyOTc0OX0.5E0H1pvs2Pv1XyT04DvDmHQuO-zsv4PdeVLMcYqFRaM
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cnlxdmJoZnZqYmN0cmR4Y2J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg1Mzc0OSwiZXhwIjoyMDY4NDI5NzQ5fQ.k0Hlshvo95jXmrsWEKYJCW3tETqz4fHLd1VAz0G8vns

# AI 服务配置
AIHUBMIX_API_KEY=你的AiHubMix API密钥
AIHUBMIX_API_URL=https://aihubmix.com/v1
AIHUBMIX_MODEL=gemini-2.5-flash-lite-preview-06-17
AIHUBMIX_TIMEOUT=30000

# 前端环境变量
VITE_SUPABASE_URL=https://syryqvbhfvjbctrdxcbv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cnlxdmJoZnZqYmN0cmR4Y2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTM3NDksImV4cCI6MjA2ODQyOTc0OX0.5E0H1pvs2Pv1XyT04DvDmHQuO-zsv4PdeVLMcYqFRaM

# 应用配置
NODE_ENV=production
```

### 步骤4：开始部署

1. **点击 "Deploy"**
   - Vercel会自动开始构建和部署
   - 这个过程通常需要2-3分钟

2. **等待部署完成**
   - 您会看到构建日志
   - 绿色的 "Success" 表示部署成功

## 🔧 部署完成后的配置

### 1. 更新前端API_URL

部署完成后，您会得到一个Vercel域名，如：
`https://ai-voca-xyz.vercel.app`

需要更新环境变量：
```bash
VITE_API_URL=https://ai-voca-xyz.vercel.app
```

### 2. 配置Supabase认证域名

在Supabase控制台中：
1. 访问 "Authentication" → "URL Configuration"
2. 添加您的Vercel域名到 "Site URL"
3. 添加到 "Redirect URLs"

### 3. 测试API端点

部署完成后，测试以下URL：
- `https://your-app.vercel.app/api/health` - 健康检查
- `https://your-app.vercel.app/api/words` - API文档

## 🎉 部署成功指标

✅ **构建成功**: 没有构建错误  
✅ **部署完成**: 绿色的Success状态  
✅ **网站可访问**: 前端界面正常显示  
✅ **API正常**: 健康检查返回200状态  
✅ **认证工作**: 用户可以注册登录

## 🔍 如果遇到问题

### 构建失败
- 检查根目录设置是否为 `packages/frontend`
- 确保构建命令正确
- 查看构建日志中的错误信息

### 环境变量问题
- 确保所有必需的环境变量都已添加
- 检查API密钥是否正确
- 注意不要在变量值前后添加引号

### API不工作
- 检查API Routes文件是否正确部署
- 确认Supabase连接正常
- 检查网络请求是否返回正确状态

## 📱 测试检查清单

部署完成后，请测试：

- [ ] 网站首页正常显示
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 单词查询功能正常
- [ ] 查询限制功能正常
- [ ] 用户统计信息显示正常
- [ ] 手机端访问正常

## 🚀 下一步

部署成功后，您可以：
1. 自定义域名绑定
2. 监控应用性能
3. 收集用户反馈
4. 根据需要进行优化

---

**准备开始部署了吗？请按照上述步骤进行Vercel部署！**