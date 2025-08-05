# 复习系统 API 文档

## 概述

复习系统API提供词汇复习相关的功能，包括候选词获取、复习提交、句子生成等。

## API端点

### 1. GET /api/review/candidates

获取今天需要复习的候选词汇和生成参数。

#### 请求参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| n | number | 否 | 15 | 候选词数量（1-50） |

#### 请求头

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### 响应格式

```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "word": "offset",
        "state": {
          "familiarity": 2,
          "difficulty": 2.5,
          "successes": 3,
          "lapses": 1,
          "last_seen_at": "2025-01-20T10:00:00Z",
          "next_due_at": "2025-01-20T10:00:00Z"
        },
        "next_due_at": "2025-01-20T10:00:00Z"
      }
    ],
    "generation_params": {
      "targets": ["offset", "staggering", "adequate"],
      "profile": {
        "level_cefr": "B1",
        "allow_incidental": true,
        "unknown_budget": 2,
        "style": "neutral",
        "difficulty_bias": 0.0
      },
      "constraints": {
        "sentence_length_range": [12, 22],
        "max_targets_per_sentence": 2
      }
    }
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "error": "错误信息"
}
```

#### 实现逻辑

1. **用户认证**：验证JWT token
2. **候选词选择**：
   - 优先选择今天需要复习的词汇（`next_due_at <= now`）
   - 不足时补充新收藏的词汇（`next_due_at IS NULL`）
3. **用户偏好获取**：从`user_review_prefs`表获取用户设置
4. **难度调整**：根据最近7天的反馈调整`difficulty_bias`
5. **生成参数**：构建句子生成所需的参数

#### 状态码

- `200`：成功
- `400`：参数错误
- `401`：未认证
- `405`：方法不允许
- `500`：服务器错误

## 开发说明

### 环境变量

需要以下环境变量：

- `SUPABASE_URL`：Supabase项目URL
- `SUPABASE_ANON_KEY`：Supabase匿名密钥（认证用）
- `SUPABASE_SERVICE_KEY`：Supabase服务密钥（数据库操作用）
- `AIHUB_API_KEY`：AIHub API密钥（句子生成用）
- `AIHUB_API_URL`：AIHub API URL（默认https://api.aihub.com）
- `AIHUB_MODEL`：AIHub模型名称（默认gemini-1.5-flash）

### 数据库依赖

API依赖以下数据库表：

- `user_word_state`：词汇状态台账
- `user_review_prefs`：用户复习偏好
- `review_events`：复习事件记录

### 测试

运行测试：

```bash
# 在packages/frontend目录下
npm run dev:api
```

然后访问：`http://localhost:3001/api/review/candidates`

### 2. POST /api/review/generate

生成包含目标词汇的自然句子。

#### 请求体

```json
{
  "targets": ["happy", "success", "learn"],
  "profile": {
    "level_cefr": "B1",
    "allow_incidental": true,
    "unknown_budget": 2,
    "style": "neutral",
    "difficulty_bias": 0.0
  },
  "constraints": {
    "sentence_length_range": [12, 22],
    "max_targets_per_sentence": 3
  }
}
```

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| targets | string[] | 是 | 目标词汇列表（最多8个） |
| profile | object | 是 | 用户偏好设置 |
| profile.level_cefr | string | 是 | CEFR等级（A1-C2） |
| profile.allow_incidental | boolean | 否 | 是否允许顺带学习（默认true） |
| profile.unknown_budget | number | 否 | 每句允许新词数（默认2） |
| profile.style | string | 否 | 生成风格（neutral/news/dialog/academic，默认neutral） |
| profile.difficulty_bias | number | 否 | 难度偏置（-1.5到+1.5，默认0） |
| constraints | object | 是 | 生成约束 |
| constraints.sentence_length_range | number[] | 否 | 句长范围[最小,最大]（默认[12,22]） |
| constraints.max_targets_per_sentence | number | 否 | 每句最大目标词数（默认4） |

