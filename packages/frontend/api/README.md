# API Routes - Vercel无服务器函数

此目录包含所有的Vercel API Routes，实现了应用的后端逻辑。这些函数部署为无服务器函数，替代了传统的Express.js后端。

## 📋 API端点

### 🔍 单词查询
- **`words/query.ts`** - 主要的单词查询API
- **`words/index.ts`** - API文档和健康检查

### 👤 用户功能  
- **`user/stats.ts`** - 用户统计信息

### 🏥 系统监控
- **`health.ts`** - 系统健康检查

## 🔧 使用方式

### 开发环境
```bash
# 启动开发服务器，API自动运行在 /api/* 路径
npm run dev
```

### 生产环境
- **Vercel自动部署** - 代码推送自动触发部署
- **全球CDN** - 自动分发到全球边缘节点
- **自动扩容** - 根据流量自动调整资源

## 🌐 API访问地址

### 开发环境
```
http://localhost:3000/api/words/query
http://localhost:3000/api/user/stats
http://localhost:3000/health
```

### 生产环境  
```
https://ai-voca-frontend.vercel.app/api/words/query
https://ai-voca-frontend.vercel.app/api/user/stats
https://ai-voca-frontend.vercel.app/health
```

## 🔐 认证方式

所有API端点都使用JWT token认证：

```typescript
// 请求头格式
headers: {
  'Authorization': `Bearer ${jwt_token}`,
  'Content-Type': 'application/json'
}
```

## 🛡️ 安全特性

- **JWT验证** - 所有请求必须携带有效token
- **CORS配置** - 跨域请求安全控制
- **环境变量** - 敏感信息通过环境变量管理
- **输入验证** - 严格的参数验证和清理
- **错误处理** - 不暴露敏感的系统信息

## 📊 无服务器架构优势

- **零运维** - 无需服务器管理和维护
- **自动扩容** - 流量高峰时自动调整资源
- **成本优化** - 按实际使用量付费
- **全球分发** - 边缘计算提升响应速度
- **高可用性** - 内置容错和故障转移

---

**📦 目录状态**: ✅ 生产环境运行中  
**🔧 部署平台**: Vercel Functions  
**🌐 在线地址**: https://ai-voca-frontend.vercel.app