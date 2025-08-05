# Vocabulary Review System 实施计划

## 文档关系说明

### 预览环境分支
- Preview branch is test/preview-environment-setup
- git commit 分支后才可以通过 vercel 预览

### 🔗 文档依赖关系

#### 1. **requirements.md → design.md**
- **输入**：用户故事、验收标准、技术约束
- **输出**：系统架构、数据模型、接口设计
- **验证点**：每个设计决策都必须对应具体需求

#### 2. **design.md → tasks.md**
- **输入**：架构设计、组件规范、API接口
- **输出**：具体编码任务、文件路径、实现细节
- **验证点**：每个任务都必须引用设计文档中的具体组件

#### 3. **requirements.md → tasks.md**
- **输入**：功能需求编号、验收标准
- **输出**：任务需求引用矩阵
- **验证点**：每个任务都必须明确引用需求文档中的具体需求编号


### 🎯 文档使用指南


#### 验证检查点：

- [ ] **需求完整性**：每个需求编号都有对应的设计章节和实现任务
- [ ] **设计一致性**：设计文档中的每个组件都有对应的实现任务
- [ ] **任务可追溯**：每个任务都能追溯到具体需求和设计决策
- [ ] **文档同步**：三个文档的内容保持同步更新

### 📝 文档维护规范

#### 更新流程：
1. **需求变更** → 更新 `requirements.md`
2. **设计调整** → 更新 `design.md` 并检查需求覆盖
3. **任务调整** → 更新 `tasks.md` 并更新需求引用


---
## 概述

本实施计划基于复习系统设计文档，将功能转换为一系列可执行的编码任务。采用测试驱动开发方法，确保渐进式进展和早期验证。

## 任务清单

### 1. 数据库迁移和基础架构

- [x] **1.1 创建数据库迁移文件** ✅
  - 创建 `user_word_state` 表迁移
  - 创建 `review_events` 表和枚举类型
  - 创建 `user_review_prefs` 表
  - 添加必要的外键约束和索引
  - 引用需求：1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5
  - **完成文件**：
    - `docs/configurations/database/migrations/create-review-system-tables.sql`
    - `docs/configurations/database/migrations/test-review-system-data.sql`
    - `docs/configurations/database/migrations/README.md`

- [x] **1.2 实现核心类型定义** ✅
  - 创建 `packages/shared/src/types/review.ts`
  - 定义 `Rating`、`WordState`、`UserPrefs` 等核心类型
  - 实现 Zod Schema 验证
  - 添加类型导出和文档
  - 引用需求：技术约束（TypeScript、Zod验证）
  - **完成文件**：
    - `packages/shared/src/types/review.ts`
    - `packages/shared/src/types/review.md`
    - 更新 `packages/shared/package.json` 添加 Zod 依赖
    - 更新 `packages/shared/src/index.ts` 和 `packages/shared/src/types/index.ts` 导出

- [x] **1.3 设置基础项目结构** ✅
  - 创建 `packages/review-engine/` 目录
  - 配置 TypeScript 和测试环境
  - 设置 ESLint 和 Prettier
  - 创建基础配置文件
  - 引用需求：技术约束（项目架构、开发环境）
  - **完成文件**：
    - `packages/review-engine/package.json`
    - `packages/review-engine/tsconfig.json`
    - `packages/review-engine/vitest.config.ts`
    - `packages/review-engine/.eslintrc.cjs`
    - `packages/review-engine/.prettierrc`
    - `packages/review-engine/.gitignore`
    - `packages/review-engine/README.md`
    - `packages/review-engine/src/index.ts`
    - `packages/review-engine/src/fsrs.ts`
    - `packages/review-engine/src/difficulty.ts`
    - `packages/review-engine/src/validator.ts`
    - `packages/review-engine/src/llm/tools.ts`
    - `packages/review-engine/src/llm/schemas.ts`
    - `packages/review-engine/src/llm/prompts/generate_items.ts`
    - `packages/review-engine/src/fsrs.test.ts`

### 2. 核心算法实现

