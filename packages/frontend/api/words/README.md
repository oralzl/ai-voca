# Words API - 单词查询服务

单词查询相关的API端点，提供AI驱动的智能单词解释功能。

## 📋 API端点

### POST/GET `/api/words/query`
查询英文单词的详细解释（需要登录）

**请求参数**:
```typescript
{
  word: string;              // 要查询的单词
  includeExample?: boolean;  // 是否包含例句，默认true
}
```

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "word": "running",
    "text": "run",
    "lemmatizationExplanation": "running是run的现在分词形式",
    "pronunciation": "ˈrʌnɪŋ",
    "partOfSpeech": "动词现在分词/名词",
    "definition": "跑步；运行；管理",
    "simpleExplanation": "Moving quickly on foot",
    "examples": [
      {
        "sentence": "She is running in the park.",
        "translation": "她正在公园里跑步。"
      }
    ],
    "synonyms": ["jogging", "sprinting"],
    "antonyms": ["walking", "standing"],
    "etymology": "来自古英语 rinnan",
    "memoryTips": "记住run的动作感，running就是正在进行的跑步"
  },
  "inputParams": {
    "word": "running",
    "includeExample": true,
    "timestamp": 1704099600000
  },
  "timestamp": 1704099600000
}
```

### GET `/api/words`
API文档和使用说明

## 🧠 核心功能

### 词形还原分析
- **动词变形**: running → run, went → go
- **名词复数**: cats → cat, children → child  
- **形容词比较级**: better → good, fastest → fast
- **说明生成**: 自动生成词形还原的中文解释

### 智能重试机制
- **参数保存**: 在响应中嵌入查询参数
- **一键重试**: 前端可使用保存的参数重新查询
- **独立会话**: 每次重试都是新的AI对话

### XML智能解析
- **结构化响应**: AI返回XML格式的结构化数据
- **标签处理**: 支持多种XML标签格式
- **HTML转换**: 自动将特定标签转换为HTML列表
- **安全清理**: 防止XSS攻击的内容清理

## 🔧 技术实现

### AI集成
```typescript
// 创建AI客户端
const client = createAiHubMixClientFromEnv();

// 构建查询消息
const messages = createAiMessages(word, includeExample);

// 调用AI API
const aiResponse = await client.chatCompletion(messages, {
  temperature: 0.1,
  maxTokens: 2000
});
```

### 认证验证
```typescript
// JWT token验证
const token = req.headers.authorization?.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return res.status(401).json({ error: '请先登录' });
}
```

### 数据库记录
```typescript
// 保存查询历史
await supabase
  .from('word_queries')
  .insert({
    user_id: user.id,
    word: formattedWord,
    success: true,
    created_at: new Date().toISOString()
  });
```

## 🛡️ 安全措施

### 输入验证
- **格式检查**: 验证单词格式的合法性
- **长度限制**: 防止过长的输入导致的问题
- **特殊字符**: 过滤危险的特殊字符

### 错误处理
- **分类处理**: 区分认证错误、输入错误、系统错误
- **用户友好**: 返回易懂的中文错误信息
- **日志记录**: 记录详细错误信息用于调试

### 资源保护
- **认证必需**: 所有查询都需要用户登录
- **速率限制**: 防止API滥用（通过Vercel内置）
- **环境隔离**: 敏感配置通过环境变量管理

## 📊 使用统计

查询API会自动记录用户的使用统计：
- **查询次数**: 记录用户总查询次数
- **查询历史**: 保存具体的查询记录
- **成功率**: 统计查询的成功失败比例

---

**📦 API状态**: ✅ 生产环境稳定运行  
**🤖 AI模型**: gemini-2.5-flash-lite-preview-06-17  
**⚡ 响应时间**: 通常2-5秒（AI处理时间）