#### 响应格式

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "sid": "s1",
        "text": "I feel happy when I achieve success in my work.",
        "targets": [
          {"word": "happy", "begin": 2, "end": 2},
          {"word": "success", "begin": 6, "end": 6}
        ],
        "self_eval": {
          "predicted_cefr": "B1",
          "estimated_new_terms_count": 1,
          "new_terms": [
            {"surface": "achieve", "cefr": "B1", "gloss": "to succeed in doing something"}
          ],
          "reason": "Natural sentence with both targets, appropriate B1 level"
        }
      }
    ]
  }
}
```

#### 实现逻辑

1. **用户认证**：验证JWT token
2. **参数验证**：验证目标词汇数量和参数格式
3. **LLM调用**：构建提示词并调用LLM生成句子
4. **响应解析**：解析LLM响应并验证结构
5. **兜底机制**：LLM失败时使用简单兜底句子
6. **目标词验证**：确保所有目标词都被包含在生成结果中

#### 状态码

- `200`：成功（包括使用兜底机制的情况）
- `400`：参数错误
- `401`：未认证
- `405`：方法不允许
- `500`：服务器错误

### 3. POST /api/review/submit

提交复习反馈并更新词汇状态。

#### 请求体

```json
{
  "word": "offset",
  "rating": "good",
  "difficulty_feedback": "ok",
  "latency_ms": 2500,
  "meta": {
    "delivery_id": "uuid-xxxx",
    "predicted_cefr": "B1",
    "estimated_new_terms_count": 1
  }
}
```

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| word | string | 是 | 复习的词汇 |
| rating | string | 是 | 复习结果（again/hard/good/easy/unknown） |
| difficulty_feedback | string | 否 | 整体难度反馈（too_easy/ok/too_hard） |
| latency_ms | number | 否 | 响应时间（毫秒） |
| meta | object | 否 | 元数据信息 |

#### 响应格式

```json
{
  "success": true,
  "data": {
    "word_state": {
      "familiarity": 3,
      "difficulty": 2.5,
      "stability": 7,
      "successes": 4,
      "lapses": 1,
      "last_seen_at": "2025-01-20T10:00:00Z",
      "next_due_at": "2025-01-27T10:00:00Z"
    },
    "user_prefs": {
      "level_cefr": "B1",
      "allow_incidental": true,
      "unknown_budget": 2,
      "style": "neutral",
      "difficulty_bias": 0.1
    }
  }
}
```

#### 实现逻辑

1. **用户认证**：验证JWT token
2. **词汇状态获取**：从`user_word_state`表获取当前状态
3. **FSRS算法更新**：使用FSRS算法计算新的熟悉度和下次复习时间
4. **数据库更新**：更新词汇状态和用户偏好
5. **事件记录**：记录复习事件到`review_events`表
6. **难度调整**：根据难度反馈调整用户偏好

#### 状态码

- `200`：成功
- `400`：参数错误
- `401`：未认证
- `405`：方法不允许
- `500`：服务器错误

### 4. GET /api/review/count

获取今日需要复习的词汇数量和总收藏数量。

#### 请求头

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### 响应格式

```json
{
  "success": true,
  "data": {
    "today_count": 15,
    "total_count": 150
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "error": "错误信息"
}
```

#### 实现逻辑

1. **用户认证**：验证JWT token
2. **缓存检查**：检查内存缓存中是否有有效数据（5分钟TTL）
3. **数据库查询**：
   - 查询今日需要复习的词汇数量（`next_due_at <= tomorrow AND next_due_at >= today`）
   - 查询用户总收藏词汇数量
4. **缓存更新**：将查询结果缓存到内存中
5. **实时更新**：支持缓存失效后的实时计数更新

#### 缓存机制

- **缓存策略**：内存缓存，按用户ID隔离
- **缓存时间**：5分钟TTL
- **缓存键**：`review_count:${userId}`
- **缓存失效**：自动过期或手动清除

#### 状态码

- `200`：成功
- `401`：未认证
- `405`：方法不允许
- `500`：服务器错误

## 版本历史

- `v1.0.0`：初始版本，实现候选词获取功能
- `v1.1.0`：新增复习提交功能
- `v1.2.0`：新增句子生成功能，支持LLM调用和兜底机制
- `v1.3.0`：新增复习计数功能，支持缓存机制和实时更新 