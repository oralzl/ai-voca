# 复习系统数据库迁移

本目录包含复习系统的数据库迁移文件。

## 迁移文件说明

### 1. `create-review-system-tables.sql` 或 `create-review-system-tables-fixed.sql`
**主要迁移文件** - 创建复习系统的核心表结构

**注意**: 如果遇到 PostgreSQL 语法错误，请使用 `create-review-system-tables-fixed.sql` 文件

包含以下内容：
- 创建 `review_event_type` 枚举类型
- 创建 `user_word_state` 表（用户词汇状态）
- 创建 `review_events` 表（复习事件记录）
- 创建 `user_review_prefs` 表（用户复习偏好）
- 创建必要的索引和外键约束
- 启用行级安全 (RLS) 策略
- 创建辅助函数和触发器

### 2. `test-review-system-data.sql`
**测试数据文件** - 用于验证表结构是否正确工作

包含以下内容：
- 插入测试用户复习偏好
- 插入测试用户词汇状态
- 插入测试复习事件
- 验证查询语句
- 清理测试数据的选项

## 执行步骤

### 第一步：执行主要迁移
1. 登录 Supabase 控制台
2. 进入 SQL 编辑器
3. 复制 `create-review-system-tables-fixed.sql` 的内容（推荐使用修复版本）
4. 执行 SQL 脚本
5. 验证表创建成功

**如果遇到语法错误，请使用 `create-review-system-tables-fixed.sql` 文件**

### 第二步：验证表结构（可选）
1. 复制 `test-review-system-data.sql` 的内容
2. 执行测试数据插入
3. 查看验证查询结果
4. 确认所有功能正常

### 第三步：清理测试数据（可选）
如果执行了测试数据，可以在验证完成后清理：
```sql
-- 清理测试数据
DELETE FROM public.review_events WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');
DELETE FROM public.user_word_state WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');
DELETE FROM public.user_review_prefs WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');
```

## 表结构说明

### user_word_state 表
存储用户的词汇学习状态，基于 FSRS 算法：
- `familiarity`: 熟练度 (0-5)
- `next_due_at`: 下次复习时间
- `interval_days`: 复习间隔天数
- `ease_factor`: 难度因子
- `review_count`: 复习次数
- `lapse_count`: 遗忘次数

### review_events 表
记录所有复习事件：
- `delivery_id`: 复习会话ID
- `event_type`: 事件类型（词汇评分或句子难度）
- `word`: 词汇（词汇事件时必填）
- `sentence_text`: 句子文本（句子事件时必填）
- `rating`: 评分（1-5，对应 again/hard/good/easy/unknown）
- `meta`: 自评元数据（JSON格式）

### user_review_prefs 表
存储用户复习偏好设置：
- `level_cefr`: CEFR 水平 (A1-C2)
- `unknown_budget`: 新词预算 (0-4)
- `difficulty_bias`: 难度偏置 (-1.5 到 1.5)
- `preferred_style`: 偏好风格
- `allow_incidental_learning`: 是否允许顺带学习

## 辅助函数

### get_user_due_words()
获取用户待复习的词汇列表

### get_user_review_stats()
获取用户复习统计数据

## 注意事项

1. **安全性**: 所有表都启用了行级安全 (RLS)，用户只能访问自己的数据
2. **性能**: 创建了必要的索引优化查询性能
3. **数据完整性**: 使用外键约束确保数据一致性
4. **自动更新**: 设置了触发器自动更新时间戳
5. **新用户**: 新用户注册时会自动创建复习偏好记录

## 故障排除

### 常见问题

1. **PostgreSQL 语法错误**
   - 错误信息：`syntax error at or near "NOT"`
   - 解决方案：使用 `create-review-system-tables-fixed.sql` 文件
   - 原因：PostgreSQL 的 `CREATE TYPE` 不支持 `IF NOT EXISTS` 语法

2. **触发器已存在错误**
   - 这是正常的，迁移脚本会检查触发器是否存在
   - 可以忽略此错误

3. **权限错误**
   - 确保在 Supabase 控制台中执行
   - 确保有足够的权限

4. **外键约束错误**
   - 确保 `auth.users` 表存在
   - 确保用户ID格式正确

### 验证检查

执行迁移后，可以运行以下查询验证：

```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_word_state', 'review_events', 'user_review_prefs');

-- 检查索引是否存在
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('user_word_state', 'review_events', 'user_review_prefs');

-- 检查函数是否存在
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_due_words', 'get_user_review_stats');
```

## 后续步骤

迁移完成后，可以继续执行：
1. 任务 1.2：实现核心类型定义
2. 任务 1.3：设置基础项目结构
3. 任务 2.1：实现 FSRS 调度算法 