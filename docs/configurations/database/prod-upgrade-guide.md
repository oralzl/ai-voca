## 生产环境数据库升级指南（对齐测试环境）

本指南用于将 Production 项目（建议：`ai-voca-app`）的数据库结构、约束与数据规则对齐到测试环境（`ai-voca-test`）。

### 一、准备

- 登录 Supabase 控制台，切换到生产项目。
- 打开 SQL Editor，确认有足够权限执行 DDL 与触发器/函数变更。
- 建议先备份（通过 Supabase 提供的备份或导出工具）。

### 二、执行升级

1. 打开 `docs/configurations/database/prod-upgrade.sql` 内容，拷贝到 SQL Editor。
2. 直接执行整段脚本（脚本为幂等，可重复执行）。

脚本涵盖：
- review_event_type 枚举对齐（移除 `word_unknown`，并迁移历史数据）；
- 三张核心表存在性与字段对齐：`user_word_state`（含 `familiarity_progress`）、`review_events`（`delivery_id` 统一为 UUID NOT NULL）、`user_review_prefs`（新增自动选词/批次大小）；
- 历史数据兼容性修复（句子事件不写评分，字段互斥）；
- RLS 与策略补齐；
- 触发器函数与触发器（更新时间戳、新用户自动偏好）；
- 必要索引创建；
- 安全的列类型迁移与空值修复。

### 三、验证

在 SQL Editor 依次执行以下只读检查：

```sql
-- 枚举值
SELECT unnest(enum_range(NULL::public.review_event_type)) AS event_type;

-- 表存在性
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' AND table_name IN ('user_word_state','review_events','user_review_prefs');

-- delivery_id 列类型与空值
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_schema='public' AND table_name='review_events' AND column_name='delivery_id';

-- RLS 策略
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('user_word_state','review_events','user_review_prefs') ORDER BY tablename, policyname;

-- 索引
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('user_word_state','review_events','user_review_prefs') ORDER BY tablename, indexname;
```

如需抽样业务验证（可选）：

```sql
-- 事件统计（句子类不应有评分）
SELECT event_type, COUNT(*) c, COUNT(rating) with_rating 
FROM public.review_events GROUP BY event_type ORDER BY c DESC;

-- 某用户到期词汇（需要替换为实际用户ID）
SELECT * FROM public.get_user_due_words('<user_id>', 10);
```

### 四、回滚策略（如需）

- 本脚本对类型迁移（枚举与列类型）采用逐步替换方式；如需回滚，建议整体恢复备份。

### 五、常见问题

- 权限不足：请确保使用具备 `owner` 或等效权限的角色执行。
- 触发器已存在：脚本已做存在性判断，重复执行不报错。
- 列类型不匹配：脚本包含自动迁移逻辑，若自定义数据异常，请先排查异常行再执行。

### 六、变更说明

- 与测试环境保持一致：
  - review_event_type 移除 `word_unknown`；
  - `user_word_state.familiarity_progress` 字段；
  - `review_events.delivery_id` 统一为 `UUID NOT NULL`；
  - `user_review_prefs` 新增 `auto_select_mode`、`auto_batch_size`（含范围约束）。

执行完成后，建议进行一次端到端接口/前端验证，确保读写一致。


