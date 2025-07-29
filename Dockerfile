# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/frontend/package*.json ./packages/frontend/

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 运行阶段
FROM node:18-alpine
WORKDIR /app

# 只复制必要的文件
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist
COPY --from=builder /app/packages/frontend/server.mjs ./packages/frontend/
COPY --from=builder /app/packages/frontend/package*.json ./packages/frontend/

# 安装生产依赖
WORKDIR /app/packages/frontend
RUN npm install express

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.mjs"]