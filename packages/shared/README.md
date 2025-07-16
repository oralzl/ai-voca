# @ai-voca/shared

共享类型定义和工具函数包，为前端和后端提供统一的数据结构和实用工具。

## 功能特性

- 📝 **类型定义**: 完整的TypeScript类型定义
- 🔧 **工具函数**: 常用的验证、格式化和提示词生成函数
- 📦 **模块化**: 按功能分类的模块化设计
- 🚀 **零依赖**: 不依赖任何外部库

## 安装

```bash
npm install @ai-voca/shared
```

## 使用方法

### 类型定义

```typescript
import { 
  WordQueryRequest, 
  WordQueryResponse, 
  WordExplanation,
  AiHubMixRequest,
  AiHubMixResponse,
  ApiError,
  AppConfig 
} from '@ai-voca/shared';

// 使用类型定义
const request: WordQueryRequest = {
  word: 'hello',
  language: 'zh',
  includeExample: true
};
```

### 验证函数

```typescript
import { isValidWord, isValidApiKey, isValidUrl } from '@ai-voca/shared';

// 验证单词格式
if (isValidWord('hello')) {
  console.log('有效的单词');
}

// 验证API密钥
if (isValidApiKey('sk-xxx')) {
  console.log('有效的API密钥');
}

// 验证URL
if (isValidUrl('https://example.com')) {
  console.log('有效的URL');
}
```

### 格式化函数

```typescript
import { 
  formatWord, 
  formatTimestamp, 
  truncateText, 
  capitalize 
} from '@ai-voca/shared';

// 格式化单词
const word = formatWord('  HELLO  '); // 'hello'

// 格式化时间戳
const time = formatTimestamp(Date.now()); // '2024-01-01 12:00:00'

// 截取文本
const text = truncateText('很长的文本...', 10); // '很长的文本...'

// 首字母大写
const capitalized = capitalize('hello'); // 'Hello'
```

### 提示词生成

```typescript
import { 
  createSystemPrompt, 
  createWordQueryMessage, 
  createAiMessages 
} from '@ai-voca/shared';

// 生成系统提示词
const systemPrompt = createSystemPrompt('zh');

// 生成用户查询消息
const userMessage = createWordQueryMessage('hello', true);

// 生成完整的AI消息数组
const messages = createAiMessages('hello', 'zh', true);
```

## API 文档

### 类型定义

#### WordQueryRequest
```typescript
interface WordQueryRequest {
  word: string;                    // 要查询的单词
  language?: 'zh' | 'en';         // 解释语言，默认为 'zh'
  includeExample?: boolean;       // 是否包含例句，默认为 true
}
```

#### WordExplanation
```typescript
interface WordExplanation {
  word: string;                   // 单词
  pronunciation?: string;         // 音标
  partOfSpeech?: string;         // 词性
  definition: string;            // 释义
  example?: string;              // 例句
  synonyms?: string[];           // 同义词
  antonyms?: string[];           // 反义词
  etymology?: string;            // 词源
}
```

#### WordQueryResponse
```typescript
interface WordQueryResponse {
  success: boolean;              // 是否成功
  data?: WordExplanation;        // 查询结果
  error?: string;               // 错误信息
  timestamp: number;            // 时间戳
}
```

### 工具函数

#### 验证函数

- `isValidWord(word: string): boolean` - 验证单词格式
- `isValidApiKey(apiKey: string): boolean` - 验证API密钥格式
- `isValidUrl(url: string): boolean` - 验证URL格式

#### 格式化函数

- `formatWord(word: string): string` - 格式化单词
- `formatTimestamp(timestamp: number): string` - 格式化时间戳
- `truncateText(text: string, maxLength: number): string` - 截取文本
- `capitalize(text: string): string` - 首字母大写

#### 提示词生成

- `createSystemPrompt(language: 'zh' | 'en'): string` - 生成系统提示词
- `createWordQueryMessage(word: string, includeExample: boolean): string` - 生成查询消息
- `createAiMessages(word: string, language: 'zh' | 'en', includeExample: boolean): AiHubMixMessage[]` - 生成完整消息数组

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm run test

# 代码检查
npm run lint
```

## 许可证

MIT License