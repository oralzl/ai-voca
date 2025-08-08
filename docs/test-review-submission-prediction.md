# 📋 复习提交测试预测文档

## 🎯 测试场景描述
用户提交以下复习反馈：
- **dog**: 完全不记得 (again)
- **some**: 需要提示 (hard)
- **apple**: 基本掌握 (good)
- **hello**: 熟练掌握 (easy)
- **can**: 熟练掌握 (easy)
- **整体难度**: 合适 (ok)

## 📊 提交前真实数据状态

### 词汇状态表
| 词汇 | 熟悉度 | 间隔天数 | 成功次数 | 失败次数 | 下次复习时间 | 难度系数 |
|------|--------|----------|----------|----------|--------------|----------|
| **apple** | 0 | 1 | 0 | 0 | 2025-08-05 16:16 | 2.500 |
| **can** | 0 | 1 | 0 | 0 | 2025-08-06 03:10 | 2.500 |
| **dog** | 0 | 1 | 0 | 0 | 2025-08-06 04:11 | 2.500 |
| **hello** | 0 | 1 | 0 | 0 | 2025-08-06 03:43 | 2.500 |
| **some** | 0 | 1 | 0 | 0 | 2025-08-06 04:15 | 2.500 |

### 用户偏好状态
- **user_review_prefs**: 无记录（使用默认值）
- **difficulty_bias**: 0.0
- **level_cefr**: B1
- **unknown_budget**: 2

## 📈 review_events 预测记录

### 1. 词汇反馈记录（5条）

#### 🔴 dog - 完全不记得
```sql
INSERT INTO review_events (
  user_id, 
  delivery_id, 
  event_type, 
  word, 
  rating, 
  response_time_ms, 
  meta,
  created_at
) VALUES (
  '6b7fdadc-55f4-4076-9bc1-61af5e769b32',
  'test-delivery-id-12345',
  'word_again',
  'dog',
  1,
  2500,
  '{"delivery_id": "test-delivery-id-12345", "predicted_cefr": "B1", "estimated_new_terms_count": 5}',
  NOW()
);
```

#### 🟡 some - 需要提示
```sql
INSERT INTO review_events (
  user_id, 
  delivery_id, 
  event_type, 
  word, 
  rating, 
  response_time_ms, 
  meta,
  created_at
) VALUES (
  '6b7fdadc-55f4-4076-9bc1-61af5e769b32',
  'test-delivery-id-12345',
  'word_hard',
  'some',
  2,
  1800,
  '{"delivery_id": "test-delivery-id-12345", "predicted_cefr": "B1", "estimated_new_terms_count": 5}',
  NOW()
);
```

#### 🟢 apple - 基本掌握
```sql
INSERT INTO review_events (
  user_id, 
  delivery_id, 
  event_type, 
  word, 
  rating, 
  response_time_ms, 
  meta,
  created_at
) VALUES (
  '6b7fdadc-55f4-4076-9bc1-61af5e769b32',
  'test-delivery-id-12345',
  'word_good',
  'apple',
  3,
  1200,
  '{"delivery_id": "test-delivery-id-12345", "predicted_cefr": "B1", "estimated_new_terms_count": 5}',
  NOW()
);
```

#### 🟢 hello - 熟练掌握
```sql
INSERT INTO review_events (
  user_id, 
  delivery_id, 
  event_type, 
  word, 
  rating, 
  response_time_ms, 
  meta,
  created_at
) VALUES (
  '6b7fdadc-55f4-4076-9bc1-61af5e769b32',
  'test-delivery-id-12345',
  'word_easy',
  'hello',
  4,
  800,
  '{"delivery_id": "test-delivery-id-12345", "predicted_cefr": "B1", "estimated_new_terms_count": 5}',
  NOW()
);
```

#### 🟢 can - 熟练掌握
```sql
INSERT INTO review_events (
  user_id, 
  delivery_id, 
  event_type, 
  word, 
  rating, 
  response_time_ms, 
  meta,
  created_at
) VALUES (
  '6b7fdadc-55f4-4076-9bc1-61af5e769b32',
  'test-delivery-id-12345',
  'word_easy',
  'can',
  4,
  900,
  '{"delivery_id": "test-delivery-id-12345", "predicted_cefr": "B1", "estimated_new_terms_count": 5}',
  NOW()
);
```

### 2. 整体难度反馈记录（1条）

#### ✅ 整体难度合适
```sql
INSERT INTO review_events (
  user_id, 
  delivery_id, 
  event_type, 
  sentence_text, 
  meta,
  created_at
) VALUES (
  '6b7fdadc-55f4-4076-9bc1-61af5e769b32',
  'test-delivery-id-12345',
  'sentence_ok',
  'review_session',
  '{"delivery_id": "test-delivery-id-12345", "predicted_cefr": "B1", "estimated_new_terms_count": 5}',
  NOW()
);
```

## 🔄 数据变化总结

### 总记录数：6条
- **词汇反馈**: 5条
- **难度反馈**: 1条

### 事件类型分布
| 事件类型 | 数量 | 描述 |
|----------|------|------|
| word_again | 1 | dog - 完全不记得 |
| word_hard | 1 | some - 需要提示 |
| word_good | 1 | apple - 基本掌握 |
| word_easy | 2 | hello, can - 熟练掌握 |
| sentence_ok | 1 | 整体难度合适 |

### 关联变化
1. **user_word_state** 表：5条记录更新
2. **user_review_prefs** 表：1条新记录创建
3. **review_events** 表：6条新记录插入

## ✅ 验证检查点
- [ ] 所有6条记录成功插入
- [ ] 词汇状态按FSRS算法正确更新
- [ ] 用户偏好保持中性（difficulty_bias=0.0）
- [ ] 时间间隔符合INTERVALS映射
- [ ] 成功/失败计数器准确更新