# API变更说明文档

本文档记录AI词汇查询应用的API变更历史，帮助开发者了解版本间的兼容性变化。

## v1.1.0 → v1.0.0 重大变更

### 🚨 破坏性变更

#### 1. 移除 `language` 参数

**v1.0.0 (旧版)**:
```typescript
interface WordQueryRequest {
  word: string;
  language?: 'zh' | 'en';  // ❌ 已移除
  includeExample?: boolean;
}
```

**v1.1.0 (新版)**:
```typescript
interface WordQueryRequest {
  word: string;
  includeExample?: boolean;  // ✅ 保留
}
```

**影响**: 
- 所有API调用必须移除 `language` 参数
- 系统现在只提供中文解释

**迁移指南**:
```typescript
// 旧版调用方式
const result = await wordApi.queryWord({
  word: 'hello',
  language: 'zh',  // ❌ 移除此参数
  includeExample: true
});

// 新版调用方式
const result = await wordApi.queryWord({
  word: 'hello',
  includeExample: true  // ✅ 只保留必要参数
});
```

#### 2. API端点URL保持不变

- `GET /api/words/query` ✅ 无变化
- `POST /api/words/query` ✅ 无变化
- `GET /health` ✅ 无变化

### 🆕 新增功能

#### 1. 词形还原字段

**新增响应字段**:
```typescript
interface WordExplanation {
  // 现有字段保持不变
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definition: string;
  
  // 🆕 新增字段
  text?: string;                      // lemma后的单词原形
  lemmatizationExplanation?: string;  // 词形还原说明
  
  // 现有字段保持不变
  simpleExplanation?: string;
  examples?: WordExample[];
  synonyms?: string[];
  antonyms?: string[];
  etymology?: string;
  memoryTips?: string;
}
```

**示例响应**:
```json
{
  "success": true,
  "data": {
    "word": "run",
    "text": "run",                                    // 🆕 原形
    "lemmatizationExplanation": "running是run的现在分词形式，表示正在进行的动作",  // 🆕 说明
    "definition": "跑步；运行；管理",
    "pronunciation": "rʌn",
    // ... 其他字段
  }
}
```

#### 2. 多word响应处理

当AI返回多个词汇解释时：
- API自动选择第一个解释作为主要结果
- 完整的AI响应保存在 `rawResponse` 字段中
- 前端只显示第一个解释，但可查看完整响应

### 📊 兼容性矩阵

| 功能 | v1.0.0 | v1.1.0 | 兼容性 |
|------|--------|--------|--------|
| 基础单词查询 | ✅ | ✅ | ✅ 兼容 |
| language参数 | ✅ | ❌ | ❌ 破坏性变更 |
| 中文解释 | ✅ | ✅ | ✅ 兼容 |
| 英文解释 | ✅ | ❌ | ❌ 不再支持 |
| 例句功能 | ✅ | ✅ | ✅ 兼容 |
| 词形还原 | ❌ | ✅ | ✅ 新增功能 |
| 多word处理 | ❌ | ✅ | ✅ 新增功能 |

### 🔄 迁移步骤

#### 1. 前端代码迁移

**Hook调用更新**:
```typescript
// 旧版
const { queryWord } = useWordQuery();
await queryWord('hello', 'zh', true);

// 新版
const { queryWord } = useWordQuery();
await queryWord('hello', true);
```

**组件Props更新**:
```typescript
// 旧版组件接口
interface WordQueryFormProps {
  onQuery: (word: string, language: 'zh' | 'en', includeExample: boolean) => void;
}

// 新版组件接口
interface WordQueryFormProps {
  onQuery: (word: string, includeExample: boolean) => void;
}
```

#### 2. API客户端代码迁移

```typescript
// 旧版API调用
const response = await fetch('/api/words/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    word: 'hello',
    language: 'zh',  // ❌ 移除
    includeExample: true
  })
});

// 新版API调用
const response = await fetch('/api/words/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    word: 'hello',
    includeExample: true  // ✅ 保留
  })
});
```

#### 3. 环境变量更新

无需更新环境变量，所有现有配置保持有效。

### 📝 测试更新

#### 单元测试更新示例

```typescript
// 旧版测试
describe('WordService', () => {
  it('should query word with language', async () => {
    const result = await wordService.queryWord({
      word: 'hello',
      language: 'zh',  // ❌ 移除
      includeExample: true
    });
    expect(result.success).toBe(true);
  });
});

// 新版测试
describe('WordService', () => {
  it('should query word and return lemmatization', async () => {
    const result = await wordService.queryWord({
      word: 'running',
      includeExample: true
    });
    expect(result.success).toBe(true);
    expect(result.data?.text).toBe('run');  // 🆕 验证词形还原
    expect(result.data?.lemmatizationExplanation).toBeDefined();  // 🆕 验证说明
  });
});
```

### 🚀 性能改进

- **提示词优化**: 新的中文专用提示词提升AI响应质量
- **响应解析**: 优化XML解析逻辑，支持多word场景
- **类型安全**: 简化类型定义，减少运行时检查

### 🔍 故障排除

#### 常见迁移问题

1. **TypeError: language is not defined**
   ```
   解决方案: 移除所有language参数的使用
   ```

2. **前端语言选择器不工作**
   ```
   解决方案: 移除语言选择UI组件，系统只支持中文
   ```

3. **英文解释不显示**
   ```
   解决方案: 这是预期行为，v1.1.0只提供中文解释
   ```

### 📚 相关文档

- [主要项目文档](../README.md)
- [后端API文档](../packages/backend/README.md)
- [开发指南](../CLAUDE.md)

---

**最后更新**: 2024年7月  
**版本**: v1.1.0