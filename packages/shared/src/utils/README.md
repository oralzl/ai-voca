# 工具函数模块

此目录包含 @ai-voca/shared 包的工具函数实现，提供验证和格式化等基础功能。

## 📁 文件结构

```
utils/
├── README.md           # 本文档
├── index.ts            # 模块入口文件，导出所有工具函数
├── validation.ts       # 验证相关函数
└── formatting.ts       # 格式化相关函数
```

## 🛠️ 功能列表

### validation.ts - 验证工具

提供各种输入验证函数，确保数据的有效性。

```typescript
export function isValidWord(word: string): boolean;
export function isValidApiKey(apiKey: string): boolean;
export function isValidUrl(url: string): boolean;
```

**使用示例：**
```typescript
import { isValidWord } from '@ai-voca/shared';

isValidWord('hello');        // true
isValidWord('running');      // true - 支持词形变化
isValidWord('well-being');   // true - 支持连字符
isValidWord("can't");        // true - 支持撇号
isValidWord('');             // false - 空字符串
isValidWord('a'.repeat(60)); // false - 超长
```

### formatting.ts - 格式化工具

提供数据格式化函数，统一数据输出格式。

```typescript
export function formatTimestamp(timestamp: number): string;
```

**使用示例：**
```typescript
import { formatTimestamp } from '@ai-voca/shared';

formatTimestamp(Date.now()); // '2024-07-19 15:30:00'
```

## 📦 导入使用

```typescript
// 从主包导入
import { 
  isValidWord,
  formatTimestamp
} from '@ai-voca/shared';

// 或从具体模块导入
import { isValidWord } from '@ai-voca/shared/validation';
import { formatTimestamp } from '@ai-voca/shared/formatting';
```

## 🗑️ 已清理的功能

以下功能已从此模块中删除，因为在当前项目中未被使用：

- **XML解析器** (`xml-parser.ts`) - 已在API Routes中内联
- **AI客户端** (`aihubmix-client.ts`) - API Routes使用自定义实现
- **提示词生成** (`prompt.ts`) - API Routes中有内联版本
- **其他格式化函数** - formatWord、capitalize等未使用的函数

## ⚡ 性能优化

经过清理后的工具函数模块具有以下优势：

- **轻量化**: 移除了未使用的复杂功能
- **快速加载**: 减少了包的体积
- **专注核心**: 只保留实际使用的功能
- **零依赖**: 不依赖任何外部库

## 🔧 开发指南

### 添加新的工具函数

1. 在相应的分类文件中添加函数（如 `validation.ts` 或 `formatting.ts`）
2. 在 `index.ts` 中添加导出
3. 更新此文档
4. 添加相应的测试用例

### 函数设计原则

- **纯函数**: 无副作用，相同输入产生相同输出
- **类型安全**: 完整的TypeScript类型定义
- **错误处理**: 优雅处理异常情况
- **文档完整**: 详细的JSDoc注释

## 📋 版本历史

### v2.1.0 - 清理优化版本
- 🗑️ 删除未使用的复杂功能
- 🎯 专注核心验证和格式化功能
- 📦 显著减少包体积
- 📝 更新文档反映当前状态

---

**维护状态**: ✅ 活跃维护  
**使用建议**: 导入所需的具体函数，避免导入整个包