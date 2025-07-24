# 📚 AI-Voca-2 项目文档中心

> **欢迎来到AI-Voca-2项目的文档中心！** 这里是所有项目文档的统一导航入口。

---

## 🎯 文档结构概览

### 📂 [active/](active/) - **活跃文档**（经常查阅）
最重要且经常使用的项目文档，包含：

- **[产品需求文档](active/product-requirements-specification.md)** - 完整的产品规格说明
- **[API变更记录](active/API-CHANGES.md)** - API版本管理和变更追踪
- **[生产环境部署总结](active/deployment-final-summary.md)** - 生产环境的最终部署状态

#### 📋 [operation-guides/](active/operation-guides/) - **运维指南**
- **[Supabase配置指南](active/operation-guides/supabase-setup-guide.md)** - 数据库配置和管理
- **[Vercel部署指南](active/operation-guides/vercel-deployment-guide.md)** - 应用部署和维护

### 🔧 [development/](development/) - **开发中项目**
当前正在进行的开发项目：

- **[UI迁移项目](development/ui-migration/)** - 前端界面升级和现代化
- **[技术实施策略](development/ai-voca-2-strategy/)** - 架构分析和技术决策
- **[OCA-2设计研究](development/oca-2-research/)** - UI/UX设计分析和参考

### ⚙️ [configurations/](configurations/) - **配置文件**
项目的各种配置文件和脚本：

#### 🗄️ [database/](configurations/database/) - **数据库配置**
- 数据库初始化脚本
- 开发环境数据库配置
- 收藏功能数据表结构

#### 🤖 [ai-services/](configurations/ai-services/) - **AI服务配置**
- AI查询提示词配置
- AiHubMix服务集成指南

### 📁 [archive/](archive/) - **归档文档**
已完成或过期的历史文档：

#### ✅ [completed-projects/](archive/completed-projects/) - **已完成项目**
- 实施路线图（已完成）
- 部署计划（已执行）
- GitHub设置指南（已完成）

#### 📝 [historical-notes/](archive/historical-notes/) - **历史笔记**
- 项目早期笔记和想法

---

## 🚀 快速导航

### 👨‍💼 **对于产品经理**
1. **项目概况** → [产品需求文档](active/product-requirements-specification.md)
2. **当前状态** → [生产环境部署总结](active/deployment-final-summary.md)
3. **进展跟踪** → [开发中项目](development/)

### 👨‍💻 **对于开发人员**
1. **设计系统** → [DESIGN_SYSTEM.md](/DESIGN_SYSTEM.md) ⚠️ **开发前必读**
2. **快速开始** → [运维指南](active/operation-guides/)
3. **API参考** → [API变更记录](active/API-CHANGES.md)
4. **配置文件** → [configurations/](configurations/)
5. **当前开发** → [development/](development/)

### 🎨 **对于UI/UX设计师**
1. **设计系统** → [DESIGN_SYSTEM.md](/DESIGN_SYSTEM.md) ⚠️ **所有UI开发的核心参考**
2. **设计研究** → [OCA-2设计研究](development/oca-2-research/)
3. **UI迁移进展** → [UI迁移项目](development/ui-migration/)

### 🔧 **对于运维人员**
1. **部署指南** → [Vercel部署指南](active/operation-guides/vercel-deployment-guide.md)
2. **数据库管理** → [Supabase配置指南](active/operation-guides/supabase-setup-guide.md)
3. **配置文件** → [configurations/](configurations/)

---

## 📊 项目状态概览

| 模块 | 状态 | 最后更新 |
|------|------|----------|
| **🌐 生产环境** | ✅ 运行中 | 2024年12月 |
| **🎨 UI升级** | 🔄 进行中 | 2024年12月 |
| **📊 核心功能** | ✅ 完成 | 2024年12月 |
| **🗄️ 数据库** | ✅ 稳定 | 2024年12月 |

---

## 🔗 重要链接

### 生产环境
- **🌐 线上应用**: https://ai-voca-frontend.vercel.app
- **📊 Vercel Dashboard**: 项目部署管理
- **🗄️ Supabase Dashboard**: 数据库管理

### 开发环境
- **📁 前端代码**: `/packages/frontend/`
- **🎨 设计参考**: `/oca-2/`
- **📋 设计系统**: [DESIGN_SYSTEM.md](/DESIGN_SYSTEM.md) ⚠️ **视觉一致性的核心保障**

---

## 📝 文档维护指南

### 文档更新原则
1. **active/** - 经常维护，保持最新
2. **development/** - 随项目进展更新
3. **configurations/** - 配置变更时更新
4. **archive/** - 仅保存，不再更新

### 新文档添加规则
- **运营相关** → `active/`
- **开发进行中** → `development/`
- **技术配置** → `configurations/`
- **已完成/过期** → `archive/`

---

## 💡 使用建议

### ⚡ 日常工作
- 优先查看 `active/` 目录获取最新信息
- 遇到技术问题查看 `configurations/`
- 了解历史决策查看 `archive/`

### 📚 新人入门
1. 阅读 [产品需求文档](active/product-requirements-specification.md)
2. 了解 [部署总结](active/deployment-final-summary.md)
3. 查看当前 [开发项目](development/)

### 🔍 问题排查
1. 检查 [API变更记录](active/API-CHANGES.md)
2. 查看 [配置文件](configurations/)
3. 参考 [运维指南](active/operation-guides/)

---

> **💡 提示**: 文档已按重要性和使用频率重新组织，优先查看 `active/` 目录获取最关键信息！

---

*最后更新: 2024年12月*  
*维护者: AI-Voca-2 开发团队*