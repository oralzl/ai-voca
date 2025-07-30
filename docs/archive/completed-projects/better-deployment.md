
## 关于测试环境的问题

您提出了一个非常重要的问题。确实，现在的部署流程存在一个问题：

### 当前问题
- 修改后端代码后，本地无法完整测试
- 必须提交到GitHub才能在Vercel上看到效果
- 这样会直接影响生产环境，没有真正的测试阶段

### 解决方案：建立真正的测试环境

有几种方案可以解决这个问题：

#### 方案1：Vercel预览部署（推荐）
- **原理**：每次提交代码到新分支时，Vercel会自动创建一个临时测试环境
- **优点**：
  - 不影响生产环境
  - 每个功能都有独立的测试链接
  - 测试通过后再合并到主分支
- **操作步骤**：
  1. 创建新分支：`git checkout -b feature/test-feature`
  2. 提交代码：`git push origin feature/test-feature`
  3. Vercel自动生成预览链接：`https://ai-voca-frontend-xxxxx.vercel.app`
  4. 测试通过后，合并到main分支



### 推荐的工作流程

```
1. 本地开发（localhost:3000）
   ↓
2. 创建功能分支并推送
   ↓
3. Vercel自动创建预览环境
   ↓
4. 在预览环境测试
   ↓
5. 测试通过后合并到main
   ↓
6. 自动部署到生产环境
```

### 如何使用Vercel预览功能

1. **创建新分支**
   ```bash
   git checkout -b test/new-feature
   ```

2. **修改代码并提交**
   ```bash
   git add .
   git commit -m "测试新功能"
   git push origin test/new-feature
   ```

3. **获取预览链接**
   - 打开GitHub Pull Request
   - Vercel机器人会自动评论预览链接
   - 或在Vercel控制台查看所有预览部署

4. **测试完成后**
   - 如果测试通过：合并PR到main分支
   - 如果有问题：继续在分支上修改

### 环境变量配置建议

为了让预览环境正常工作，建议在Vercel中配置：
- 所有环境变量对所有分支都生效
- 或者为预览环境配置独立的测试API密钥

这样您就可以：
1. 在本地开发和初步测试
2. 推送到分支创建预览环境
3. 在预览环境完整测试
4. 确认无误后才影响生产环境

是否需要我帮您设置这样的工作流程？

### 对应的Supabase配置最佳实践



#### 独立测试数据库
- **配置步骤**：
  1. 在Supabase创建新项目（免费套餐即可）
  2. 复制生产环境的表结构
  3. 创建测试数据
  4. 在Vercel配置预览环境专用的环境变量

##### 具体实施步骤：

1. **创建Supabase测试项目**
   - 登录 [Supabase](https://supabase.com)
   - 创建新项目，命名如 "ai-voca-test"
   - 记录下新的URL和密钥

2. **复制数据库结构**
   ```sql
   -- 在Supabase SQL编辑器中运行
   -- 这些是您项目中的表结构
   
   -- 用户配置表
   CREATE TABLE user_profiles (
     id UUID REFERENCES auth.users PRIMARY KEY,
     display_name VARCHAR(255),
     subscription_tier VARCHAR(50) DEFAULT 'free',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   
   -- 查询历史表
   CREATE TABLE word_queries (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users NOT NULL,
     word VARCHAR(255) NOT NULL,
     query_params JSONB,
     response_data JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- 启用RLS
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE word_queries ENABLE ROW LEVEL SECURITY;
   ```

3. **在Vercel配置环境变量**
   - 进入Vercel项目设置
   - 找到 Environment Variables
   - 添加预览环境专用变量：

   ```
   # 为预览环境设置
   环境：Preview
   
   SUPABASE_URL=https://your-test-project.supabase.co
   SUPABASE_SERVICE_KEY=your-test-service-key
   SUPABASE_ANON_KEY=your-test-anon-key
   VITE_SUPABASE_URL=https://your-test-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-test-anon-key
   ```

4. **创建测试用户和数据**
   - 在测试环境注册几个测试账号
   - 创建一些测试查询记录
   - 这样可以安全地测试各种功能



### 推荐配置

```
生产环境（main分支）          预览环境（其他分支）
├─ Vercel主项目              ├─ Vercel预览部署
├─ Supabase生产数据库        ├─ Supabase测试数据库
└─ 真实用户数据              └─ 测试数据
```

### 环境变量配置示例

在Vercel中这样配置：

| 变量名 | Production (main) | Preview (其他分支) |
|--------|------------------|-------------------|
| SUPABASE_URL | https://prod.supabase.co | https://test.supabase.co |
| SUPABASE_SERVICE_KEY | sk-prod-xxx | sk-test-xxx |
| AIHUBMIX_API_KEY | 生产API密钥 | 可以共用同一个 |

### 日常使用流程

1. **开发新功能**
   ```bash
   git checkout -b feature/add-new-feature
   ```

2. **推送获取预览链接**
   ```bash
   git push origin feature/add-new-feature
   ```

3. **测试流程**
   - Vercel自动部署到预览环境
   - 使用测试数据库，不影响生产
   - 获得类似这样的链接：`https://ai-voca-git-feature-add-new-feature.vercel.app`

4. **合并到生产**
   - 测试通过后创建Pull Request
   - 合并到main分支
   - 自动部署到生产环境

这样配置后，您就有了完整的开发→测试→生产流程，可以放心地测试各种功能而不担心影响真实用户。


