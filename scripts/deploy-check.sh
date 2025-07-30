#!/bin/bash

# 部署检查脚本
echo "=== AI-Voca-2 部署检查脚本 ==="
echo "时间: $(date)"
echo ""

# 检查当前目录
echo "当前目录: $(pwd)"
echo ""

# 检查 Node.js 版本
echo "Node.js 版本:"
node --version
echo ""

# 检查 npm 版本
echo "npm 版本:"
npm --version
echo ""

# 检查环境变量
echo "环境变量检查:"
echo "NODE_ENV: $NODE_ENV"
echo "VERCEL_ENV: $VERCEL_ENV"
echo "SUPABASE_URL: ${SUPABASE_URL:+已设置}"
echo "SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY:+已设置}"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:+已设置}"
echo "AIHUBMIX_API_KEY: ${AIHUBMIX_API_KEY:+已设置}"
echo ""

# 检查文件结构
echo "文件结构检查:"
echo "packages/frontend/api/ 目录:"
ls -la packages/frontend/api/
echo ""

# 检查 package.json
echo "package.json 检查:"
if [ -f "packages/frontend/package.json" ]; then
    echo "✓ packages/frontend/package.json 存在"
else
    echo "✗ packages/frontend/package.json 不存在"
fi

# 检查 vercel.json
echo ""
echo "vercel.json 检查:"
if [ -f "vercel.json" ]; then
    echo "✓ vercel.json 存在"
    cat vercel.json
else
    echo "✗ vercel.json 不存在"
fi

echo ""
echo "=== 检查完成 ===" 