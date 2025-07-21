# User API - 用户功能服务

用户相关的API端点，提供用户统计和管理功能。

## 📋 API端点

### GET `/api/user/stats`
获取当前用户的使用统计信息（需要登录）

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalQueries": 156,
    "successfulQueries": 152,
    "failedQueries": 4,
    "successRate": 97.4,
    "lastQueryDate": "2024-07-19T10:30:00.000Z",
    "joinDate": "2024-07-15T08:20:00.000Z",
    "favoriteWords": ["hello", "world", "programming"],
    "queryHistory": [
      {
        "word": "hello",
        "created_at": "2024-07-19T10:30:00.000Z",
        "success": true
      }
    ]
  },
  "timestamp": 1704099600000
}
```

## 🔧 功能特性

### 统计信息
- **查询总数**: 用户历史查询的总次数
- **成功率**: 查询成功与失败的比例
- **最近活动**: 最后一次查询的时间
- **注册时间**: 用户账号创建时间

### 查询历史
- **历史记录**: 显示用户最近的查询记录
- **成功状态**: 标识每次查询的成功失败状态
- **时间排序**: 按时间倒序显示记录

### 个性化数据
- **常用单词**: 基于查询频率的常用单词统计
- **学习进度**: 累计学习的单词数量
- **使用习惯**: 分析用户的查询模式

## 🔐 认证与权限

### JWT验证
```typescript
// 验证用户身份
const token = req.headers.authorization?.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return res.status(401).json({ error: '请先登录' });
}
```

### 数据隔离
- **行级安全**: 每个用户只能访问自己的数据
- **权限控制**: 基于用户ID进行数据过滤
- **隐私保护**: 不暴露其他用户的信息

## 📊 数据查询

### 统计计算
```sql
-- 查询用户总数
SELECT COUNT(*) as total_queries 
FROM word_queries 
WHERE user_id = $1;

-- 成功率计算
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN success = true THEN 1 END) as successful,
  (COUNT(CASE WHEN success = true THEN 1 END)::float / COUNT(*) * 100) as success_rate
FROM word_queries 
WHERE user_id = $1;
```

### 历史记录
```sql
-- 最近查询记录
SELECT word, created_at, success 
FROM word_queries 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🛡️ 安全措施

### 数据验证
- **用户ID验证**: 确保查询的是当前登录用户的数据
- **参数检查**: 验证请求参数的合法性
- **SQL注入防护**: 使用参数化查询

### 错误处理
```typescript
try {
  // 查询用户统计
  const stats = await getUserStats(user.id);
  return res.json({ success: true, data: stats });
  
} catch (error) {
  console.error('User stats error:', error);
  return res.status(500).json({
    success: false,
    error: '获取统计信息失败',
    timestamp: Date.now()
  });
}
```

### 性能优化
- **索引优化**: 用户ID和时间字段建立索引
- **查询缓存**: 对频繁查询的统计数据进行缓存
- **分页处理**: 大量历史记录的分页显示

## 📈 扩展功能

### 学习分析
- **学习曲线**: 用户查询频率的时间分布
- **难度分析**: 查询单词的难度统计
- **进步跟踪**: 学习效果的量化指标

### 个性化推荐
- **相似单词**: 基于查询历史推荐相关单词
- **复习提醒**: 智能复习计划和提醒
- **学习目标**: 个性化的学习目标设定

## 🔄 未来功能

### 社交功能
- **学习排行**: 用户学习成就排行榜
- **分享功能**: 分享学习成果和有趣单词
- **学习小组**: 创建或加入学习小组

### 高级统计
- **词汇量评估**: 基于查询记录评估词汇水平
- **学习报告**: 生成详细的学习分析报告
- **趋势分析**: 学习习惯和进步趋势分析

---

**📦 API状态**: ✅ 基础功能已实现  
**🔐 安全级别**: 用户级权限控制  
**📊 数据存储**: Supabase PostgreSQL