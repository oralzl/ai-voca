# Utils - 共享工具函数

此目录包含前后端共享的工具函数和服务类，提供通用功能支持。支持云原生架构下的词形还原、智能重试和XML解析功能。

## 📦 模块说明

### validation.ts - 输入验证
```typescript
// 验证单词格式
export function isValidWord(word: string): boolean;
```

**功能特性**:
- ✅ 支持英文字母、数字、连字符和撇号
- ✅ 长度限制: 1-50字符
- ✅ 自动去除首尾空格
- ✅ 支持复合词（如 "well-being"）
- ✅ 支持缩写词（如 "can't", "don't"）

**使用示例**:
```typescript
isValidWord('hello');        // true
isValidWord('running');      // true - 支持词形变化
isValidWord('well-being');   // true - 支持连字符
isValidWord("can't");        // true - 支持撇号
isValidWord('');             // false - 空字符串
isValidWord('a'.repeat(60)); // false - 超长
```

### formatting.ts - 文本格式化
```typescript
// 格式化单词
export function formatWord(word: string): string;

// 格式化时间戳
export function formatTimestamp(timestamp: number): string;
```

**功能特性**:
- 🔤 **单词格式化**: 去除多余空格，转换小写
- 📅 **时间格式化**: 本地化时间显示
- 🛡️ **安全处理**: 防止空值和类型错误

**使用示例**:
```typescript
formatWord('  HELLO  ');     // 'hello'
formatWord('Running');       // 'running' 
formatTimestamp(Date.now()); // '2024-07-19 15:30:00'
```

### prompt.ts - AI提示词生成
```typescript
// 创建系统提示词
export function createSystemPrompt(): string;

// 创建单词查询消息
export function createWordQueryMessage(word: string, includeExample: boolean): string;

// 创建完整AI消息数组
export function createAiMessages(word: string, includeExample: boolean): AiHubMixMessage[];
```

**功能特性**:
- 🧠 **智能提示**: 专为中文解释优化的提示词
- 🔄 **词形还原**: 支持lemmatization分析提示
- 📝 **XML格式**: 要求AI返回结构化XML响应
- 🎯 **专业术语**: 包含音标、词性、例句等完整信息

**使用示例**:
```typescript
const messages = createAiMessages('running', true);
// 生成包含系统提示和用户查询的消息数组
```

### xml-parser.ts - XML解析
```typescript
// 解析AI返回的XML单词解释
export function parseWordExplanationXml(xmlContent: string): WordExplanation | null;

// 提取重试参数
export function extractInputParams(rawResponse: string): { 
  word: string; 
  includeExample: boolean; 
  timestamp: number; 
} | null;

// 验证XML格式
export function isValidXml(xml: string): boolean;

// 提取纯文本内容
export function extractPlainText(xml: string): string;
```

**功能特性**:
- 🏷️ **智能标签处理**: 支持AI返回的多种XML标签格式
- 📝 **HTML转换**: 自动将 `<item>` 标签转换为无序列表
- 🛡️ **安全清理**: 防止XSS攻击，只保留安全HTML元素
- 🔄 **重试支持**: 解析 `<input>` 标签提取查询参数
- 🧠 **词形还原**: 支持lemmatization相关字段解析

**支持的XML标签**:
```xml
<word>
  <text>原形单词</text>
  <lemmatization_explanation>词形还原说明</lemmatization_explanation>
  <pronunciation>音标</pronunciation>
  <part_of_speech>词性</part_of_speech>
  <definition>
    <item>释义1</item>
    <item>释义2</item>
  </definition>
  <simple_explanation>英文解释</simple_explanation>
  <examples>
    <example>
      <sentence>例句</sentence>
      <translation>翻译</translation>
    </example>
  </examples>
  <synonyms><synonym>同义词</synonym></synonyms>
  <antonyms><antonym>反义词</antonym></antonyms>
  <etymology>词源</etymology>
  <memory_tips>记忆技巧</memory_tips>
</word>
```