- [x] **2.1 实现 FSRS 调度算法** ✅
  - 创建 `packages/review-engine/src/fsrs.ts`
  - 实现 `fsrsUpdate` 函数
  - 添加单元测试覆盖各种评分情况
  - 验证间隔计算和状态更新逻辑
  - 引用需求：1.1, 1.2, 1.3, 1.4, 1.5
  - **完成文件**：
    - `packages/review-engine/src/fsrs.ts` - 完整的 FSRS 算法实现
    - `packages/review-engine/src/fsrs.test.ts` - 全面的单元测试
    - `packages/review-engine/src/fsrs.example.ts` - 使用示例

- [x] **2.2 实现难度控制器** ✅
  - 创建 `packages/review-engine/src/difficulty.ts`
  - 实现 `adjustLevelAndBudget` 函数
  - 实现 `calibrateBudgetEstimation` 函数
  - 添加 EWMA 算法测试
  - 引用需求：3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5
  - **完成文件**：
    - `packages/review-engine/src/difficulty.ts` - 完整的难度控制器实现
    - `packages/review-engine/src/difficulty.test.ts` - 全面的单元测试

- [x] **2.3 实现基础校验器** ✅
  - 创建 `packages/review-engine/src/validator.ts`
  - 实现 `validateBasicRequirements` 函数
  - 实现目标词覆盖检查
  - 实现句长范围验证
  - 引用需求：2.1, 2.2, 2.3, 2.4, 2.5, 2.6
  - **完成文件**：
    - `packages/review-engine/src/validator.ts` - 完整的基础校验器实现
    - `packages/review-engine/src/validator.test.ts` - 全面的单元测试

### 3. LLM 集成和生成器

- [x] **3.1 实现 LLM 工具函数** ✅
  - 创建 `packages/review-engine/src/llm/tools.ts`
  - 实现 `generateItems` 函数
  - 实现 `generateWithRetry` 重试机制
  - 添加错误处理和日志记录
  - 引用需求：2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.4, 5.5
  - **完成文件**：
    - `packages/review-engine/src/llm/tools.ts` - 完整的 LLM 工具函数实现
    - `packages/review-engine/src/llm/tools.test.ts` - 全面的单元测试

- [x] **3.2 实现提示词构建器** ✅
  - 创建 `packages/review-engine/src/llm/prompts/generate_items.ts`
  - 实现 `buildPrompt` 函数
  - 添加模板变量替换逻辑
  - 创建提示词模板文件
  - 引用需求：2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5
  - **完成文件**：
    - `packages/review-engine/src/llm/prompts/generate_items.ts` - 核心实现
    - `packages/review-engine/src/llm/prompts/generate_items.test.ts` - 测试文件
    - `packages/review-engine/src/llm/prompts/example.ts` - 示例文件
    - `packages/review-engine/TASK-3.2-COMPLETION-SUMMARY.md` - 完成总结

- [x] **3.3 实现 JSON 解析器** ✅
  - 创建 `packages/review-engine/src/llm/schemas.ts`
  - 实现 Zod Schema 定义
  - 实现 `parseGenerateItemsJSON` 函数
  - 添加解析错误处理
  - 引用需求：2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 技术约束（Zod验证）
  - **完成文件**：
    - `packages/review-engine/src/llm/schemas.ts` - 完整的 Zod Schema 定义和解析器实现
    - `packages/review-engine/src/llm/schemas.test.ts` - 全面的单元测试

### 4. API 接口实现

- [x] **4.1 实现候选词获取 API** ✅
  - 创建 `packages/frontend/api/review/candidates.ts`
  - 实现 `GET /review/candidates` 接口
  - 添加用户认证和权限检查
  - 实现候选词选择逻辑
  - 引用需求：1.1, 1.2, 1.3, 7.1, 7.4, 7.5
  - **完成文件**：
    - `packages/frontend/api/review/candidates.ts` - 候选词获取API实现
    - `packages/frontend/api/review/README.md` - API文档
    - `packages/frontend/api/review/test-candidates.ts` - 测试文件
    - 更新 `packages/frontend/package.json` 添加uuid依赖
    - 更新 `packages/frontend/api/README.md` 添加复习API说明

