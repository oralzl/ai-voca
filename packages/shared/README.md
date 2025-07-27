# @ai-voca/shared [已清理优化]

共享类型定义和工具函数包，为前端和后端提供统一的数据结构和实用工具。

## 📋 当前状态

经过代码清理，此包现在专注于提供核心的类型定义和基础工具函数：

### ✅ 保留的功能
- 📊 **类型定义**: 完整的TypeScript类型定义，供前端项目使用
- 🔧 **基础工具函数**: 验证和时间格式化函数
- 📦 **轻量化设计**: 移除了未使用的复杂功能

### 🗑️ 已清理的功能
- 📡 **AI客户端**: 已删除，API Routes使用自定义实现
- 🎯 **XML解析器**: 已删除，API Routes中有内联版本
- 💬 **提示词生成**: 已删除，API Routes中有内联版本
- 📝 **示例代码**: 已删除examples目录
- 🧹 **未使用的工具函数**: 已删除formatWord、capitalize等

## 功能特性

- 📝 **类型定义**: 完整的TypeScript类型定义
- 🔧 **基础工具**: 单词验证和时间格式化
- 📦 **轻量化**: 零外部依赖
- 🚀 **高效**: 只保留实际使用的功能

## 使用方法

### 类型定义

```typescript
import { 
  WordQueryRequest, 
  WordQueryResponse, 
  WordExplanation,
  WordExample,
  FavoriteWord
} from '@ai-voca/shared';

// 查询请求
const request: WordQueryRequest = {
  word: 'hello',
  includeExample: true
};

// 查询响应
const response: WordQueryResponse = {
  success: true,
  data: {
    word: 'run',
    text: 'run',
    lemmatizationExplanation: 'running是run的现在分词形式',
    pronunciation: 'rʌn',
    definition: '跑步；运行；管理',
    simpleExplanation: 'To move quickly using your legs',
    examples: [
      {
        sentence: 'She is running in the park.',
        translation: '她正在公园里跑步。'
      }
    ]
  },
  timestamp: Date.now()
};
```

### 工具函数

```typescript
import { 
  isValidWord,
  formatTimestamp
} from '@ai-voca/shared';

// 验证单词格式
if (isValidWord('hello')) {
  console.log('有效的单词');
}

// 格式化时间戳
const time = formatTimestamp(Date.now()); // '2024-01-01 12:00:00'
```

## API 文档

### 类型定义

#### WordQueryRequest
```typescript
interface WordQueryRequest {
  word: string;                    // 要查询的单词
  includeExample?: boolean;       // 是否包含例句，默认为 true
}
```

#### WordExplanation
```typescript
interface WordExplanation {
  word: string;                        // 显示的单词
  text?: string;                       // lemma后的单词原形
  lemmatizationExplanation?: string;   // 词形还原说明
  pronunciation?: string;              // 音标
  definition: string;                 // 中文释义
  simpleExplanation?: string;         // 英文简单解释
  examples?: WordExample[];           // 例句数组
  synonyms?: string[];                // 同义词
  antonyms?: string[];                // 反义词
  etymology?: string;                 // 词源信息
  memoryTips?: string;                // 记忆技巧
}
```

#### WordQueryResponse
```typescript
interface WordQueryResponse {
  success: boolean;                   // 是否成功
  data?: WordExplanation | null;      // 查询结果
  error?: string;                    // 错误信息
  rawResponse?: string;              // 原始AI响应
  timestamp: number;                 // 时间戳
  inputParams?: {                    // 重试机制参数
    word: string;
    timestamp: number;
  };
}
```

### 工具函数

#### 验证函数

- `isValidWord(word: string): boolean` - 验证单词格式

#### 格式化函数

- `formatTimestamp(timestamp: number): string` - 格式化时间戳

## 在项目中的使用

### 前端项目使用

```typescript
// 导入类型定义
import { WordQueryResponse, FavoriteWord } from '@ai-voca/shared';

// 导入工具函数
import { isValidWord, formatTimestamp } from '@ai-voca/shared';
```

### API Routes使用

API Routes中已内联了必要的类型定义和复杂功能，shared包主要提供基础类型参考。

## 版本历史

### v2.1.0 (当前) - 清理优化版本
- 🗑️ **代码清理**: 删除未使用的AI客户端、XML解析器、提示词生成器
- 📦 **轻量化**: 移除examples目录和未使用的工具函数
- 🎯 **专注核心**: 保留类型定义和基础工具函数
- 📝 **文档更新**: 更新文档反映当前状态

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建
npm run build

# 测试
npm run test

# 代码检查
npm run lint
```

### 添加新功能

如需添加新的类型定义或工具函数：

1. 在相应的模块中添加代码
2. 确保在index.ts中正确导出
3. 更新此README文档

## 许可证

MIT License

---

**📦 包状态**: ✅ 已清理优化，专注核心功能  
**🔧 维护状态**: ✅ 持续维护，定期清理  
**🚀 推荐用法**: 类型定义 + 基础工具函数