**使用示例**:
```typescript
const parsed = parseWordExplanationXml(aiResponse);
if (parsed) {
  console.log(parsed.word);                    // 单词
  console.log(parsed.lemmatizationExplanation); // 词形还原说明
  console.log(parsed.definition);              // HTML格式的释义
}

const params = extractInputParams(rawResponse);
if (params) {
  // 支持重试功能
  await retryQuery(params.word, params.includeExample);
}
```

### aihubmix-client.ts - AI API客户端
```typescript
// AI服务客户端类
export class AiHubMixClient;

// 客户端工厂函数
export function createAiHubMixClient(config: AppConfig): AiHubMixClient;

// 从环境变量创建客户端
export function createAiHubMixClientFromEnv(): AiHubMixClient;
```

**功能特性**:
- 🤖 **AI API封装**: 统一的AiHubMix API调用接口
- ⚙️ **配置管理**: 支持环境变量和手动配置
- 🔄 **错误重试**: 内置重试机制和错误处理
- 📊 **请求监控**: 记录API调用统计信息
- 🛡️ **类型安全**: 完整的TypeScript类型支持

**使用示例**:
```typescript
// 从环境变量创建客户端
const client = createAiHubMixClientFromEnv();

// 查询单词
const messages = createAiMessages('hello', true);
const response = await client.chat(messages);
```

## 🔧 在云原生架构中的使用

### API Routes中的使用
```typescript
// packages/frontend/api/words/query.ts
import { 
  isValidWord, 
  formatWord, 
  createAiMessages,
  parseWordExplanationXml,
  createAiHubMixClientFromEnv 
} from '@ai-voca/shared';

export default async function handler(req, res) {
  const { word } = req.body;
  
  // 验证和格式化
  if (!isValidWord(word)) {
    return res.status(400).json({ error: '无效的单词格式' });
  }
  
  const formattedWord = formatWord(word);
  
  // AI查询
  const client = createAiHubMixClientFromEnv();
  const messages = createAiMessages(formattedWord, true);
  const aiResponse = await client.chat(messages);
  
  // 解析响应
  const parsed = parseWordExplanationXml(aiResponse);
  
  return res.json({ success: true, data: parsed });
}
```

### 前端组件中的使用
```typescript
// packages/frontend/src/hooks/useWordQuery.ts
import { parseWordExplanationXml, extractInputParams } from '@ai-voca/shared';

export function useWordQuery() {
  const handleResponse = (rawResponse: string) => {
    const parsed = parseWordExplanationXml(rawResponse);
    const inputParams = extractInputParams(rawResponse);
    
    return {
      data: parsed,
      inputParams,
      rawResponse
    };
  };
}
```

## 🚀 设计原则

1. **零外部依赖**: 避免与主项目依赖冲突
2. **类型安全**: 完整的TypeScript类型支持
3. **功能聚焦**: 每个模块职责单一明确
4. **错误容错**: 优雅处理各种边界情况
5. **向后兼容**: 支持旧版本API格式
6. **云原生适配**: 适配Vercel等无服务器环境

## 📚 相关文档

- **类型定义**: `../types/README.md`
- **项目文档**: `../../../../README.md`
- **前端集成**: `../../../frontend/README.md`

## 🔄 版本历史

### v2.0.0 (当前) - 云原生适配版本
- 🔄 适配云原生架构，部分功能内联使用
- 🧠 完善词形还原分析功能
- 🏷️ 智能XML标签处理，支持item、tip、entry等
- 🔄 重试机制参数提取功能

### v1.2.0 - 重试功能版本
- 🔄 新增extractInputParams函数
- 📊 扩展XML解析支持重试参数

### v1.1.1 - XML增强版本  
- 🏷️ 智能标签解析，支持多种AI返回格式
- 🛡️ HTML安全清理功能

### v1.1.0 - 词形还原版本
- 🧠 新增lemmatization分析支持
- 📝 优化中文提示词生成
- 🎯 专注中文解释功能

---

**📦 模块状态**: 🔄 部分功能已内联，核心功能持续维护  
**🔧 推荐用法**: 选择性导入，与云原生架构配合  
**📖 最后更新**: 2024年7月