/**
 * @fileoverview 单词查询API无服务器函数
 * @module api/words/query
 * @description 处理单词查询请求，集成AI服务、用户认证、数据库记录和XML解析
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// 内联的类型定义（从 @ai-voca/shared 复制）
export interface WordQueryRequest {
  word: string;
  includeExample?: boolean;
}

export interface WordExample {
  sentence: string;
  translation?: string;
}

export interface WordExplanation {
  word: string;
  text?: string;
  lemmatizationExplanation?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definition: string;
  simpleExplanation?: string;
  examples?: WordExample[];
  synonyms?: string[];
  antonyms?: string[];
  etymology?: string;
  memoryTips?: string;
}

export interface WordQueryResponse {
  success: boolean;
  data?: WordExplanation | null;
  error?: string;
  rawResponse?: string;
  timestamp: number;
  queryCount?: number;
  inputParams?: {
    word: string;
    timestamp: number;
  };
}

// 内联的工具函数（从 @ai-voca/shared 复制）
function isValidWord(word: string): boolean {
  if (!word || typeof word !== 'string') {
    return false;
  }
  
  const trimmed = word.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return false;
  }
  
  // 只允许字母、数字、连字符、撇号和空格
  const validPattern = /^[a-zA-Z0-9\s\-']+$/;
  return validPattern.test(trimmed);
}

// Supabase配置（使用环境变量）
const supabaseUrl = process.env.SUPABASE_URL;
// 清理JWT token中的无效字符（换行符、空格等）
const rawServiceKey = process.env.SUPABASE_SERVICE_KEY;
const rawAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = rawServiceKey ? rawServiceKey.replace(/\s/g, '').trim() : rawServiceKey;
const supabaseAnonKey = rawAnonKey ? rawAnonKey.replace(/\s/g, '').trim() : rawAnonKey;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 内联的认证函数
interface AuthUser {
  id: string;
  email: string;
  user_metadata: any;
}

async function authenticateUser(req: VercelRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    
    // 使用Auth API直接验证token
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('Auth verification failed:', response.status);
      return null;
    }
    
    const user = await response.json();
    
    return {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata || {}
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    return null;
  }
}

function createAuthError(message: string = 'Unauthorized') {
  return {
    success: false,
    error: message,
    timestamp: Date.now()
  };
}

// 移除了查询限制相关函数 - 现在允许无限查询

async function saveQueryRecord(
  userId: string,
  word: string,
  queryParams: any,
  responseData: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('word_queries')
      .insert({
        user_id: userId,
        word,
        query_params: queryParams,
        response_data: responseData
      });
      
    if (error) throw error;
  } catch (error) {
    console.error('Error saving query record:', error);
  }
}

// 内联的XML解析函数
function extractTagContent(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 's');
  const match = xml.match(regex);
  return match ? match[1].trim() : undefined;
}

function extractMultipleTagContents(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'gs');
  const matches = [];
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1].trim());
  }
  
  return matches;
}

function sanitizeHtml(html: string): string {
  const sanitized = html.replace(/<(?!\/?(?:ul|li|br|strong|em|b|i)\b)[^>]*>/gi, '');
  return sanitized;
}

function formatItemsList(items: string[]): string {
  if (items.length > 1) {
    const listHtml = '<ul>' + items.map(item => `<li>${item.trim()}</li>`).join('') + '</ul>';
    return sanitizeHtml(listHtml);
  } else {
    return sanitizeHtml(items[0].trim());
  }
}

function processItemTags(content: string): string {
  if (!content) return content;
  
  const hasItems = content.includes('<item>') && content.includes('</item>');
  const hasTips = content.includes('<tip>') && content.includes('</tip>');
  const hasEntries = content.includes('<entry>') && content.includes('</entry>');
  
  if (hasItems) {
    const items = extractMultipleTagContents(content, 'item');
    if (items.length > 0) {
      return formatItemsList(items);
    }
  }
  
  if (hasTips) {
    const tips = extractMultipleTagContents(content, 'tip');
    if (tips.length > 0) {
      return formatItemsList(tips);
    }
  }
  
  if (hasEntries) {
    const entries = extractMultipleTagContents(content, 'entry');
    if (entries.length > 0) {
      const formattedEntries = entries.map(entry => {
        const partOfSpeech = extractTagContent(entry, 'part_of_speech');
        const definitionText = extractTagContent(entry, 'definition_text');
        
        if (partOfSpeech && definitionText) {
          return `${partOfSpeech}：${definitionText}`;
        } else if (definitionText) {
          return definitionText;
        } else {
          return entry.trim();
        }
      });
      return formatItemsList(formattedEntries);
    }
  }
  
  const hasHtmlTags = /<[^>]+>/.test(content);
  if (hasHtmlTags) {
    return sanitizeHtml(content);
  }
  
  return content;
}

function extractAndProcessTagContent(xml: string, tagName: string): string | undefined {
  const content = extractTagContent(xml, tagName);
  if (!content) return undefined;
  
  return processItemTags(content);
}

function parseExamples(examplesXml: string): WordExample[] {
  const examples: WordExample[] = [];
  const exampleBlocks = extractMultipleTagContents(examplesXml, 'example');
  
  for (const block of exampleBlocks) {
    const sentence = extractTagContent(block, 'sentence');
    const translation = extractTagContent(block, 'translation');
    
    if (sentence) {
      examples.push({
        sentence,
        translation
      });
    }
  }
  
  return examples;
}

function parseWordExplanationXml(xmlContent: string): WordExplanation | null {
  try {
    const regex = /<word>(.*?)<\/word>/gs;
    const match = regex.exec(xmlContent);
    if (!match) {
      throw new Error('未找到word标签');
    }
    
    const mainContent = match[1].trim();
    const result: WordExplanation = {
      word: '',
      definition: ''
    };
    
    // 提取基本信息
    result.text = extractTagContent(mainContent, 'text');
    result.word = result.text || '';
    result.lemmatizationExplanation = extractTagContent(mainContent, 'lemmatization_explanation');
    result.pronunciation = extractTagContent(mainContent, 'pronunciation');
    result.partOfSpeech = extractTagContent(mainContent, 'part_of_speech');
    result.etymology = extractTagContent(mainContent, 'etymology');
    
    // 处理定义、解释和记忆技巧
    result.definition = extractAndProcessTagContent(mainContent, 'definition') || '';
    result.simpleExplanation = extractAndProcessTagContent(mainContent, 'simple_explanation');
    result.memoryTips = extractAndProcessTagContent(mainContent, 'memory_tips');
    
    // 提取例句
    const examplesContent = extractTagContent(mainContent, 'examples');
    if (examplesContent) {
      result.examples = parseExamples(examplesContent);
    }
    
    // 提取同义词
    const synonymsContent = extractTagContent(mainContent, 'synonyms');
    if (synonymsContent) {
      result.synonyms = extractMultipleTagContents(synonymsContent, 'synonym');
    }
    
    // 提取反义词
    const antonymsContent = extractTagContent(mainContent, 'antonyms');
    if (antonymsContent) {
      result.antonyms = extractMultipleTagContents(antonymsContent, 'antonym');
    }
    
    return result;
    
  } catch (error) {
    console.error('XML解析失败:', error);
    return null;
  }
}

// 直接在这里实现AI查询逻辑
async function queryWord(request: WordQueryRequest): Promise<WordQueryResponse> {
  try {
    // AiHubMix API配置（使用环境变量）
    const apiKey = process.env.AIHUBMIX_API_KEY;
    const apiUrl = process.env.AIHUBMIX_API_URL || 'https://aihubmix.com/v1';
    const model = process.env.AIHUBMIX_MODEL || 'gemini-2.5-flash-lite-preview-06-17';
    
    if (!apiKey) {
      throw new Error('AIHUBMIX_API_KEY environment variable is required');
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
  <includeExample>true</includeExample>
  <timestamp>${timestamp}</timestamp>
</input>

${rawAiResponse}`;

    // 解析XML响应
    const parsedData = parseWordExplanationXml(rawAiResponse);
    
    // 提取查询参数
    const inputParams = {
      word: formattedWord,
      timestamp
    };
    
    return {
      success: true,
      data: parsedData,
      rawResponse: enrichedResponse,
      timestamp,
      queryCount: 1,
      inputParams
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
    
    if (req.method === 'GET') {
      word = req.query.word as string;
    } else {
      word = req.body.word;
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
    
    // 移除查询限制 - 允许无限查询
    
    // 构建查询请求
    const queryRequest: WordQueryRequest = {
      word: word.trim()
    };
    
    // 调用服务获取单词解释
    const result = await queryWord(queryRequest);
    
    // 如果查询成功，保存查询记录（不限制次数）
    if (result.success) {
      await saveQueryRecord(user.id, queryRequest.word, queryRequest, result.data);
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