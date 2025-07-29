如果你希望在 Zeabur 上快速解决这个问题，最简单的方法是：

  1. 在 Zeabur 设置中使用 Node.js 运行时
  2. 设置启动命令为: cd packages/frontend && npm run start
  3. 确保环境变量 PORT 正确设置

  这样 Zeabur 会使用我创建的 server.mjs 文件来提供静态文件服务，并对 API
  请求返回友好的错误提示。

  长期解决方案

  如果需要在 Zeabur 上实现完整功能，建议：
  1. 创建独立的后端服务（使用 Express/Fastify）
  2. 将 Vercel Functions 迁移到标准的 Node.js API
  3. 使用环境变量配置 API 端点

  现在你可以：
  1. 提交这些更改到 Git
  2. 在 Zeabur 中重新部署
  3. 设置启动命令为 npm run start:zeabur

  这样至少前端页面可以正常显示，只是 API 功能会提示用户访问 Vercel 版本。