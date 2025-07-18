import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser, createAuthError } from '../_lib/auth';
import { checkQueryLimits, incrementQueryCount, saveQueryRecord } from '../_lib/queryLimits';
import { 
  WordService,
  isValidWord,
  type WordQueryRequest,
  type WordQueryResponse 
} from '@ai-voca/shared';

// 创建 WordService 实例
const wordService = new WordService();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只允许 GET 和 POST 请求
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // 用户认证
    const user = await authenticateUser(req);
    if (!user) {
      res.status(401).json(createAuthError('请先登录'));
      return;
    }
    
    // 解析请求参数
    let word: string;
    let includeExample: boolean;
    
    if (req.method === 'GET') {
      word = req.query.word as string;
      includeExample = req.query.includeExample === 'true';
    } else {
      word = req.body.word;
      includeExample = req.body.includeExample !== false;
    }
    
    // 验证参数
    if (!word || typeof word !== 'string') {
      res.status(400).json({
        success: false,
        error: '单词参数是必需的',
        timestamp: Date.now()
      } as WordQueryResponse);
      return;
    }
    
    if (!isValidWord(word)) {
      res.status(400).json({
        success: false,
        error: '无效的单词格式',
        timestamp: Date.now()
      } as WordQueryResponse);
      return;
    }
    
    // 检查查询限制
    const limits = await checkQueryLimits(user.id);
    if (!limits.canQuery) {
      res.status(429).json({
        success: false,
        error: `今日查询次数已达上限 (${limits.maxDailyQueries}次)，请明天再试`,
        timestamp: Date.now()
      } as WordQueryResponse);
      return;
    }
    
    // 构建查询请求
    const queryRequest: WordQueryRequest = {
      word: word.trim(),
      includeExample
    };
    
    // 调用服务获取单词解释
    const result = await wordService.queryWord(queryRequest);
    
    // 如果查询成功，增加计数并保存记录
    if (result.success) {
      await Promise.all([
        incrementQueryCount(user.id),
        saveQueryRecord(user.id, queryRequest.word, queryRequest, result.data)
      ]);
    }
    
    res.json(result);
    
  } catch (error: any) {
    console.error('Word query error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      timestamp: Date.now()
    } as WordQueryResponse);
  }
}