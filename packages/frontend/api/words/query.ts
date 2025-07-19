import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser, createAuthError } from '../../lib/api/auth';
import { checkQueryLimits, incrementQueryCount, saveQueryRecord } from '../../lib/api/queryLimits';
import { 
  isValidWord,
  type WordQueryRequest,
  type WordQueryResponse 
} from '@ai-voca/shared';

// 直接在这里实现AI查询逻辑
async function queryWord(request: WordQueryRequest): Promise<WordQueryResponse> {
  try {
    // 暂时硬编码API配置
    const apiKey = process.env.AIHUBMIX_API_KEY || 'sk-qMWbiOmv6BhwydD4858197B955D94d189e451aC4C5Ac26E1';
    const apiUrl = process.env.AIHUBMIX_API_URL || 'https://aihubmix.com/v1';
    const model = process.env.AIHUBMIX_MODEL || 'gemini-2.5-flash-lite-preview-06-17';
    
    if (!apiKey) {
      throw new Error('AIHUBMIX_API_KEY environment variable is not set');
    }
    
    console.log('Query Word API Config:', { 
      hasKey: !!apiKey, 
      keyPrefix: apiKey.substring(0, 10) + '...',
      apiUrl,
      model 
    });

    const formattedWord = request.word.trim().toLowerCase();
    const timestamp = Date.now();
    
    // 构建AI提示词
    const prompt = `请详细分析英文单词 "${formattedWord}"，并严格按照以下XML格式返回：

<word>
  <text>lemma后的单词</text>
  <lemmatization_explanation>对词形还原结果的简要说明（如有）</lemmatization_explanation>
  <pronunciation>音标（如果适用）</pronunciation>
  <part_of_speech>词性（兼容多词性）</part_of_speech>
  <definition>中文释义</definition>
  <simple_explanation>用常见单词平白地介绍这个单词的英文注释</simple_explanation>
  <examples>
    <example>
      <sentence>英文例句</sentence>
      <translation>中文翻译</translation>
    </example>
  </examples>
  <synonyms>
    <synonym>同义词1</synonym>
  </synonyms>
  <antonyms>
    <antonym>反义词1</antonym>
  </antonyms>
  <etymology>用中文介绍词源信息</etymology>
  <memory_tips>用中文介绍记忆技巧</memory_tips>
</word>

要求：
1. 严格按照XML格式返回，不要添加其他文本
2. 如果有多个词性，请在part_of_speech和definition中体现
3. 如果单词需要词形还原，请在text字段提供还原后的形式，并在lemmatization_explanation中说明
4. 提供至少2个例句
5. 提供相关的同义词和反义词
6. 记忆技巧要实用且生动`;

    // 调用AI API
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const rawAiResponse = data.choices[0].message.content;
    
    // 在响应前插入查询参数
    const enrichedResponse = `<input>
  <word>${formattedWord}</word>
  <includeExample>${request.includeExample !== false}</includeExample>
  <timestamp>${timestamp}</timestamp>
</input>

${rawAiResponse}`;

    return {
      success: true,
      data: null, // 前端会解析rawResponse
      rawResponse: enrichedResponse,
      timestamp,
      queryCount: 1
    };
  } catch (error: any) {
    console.error('Word query error:', error);
    const errorMessage = error.message || '查询失败，请稍后重试';
    return {
      success: false,
      error: errorMessage,
      timestamp: Date.now()
    };
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Word query handler started', { method: req.method, headers: req.headers });
  
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
    res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      timestamp: Date.now()
    });
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
    const result = await queryWord(queryRequest);
    
    // 如果查询成功，增加计数并保存记录
    if (result.success) {
      await Promise.all([
        incrementQueryCount(user.id),
        saveQueryRecord(user.id, queryRequest.word, queryRequest, result.data)
      ]);
    }
    
    res.json(result);
    
  } catch (error: any) {
    console.error('Word query handler error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // 确保返回正确的错误格式
    const errorMessage = error.message || '服务器内部错误';
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: Date.now()
    } as WordQueryResponse);
  }
}