- [x] **4.2 实现复习提交 API** ✅
  - 创建 `packages/frontend/api/review/submit.ts`
  - 实现 `POST /review/submit` 接口
  - 添加事件记录和状态更新
  - 实现事务处理
  - 引用需求：1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.2, 7.3, 7.4, 7.5
  - **完成文件**：
    - `packages/frontend/api/review/submit.ts` - 复习提交API实现
    - `packages/frontend/api/review/test-submit.ts` - 测试文件
    - 更新 `packages/frontend/package.json` 添加review-engine依赖
    - 更新 `packages/frontend/api/review/README.md` 添加API文档
    - 更新 `packages/frontend/api/README.md` 添加API说明

- [x] **4.3 实现句子生成 API** ✅
  - 创建 `packages/frontend/api/review/generate.ts`
  - 实现 `POST /review/generate` 接口
  - 集成 LLM 调用和校验
  - 添加兜底机制
  - 引用需求：2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5, 7.2, 7.4, 7.5
  - **完成文件**：
    - `packages/frontend/api/review/generate.ts`
    - `packages/frontend/api/review/test-generate.ts`
    - `packages/frontend/api/review/test-generate-simple.ts`
    - 更新 `packages/frontend/api/review/README.md` 添加API说明
    - 更新 `packages/frontend/api/README.md` 添加API端点

- [x] **4.4 实现复习计数 API** ✅
  - 创建 `packages/frontend/api/review/count.ts`
  - 实现 `GET /review/count` 接口
  - 添加缓存机制
  - 实现实时计数更新
  - 引用需求：8.2, 8.3, 7.1, 7.4, 7.5
  - **完成文件**：
    - `packages/frontend/api/review/count.ts`
    - `packages/frontend/api/review/test-count.ts`
    - `packages/frontend/api/review/test-count-simple.ts`
    - `packages/frontend/api/review/test-count.js`
    - 更新 `packages/frontend/api/review/README.md` 添加API说明
    - 更新 `packages/frontend/api/README.md` 添加API端点

### 5. 前端组件实现

- [x] **5.1 实现复习主界面组件** ✅
  - 创建 `packages/frontend/src/pages/ReviewPage.tsx`
  - 实现复习流程管理
  - 添加加载状态和错误处理
  - 集成进度显示
  - 引用需求：8.3, 8.4, 8.5, 8.6, 8.7, 8.8
  - **完成文件**：
    - `packages/frontend/src/pages/ReviewPage.tsx`

- [x] **5.2 实现句子展示组件** ✅
  - 创建 `packages/frontend/src/components/SentenceDisplay.tsx`
  - 实现目标词高亮显示
  - 添加新词汇提示功能
  - 实现响应式设计
  - 引用需求：2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.4, 8.4
  - **完成文件**：
    - `packages/frontend/src/components/SentenceDisplay.tsx`
    - `packages/frontend/src/components/SentenceDisplay.test.tsx`
    - `packages/frontend/src/hooks/useReviewData.ts`
    - 更新 `packages/frontend/src/pages/ReviewPage.tsx` 集成真实数据
    - 更新 `packages/frontend/src/components/README.md` 添加组件文档

- [ ] **5.3 实现词汇反馈卡片**
  - 创建 `packages/frontend/src/components/WordFeedbackCard.tsx`
  - 实现评分按钮组件
  - 添加状态管理和动画效果
  - 实现网格布局
  - 引用需求：4.1, 4.2, 8.4

- [ ] **5.4 实现难度反馈组件**
  - 创建 `packages/frontend/src/components/DifficultyFeedback.tsx`
  - 实现整体难度评价
  - 添加按钮状态管理
  - 实现响应式布局
  - 引用需求：4.2, 4.3, 4.4, 4.5, 8.4

- [ ] **5.5 实现复习进度组件**
  - 创建 `packages/frontend/src/components/ReviewProgress.tsx`
  - 实现进度条显示
  - 添加完成按钮
  - 实现动画效果
  - 引用需求：8.5, 8.6

- [ ] **5.6 实现复习 Tab 组件**
  - 创建 `packages/frontend/src/components/layout/ReviewTab.tsx`
  - 实现导航标签组件
  - 添加未读数量显示
  - 实现激活状态管理
  - 引用需求：8.1, 8.2, 8.7, 8.8

