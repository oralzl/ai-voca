# @ai-voca/shared [部分功能已内联]

共享类型定义和工具函数包，为前端和后端提供统一的数据结构和实用工具。

## 📋 当前状态

由于项目迁移到云原生架构，部分功能已内联到前端项目中：

### ✅ 仍在使用的功能
- 📝 **XML解析**: `xml-parser.ts` 在前端中使用
- 🔧 **工具函数**: 部分验证和格式化函数
- 📊 **类型定义**: 作为参考和备份

### 🔄 已内联的功能
- 📡 **API Routes**: 类型定义已内联到 `packages/frontend/api/`
- 🎯 **前端组件**: Hook和组件直接使用内联类型
- 🔐 **认证相关**: 新的认证类型在前端中定义

## 功能特性

- 📝 **类型定义**: 完整的TypeScript类型定义
- 🔧 **工具函数**: 常用的验证、格式化和XML解析函数
- 📦 **模块化**: 按功能分类的模块化设计
- 🚀 **零依赖**: 不依赖任何外部库

## 使用方法

### 类型定义

```typescript
import { 
  WordQueryRequest, 
  WordQueryResponse, 
  WordExplanation,
  WordExample
} from '@ai-voca/shared';

// 查询请求（简化版，已移除language参数）
const request: WordQueryRequest = {
  word: 'hello',
  includeExample: true
};

// 查询响应（支持词形还原和重试参数）
const response: WordQueryResponse = {
  success: true,
  data: {
    word: 'run',
    text: 'run',
    lemmatizationExplanation: 'running是run的现在分词形式',
    pronunciation: 'rʌn',
    partOfSpeech: 'verb',
    definition: '跑步；运行；管理',
    simpleExplanation: 'To move quickly using your legs',
    examples: [
      {
        sentence: 'She is running in the park.',
        translation: '她正在公园里跑步。'
      }
    ],
    synonyms: ['jog', 'sprint'],
    antonyms: ['walk', 'stop'],
    etymology: '来自古英语rinnan',
    memoryTips: '记住run的多重含义'
  },
  inputParams: {
    word: 'run',
    includeExample: true,
    timestamp: 1704099600000
  },
  timestamp: 1704099600000
};
```

### XML解析功能

```typescript
import { 
  parseWordExplanationXml, 
  extractInputParams,
  isValidXml 
} from '@ai-voca/shared';

// 解析AI返回的XML格式单词解释
const xmlContent = `
<word>
  <text>run</text>
  <pronunciation>rʌn</pronunciation>
  <definition>跑步；运行</definition>
</word>
`;

const parsed = parseWordExplanationXml(xmlContent);

// 提取重试参数
const inputContent = `
<input>
  <word>run</word>
  <includeExample>true</includeExample>
  <timestamp>1704099600000</timestamp>
</input>
`;

const params = extractInputParams(inputContent);

// 验证XML格式
const isValid = isValidXml(xmlContent);
```

### 验证函数

```typescript
import { isValidWord } from '@ai-voca/shared';

// 验证单词格式（更新的验证规则）
if (isValidWord('hello')) {
  console.log('有效的单词');
}

// 支持的格式：
// ✅ 'hello' - 基本单词
// ✅ 'running' - 动词变形
// ✅ 'well-being' - 带连字符
// ✅ "can't" - 带撇号
// ❌ '' - 空字符串
// ❌ '123' - 纯数字
// ❌ 'a'.repeat(101) - 超长单词
```

### 格式化函数

```typescript
import { 
  formatWord, 
  formatTimestamp
} from '@ai-voca/shared';

// 格式化单词（去除多余空格，转小写）
const word = formatWord('  HELLO  '); // 'hello'

// 格式化时间戳
const time = formatTimestamp(Date.now()); // '2024-01-01 12:00:00'
```

## API 文档

### 更新的类型定义

#### WordQueryRequest
```typescript
interface WordQueryRequest {
  word: string;                    // 要查询的单词
  includeExample?: boolean;       // 是否包含例句，默认为 true
  // 注意：已移除 language 参数，现在专注中文解释
}
```

#### WordExplanation（支持词形还原）
```typescript
interface WordExplanation {
  word: string;                        // 显示的单词
  text?: string;                       // lemma后的单词原形
  lemmatizationExplanation?: string;   // 词形还原说明
  pronunciation?: string;              // 音标
  partOfSpeech?: string;              // 词性
  definition: string;                 // 中文释义
  simpleExplanation?: string;         // 英文简单解释
  examples?: WordExample[];           // 例句数组
  synonyms?: string[];                // 同义词
  antonyms?: string[];                // 反义词
  etymology?: string;                 // 词源信息
  memoryTips?: string;                // 记忆技巧
}
```

