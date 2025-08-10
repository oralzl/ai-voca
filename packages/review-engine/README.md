<!--
@fileoverview 复习系统核心引擎说明文档
@description 复习系统核心引擎 - FSRS算法和LLM集成
@author thiskee
@version 1.0.0
@license MIT

任务 1.3 完成文件
包含复习系统的核心算法和LLM集成功能
-->

# Review Engine

复习系统核心引擎，提供 FSRS 间隔重复算法和 LLM 集成功能。

## 功能特性

- **FSRS 算法**: 实现 Free Spaced Repetition Scheduler 算法
- **难度控制**: 基于 EWMA 算法的动态难度调整
- **LLM 集成**: 与 AI 服务集成，生成个性化复习内容
- **数据验证**: 使用 Zod 进行严格的类型验证
- **测试覆盖**: 完整的单元测试和集成测试

## 项目结构

```
src/
├── fsrs.ts              # FSRS 算法实现
├── difficulty.ts         # 难度控制器
├── validator.ts          # 基础校验器
├── llm/
│   ├── tools.ts         # LLM 工具函数
│   ├── schemas.ts       # JSON 解析器
│   └── prompts/
│       └── generate_items.ts  # 提示词构建器
└── index.ts             # 主入口文件
```

## 开发环境

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 代码质量

```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

## 使用示例

```typescript
import { fsrsUpdate, adjustLevelAndBudget } from '@ai-voca/review-engine';

// FSRS 算法更新
const result = fsrsUpdate({
  rating: 3,
  state: { difficulty: 2.5, stability: 1.0, retrievability: 0.8 },
  timeElapsed: 86400 // 1天
});

// 难度调整
const adjusted = adjustLevelAndBudget({
  currentLevel: 1,
  currentBudget: 100,
  userRating: 4,
  itemDifficulty: 0.7
});
```

## 技术栈

- **TypeScript**: 严格类型检查
- **Zod**: 运行时类型验证
- **Vitest**: 单元测试框架
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化

## 依赖关系

- `@ai-voca/shared`: 共享类型定义和工具函数
- `zod`: 数据验证
- `axios`: HTTP 客户端

## 开发规范

1. **类型安全**: 所有函数必须有完整的类型定义
2. **测试覆盖**: 新功能必须包含对应的测试用例
3. **文档完整**: 公共 API 必须有清晰的文档说明
4. **代码质量**: 通过 ESLint 和 Prettier 保持代码风格一致 