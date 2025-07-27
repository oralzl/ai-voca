# 项目架构说明

## 概述

AI-Voca 是一个基于无服务器架构的 AI 词汇查询应用。由于采用了 Vercel API Routes，项目结构与传统的 monorepo 有所不同。

## 架构决策

### 为什么存在代码重复？

项目最初设计为传统的 monorepo 架构，使用 shared 包共享代码。但在迁移到 Vercel 无服务器架构时，由于以下限制，我们选择了内联代码的方式：

1. **Vercel API Routes 限制**：无法直接引用 workspace 包
2. **构建复杂性**：避免复杂的构建配置
3. **部署简化**：确保部署过程顺畅

## 重要文件位置指南

### 🔴 AI 提示词

| 文件路径 | 状态 | 说明 |
|---------|------|------|
| `packages/shared/src/utils/prompt.ts` | ❌ 未使用 | 仅作参考，不要修改 |
| **`packages/frontend/api/words/query.ts`** | ✅ **实际使用** | **第345-402行，修改这里！** |

### 🔴 XML 解析器

| 文件路径 | 状态 | 说明 |
|---------|------|------|
| `packages/shared/src/utils/xml-parser.ts` | ❌ 未使用 | 仅作参考，不要修改 |
| **`packages/frontend/api/words/query.ts`** | ✅ **实际使用** | **内联的解析逻辑** |

### 🟡 类型定义

| 文件路径 | 状态 | 说明 |
|---------|------|------|
| `packages/shared/src/types/index.ts` | ⚠️ 部分使用 | 前端组件使用 |
| `packages/frontend/api/words/query.ts` | ✅ 实际使用 | API 内联类型 |

## 修改指南

### 1. 修改 AI 提示词

```bash
# 直接编辑这个文件的第 345-402 行
packages/frontend/api/words/query.ts
```

找到以下代码块：
```typescript
// 构建AI提示词
// ⚠️ 重要：这是实际使用的AI提示词！
const prompt = `请详细分析英文单词...`
```

### 2. 修改 XML 解析逻辑

在同一个文件（`query.ts`）中找到解析逻辑并修改。

### 3. 修改类型定义

- **前端组件使用的类型**：修改 `packages/shared/src/types/index.ts`
- **API 使用的类型**：修改 `packages/frontend/api/words/query.ts` 中的内联类型

## 开发流程

1. **本地开发**
   ```bash
   npm run dev
   ```

2. **修改代码**
   - 记住查看本文档确定要修改的文件
   - 优先修改 API Routes 中的内联代码

3. **测试**
   ```bash
   npm run test
   npm run build:frontend
   ```

4. **部署**
   ```bash
   git add .
   git commit -m "your message"
   git push origin main
   # Vercel 会自动部署
   ```

## 常见误区

### ❌ 错误：修改 shared 包期望影响 API
```
修改 packages/shared/src/utils/prompt.ts
期望 API 行为改变
```

### ✅ 正确：直接修改 API Routes
```
修改 packages/frontend/api/words/query.ts
API 行为立即改变
```

## 未来改进建议

1. **统一代码位置**：考虑完全移除未使用的 shared 包代码
2. **抽取公共逻辑**：创建 API 专用的工具函数目录
3. **自动化测试**：添加测试确保 API 和前端的一致性

## 联系方式

如有架构相关问题，请：
1. 查看 CLAUDE.md 文档
2. 查看本架构文档
3. 在 GitHub Issues 中提问