### 6. 导航和布局更新

- [x] **6.1 更新底部导航栏** ✅
  - 修改 `packages/frontend/src/components/layout/BottomNavigation.tsx`
  - 添加复习 Tab 到导航列表
  - 实现复习数量显示
  - 添加激活状态管理
  - 引用需求：8.1, 8.2, 8.7, 8.8
  - **完成文件**：
    - `packages/frontend/src/components/layout/BottomNavigation.tsx`

- [x] **6.2 更新侧边栏导航** ✅
  - 修改 `packages/frontend/src/components/layout/AppSidebar.tsx`
  - 添加复习菜单项
  - 实现开发环境调试功能
  - 更新导航状态管理
  - 引用需求：8.1, 8.2, 8.7, 8.8
  - **完成文件**：
    - `packages/frontend/src/components/layout/AppSidebar.tsx`

- [ ] **6.3 实现复习计数 Hook**
  - 创建 `packages/frontend/src/hooks/useReviewCount.ts`
  - 实现复习数量获取逻辑
  - 添加自动刷新机制
  - 实现错误处理
  - 引用需求：8.2, 8.3

### 7. 集成和测试

- [x] **7.1 集成复习系统到主应用** ✅
  - 更新 `packages/frontend/src/App.tsx`
  - 添加复习路由配置
  - 集成复习页面组件
  - 实现页面切换逻辑
  - 引用需求：8.8, 技术约束（项目架构）
  - **完成文件**：
    - `packages/frontend/src/App.tsx`
    - `packages/frontend/src/components/layout/AppLayout.tsx`

- [ ] **7.2 实现端到端测试**
  - 创建 `packages/frontend/src/tests/review.e2e.test.ts`
  - 测试完整复习流程
  - 验证用户交互和状态更新
  - 测试错误处理场景
  - 引用需求：成功指标（质量保证、用户体验）

- [ ] **7.3 实现单元测试覆盖**
  - 为 FSRS 算法添加测试
  - 为难度控制器添加测试
  - 为校验器添加测试
  - 为 LLM 工具添加测试
  - 引用需求：成功指标（测试覆盖率80%以上）

### 8. 错误处理和监控

- [ ] **8.1 实现错误处理机制**
  - 添加 LLM 生成失败处理
  - 实现校验失败兜底机制
  - 添加数据库操作错误处理
  - 实现权限验证错误处理
  - 引用需求：5.1, 5.2, 5.3, 5.4, 5.5, 成功指标（稳定性）

- [ ] **8.2 添加监控和日志**
  - 实现关键指标收集
  - 添加性能监控
  - 实现错误日志记录
  - 添加用户行为追踪
  - 引用需求：9.1, 9.2, 9.3, 9.4, 9.5

### 9. 性能优化和部署

- [ ] **9.1 实现缓存策略**
  - 添加用户偏好缓存
  - 实现常用数据缓存
  - 优化 API 响应时间
  - 添加前端状态缓存
  - 引用需求：成功指标（P95 < 1.5s）、技术约束（性能要求）

- [ ] **9.2 配置生产环境**
  - 设置环境变量配置
  - 配置数据库连接
  - 设置 LLM API 密钥
  - 配置错误监控
  - 引用需求：技术约束（Supabase、Vercel部署）

## 实施优先级

1. **第一阶段（核心功能）**：任务 1.1-1.3, 2.1-2.3, 3.1-3.3, 4.1-4.4
2. **第二阶段（前端界面）**：任务 5.1-5.6, 6.1-6.3
3. **第三阶段（集成测试）**：任务 7.1-7.3, 8.1-8.2
4. **第四阶段（优化部署）**：任务 9.1-9.2

## 成功标准

- [ ] 所有核心功能正常工作
- [ ] 前端界面符合设计系统规范
- [ ] 测试覆盖率达到 80% 以上
- [ ] 性能指标满足要求（P95 < 1.5s）
- [ ] 错误处理机制完善
- [ ] 用户体验流畅自然

---

**注意**：本实施计划专注于编码任务，不包含用户测试、部署、性能指标收集等非编码活动。所有任务都可在开发环境中执行。 