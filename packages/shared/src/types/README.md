# Types - 共享类型定义

此目录包含 @ai-voca/shared 包的所有TypeScript类型定义，为前端和后端提供统一的类型安全保障。

## 📋 主要类型

### API相关类型

#### WordQueryRequest
单词查询请求参数（已简化，移除language参数）：
```typescript
interface WordQueryRequest {
  word: string;              // 要查询的单词
  includeExample?: boolean;  // 是否包含例句，默认true
}
```

#### WordQueryResponse  
单词查询响应结构（支持重试机制）：
```typescript
interface WordQueryResponse {
  success: boolean;          // 查询是否成功
  data?: WordExplanation;    // 单词解释数据
  error?: string;           // 错误信息
  timestamp: number;        // 时间戳
  rawResponse?: string;     // AI原始响应（包含input标签）
  inputParams?: {           // 重试参数
    word: string;
    includeExample: boolean;
    timestamp: number;
  };
}
```

#### WordExplanation
单词解释数据模型（支持词形还原）：
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

#### WordExample
例句接口：
```typescript
interface WordExample {
  sentence: string;      // 英文例句
  translation?: string;  // 中文翻译
}
```

### AI服务类型

#### AiHubMixMessage
AI消息格式：
```typescript
interface AiHubMixMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

#### AiHubMixRequest
AI API请求：
```typescript
interface AiHubMixRequest {
  model: string;
  messages: AiHubMixMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}
```

#### AiHubMixResponse
AI API响应：
```typescript
interface AiHubMixResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: AiHubMixMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### 通用类型

#### ApiError
错误处理接口：
```typescript
interface ApiError {
  code: string;
  message: string;
  details?: any;
}
```

#### AppConfig
应用配置接口：
```typescript
interface AppConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  timeout: number;
}
```

## 使用方式

### 类型导入
```typescript
// 仅导入类型（推荐）
import type { 
  WordQueryRequest, 
  WordQueryResponse,
  WordExplanation,
  WordExample 
} from '@ai-voca/shared';

// 运行时导入（如果需要）
import { WordQueryRequest } from '@ai-voca/shared';
```

### 在API中使用
```typescript
// API Routes中的使用
export default async function handler(
  req: NextApiRequest & { body: WordQueryRequest },
  res: NextApiResponse<WordQueryResponse>
) {
  // 类型安全的请求处理
}
```

### 在组件中使用
```typescript
// React组件中的使用
interface Props {
  result?: WordQueryResponse;
  onQuery: (request: WordQueryRequest) => void;
}

const WordComponent: React.FC<Props> = ({ result, onQuery }) => {
  // 类型安全的组件实现
};
```

## 🔄 版本更新

### v2.0.0 - 云原生适配
- 移除 `language` 参数，专注中文解释
- 新增 `inputParams` 字段支持重试机制
- 扩展 `WordExplanation` 支持词形还原

### v1.2.0 - 重试功能
- 新增 `inputParams` 字段
- 扩展 `rawResponse` 字段用于调试

### v1.1.0 - 词形还原功能  
- 新增 `text` 和 `lemmatizationExplanation` 字段
- 支持多例句的 `examples` 数组

## 类型安全原则

1. **强类型约束**: 所有API接口必须使用定义的类型
2. **前后端一致**: 前后端共享类型确保数据一致性  
3. **向后兼容**: 保留 `example` 字段支持旧版本
4. **扩展性**: 新功能通过可选字段扩展
5. **文档化**: 关键字段提供清晰的注释说明

---

**📦 模块状态**: ✅ 活跃维护  
**🔧 兼容性**: 支持云原生架构  
**📖 最后更新**: 2024年7月