#!/bin/bash

# 获取预览环境URL的脚本

echo "🔍 获取预览环境URL..."
echo ""

# 获取当前分支名
BRANCH_NAME=$(git branch --show-current)
echo "📍 当前分支: $BRANCH_NAME"

# 获取GitHub用户名（从remote URL提取）
GITHUB_USER=$(git remote get-url origin | sed 's/.*github.com[:/]\([^/]*\)\/.*/\1/')
echo "👤 GitHub用户: $GITHUB_USER"

# 构建预测的预览URL（处理分支名中的特殊字符）
SAFE_BRANCH_NAME=$(echo "$BRANCH_NAME" | sed 's/\//-/g')
PREVIEW_URL="https://ai-voca-git-${SAFE_BRANCH_NAME}-${GITHUB_USER}.vercel.app"

echo ""
echo "🌐 预测的预览环境URL:"
echo "   $PREVIEW_URL"
echo ""

echo "📋 需要在Supabase中配置的URL列表:"
echo ""
echo "Site URL:"
echo "   https://ai-voca-frontend.vercel.app"
echo ""
echo "Additional Redirect URLs:"
echo "   https://ai-voca-frontend.vercel.app"
echo "   https://ai-voca-frontend.vercel.app/**"
echo "   https://*.vercel.app"
echo "   https://*.vercel.app/**"
echo "   https://ai-voca-git-*.vercel.app"
echo "   https://ai-voca-git-*.vercel.app/**"
echo "   $PREVIEW_URL"
echo "   $PREVIEW_URL/**"
echo "   http://localhost:3000"
echo "   http://localhost:3000/**"
echo ""

echo "🔧 配置步骤:"
echo "1. 访问 https://supabase.com/dashboard"
echo "2. 选择测试项目 'ai-voca-test'"
echo "3. 进入 Authentication → URL Configuration"
echo "4. 复制上述URL到 Additional Redirect URLs"
echo "5. 保存配置"
echo ""

echo "✅ 配置完成后，请重新测试注册功能！"