#### WordQueryResponse（支持重试机制）
```typescript
interface WordQueryResponse {
  success: boolean;                   // 是否成功
  data?: WordExplanation | null;      // 查询结果
  error?: string;                    // 错误信息
  rawResponse?: string;              // 原始AI响应（包含input标签）
  timestamp: number;                 // 时间戳
  queryCount?: number;               // 查询计数（已废弃）
  inputParams?: {                    // 重试机制参数
    word: string;
    includeExample: boolean;
    timestamp: number;
  };
}
```

### XML解析功能

#### 智能标签处理
- 支持 `<item>`, `<tip>`, `<entry>` 等AI返回的额外标签
- 自动将多个项目转换为HTML无序列表
- HTML安全处理，防止XSS攻击
- 优雅降级处理未知标签

#### 词形还原支持
- 自动识别动词时态变化（running → run）
- 支持名词复数形式（cats → cat）
- 处理形容词比较级（better → good）
- 同形异义词处理（leaves → leaf/leave）

### 工具函数

#### 验证函数

- `isValidWord(word: string): boolean` - 验证单词格式
- `isValidXml(xml: string): boolean` - 验证XML格式

#### 格式化函数

- `formatWord(word: string): string` - 格式化单词
- `formatTimestamp(timestamp: number): string` - 格式化时间戳

#### XML解析函数

- `parseWordExplanationXml(xmlContent: string): WordExplanation | null` - 解析AI XML响应
- `extractInputParams(rawResponse: string): {...} | null` - 提取重试参数
- `extractPlainText(xml: string): string` - 提取纯文本内容

## 在新架构中的使用

### 前端项目中的使用

在云原生架构中，推荐直接从前端项目使用：

```typescript
// 推荐：从前端项目直接导入
import { useWordQuery } from '../hooks/useWordQuery';
import { WordQueryResponse } from '../api/words/query';

// 仍可使用：从shared包导入工具函数
import { parseWordExplanationXml } from '@ai-voca/shared';
```

### API Routes中的使用

API Routes中已内联了必要的类型定义：

```typescript
// API Routes中的内联类型
interface WordQueryRequest {
  word: string;
  includeExample?: boolean;
}

// 内联的XML解析函数
function parseWordExplanationXml(xmlContent: string): WordExplanation | null {
  // 完整的解析逻辑已内联
}
```

## 版本历史

### v2.0.0 (当前) - 云原生适配版本
- 🔄 **部分功能内联**: 适配云原生架构
- 🧠 **词形还原**: 完善词形还原分析功能
- 🔄 **重试机制**: 支持智能重试参数解析
- 🏷️ **XML增强**: 支持更多AI返回的标签格式
- 📝 **类型更新**: 移除language参数，专注中文解释

### v1.2.0 - 重试功能版本
- 🔄 **重试参数**: 新增extractInputParams函数
- 📊 **输入参数类型**: 扩展WordQueryResponse类型

### v1.1.1 - XML增强版本
- 🏷️ **智能标签**: 支持item、tip、entry等标签
- 🛡️ **安全处理**: HTML安全清理功能

### v1.1.0 - 词形还原版本
- 🧠 **词形还原**: 新增lemmatization相关类型
- 📝 **类型简化**: 移除language参数
- 🎯 **专注中文**: 优化中文解释支持

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

### 在新项目中使用

如果您要在新项目中使用此包：

```bash
# 安装包
npm install @ai-voca/shared

# 导入类型和工具
import { WordQueryRequest, parseWordExplanationXml } from '@ai-voca/shared';
```

## 迁移说明

### 从旧版本迁移

如果您使用的是旧版本，请注意以下变化：

1. **移除language参数**: WordQueryRequest不再支持language参数
2. **新增重试机制**: WordQueryResponse新增inputParams字段
3. **词形还原支持**: WordExplanation新增lemmatization相关字段
4. **内联使用**: 推荐在API Routes中内联使用相关功能

### 与云原生架构配合

在新的云原生架构中：

- **类型定义**: 仍然有用，提供类型参考
- **XML解析**: 核心功能，在API Routes中广泛使用
- **工具函数**: 选择性使用，部分已在前端重新实现

## 许可证

MIT License

---

**📦 包状态**: 🔄 部分功能已内联，核心功能仍在使用  
**🔧 维护状态**: ✅ 持续维护，重点关注XML解析功能  
**🚀 推荐用法**: 与云原生架构配合使用