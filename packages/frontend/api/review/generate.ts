/**
 * @fileoverview 句子生成API无服务器函数
 * @module api/review/generate
 * @description 处理句子生成请求，调用LLM生成包含目标词汇的自然句子
 * @version 1.0.0
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { 
  GenerateRequest, 
  GenerateResponse, 
  GenerateItemsOutput,
  GeneratedItem,
  UserPrefs 
} from '@ai-voca/shared';

// ==================== 类型定义 ====================

interface AuthUser {
  id: string;
  email: string;
  user_metadata: any;
}

// ==================== 认证函数 ====================

async function authenticateUser(req: VercelRequest): Promise<AuthUser | null> {
  try {
    console.log('Review generate authentication started', {
      hasAuthHeader: !!req.headers.authorization,
      timestamp: new Date().toISOString()
    });
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth header missing or invalid format');
      return null;
    }
    
    const token = authHeader.substring(7);
    const supabaseUrl = process.env.SUPABASE_URL;
    const rawAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseAnonKey = rawAnonKey ? rawAnonKey.replace(/\s/g, '').trim() : rawAnonKey;
    
    console.log('Auth environment check', {
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      anonKeyLength: supabaseAnonKey?.length || 0
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase URL or anon key for authentication');
      return null;
    }
    
    // 使用Auth API直接验证token
    console.log('Making auth request to Supabase', {
      url: `${supabaseUrl}/auth/v1/user`,
      hasToken: !!token
    });
    
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Auth response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      console.error('Auth verification failed:', response.status, response.statusText);
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

function createAuthError(message: string = 'Unauthorized'): GenerateResponse {
  return {
    success: false,
    error: message
  };
}

// ==================== LLM配置 ====================

interface LLMConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  maxRetries: number;
  timeout: number;
}

function getLLMConfig(): LLMConfig {
  const apiUrl = process.env.AIHUBMIX_API_URL || process.env.AIHUB_API_URL || 'https://aihubmix.com/v1';
  const apiKey = process.env.AIHUBMIX_API_KEY || process.env.AIHUB_API_KEY || '';
  const model = process.env.AIHUBMIX_MODEL || process.env.AIHUB_MODEL || 'gemini-2.5-flash-lite-preview-06-17';
  
  if (!apiKey) {
    throw new Error('AIHUB_API_KEY or AIHUBMIX_API_KEY environment variable is required');
  }
  
  return {
    apiUrl,
    apiKey,
    model,
    maxRetries: 3,
    timeout: 30000,
  };
}

// ==================== LLM调用函数 ====================

interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

async function callLLM(request: LLMRequest, config: LLMConfig): Promise<LLMResponse> {
  const { prompt, maxTokens = 1000, temperature = 0.7 } = request;
  
  try {
    const apiEndpoint = config.apiUrl.includes('aihubmix.com') 
      ? `${config.apiUrl}/chat/completions`
      : `${config.apiUrl}/v1/chat/completions`;
    
    console.log('Calling LLM API:', {
      endpoint: apiEndpoint,
      model: config.model,
      promptLength: prompt.length
    });
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false,
      }),
      signal: AbortSignal.timeout(config.timeout),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`LLM API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('LLM response missing content');
    }
    
    return {
      text: content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
      } : undefined,
    };
  } catch (error) {
    console.error('LLM call failed:', error);
    throw error;
  }
}

// ==================== 提示词构建 ====================

function buildPrompt(targets: string[], profile: UserPrefs, constraints: any): string {
  const targetsJson = JSON.stringify(targets);
  const profileJson = JSON.stringify(profile);
  const constraintsJson = JSON.stringify(constraints);
  
  return `# SYSTEM
You are an English sentence generator for vocabulary review. 
You must produce natural, contextually-rich English text that includes ALL target words in a single coherent narrative.
You must control difficulty by CEFR level and create engaging, story-like content that connects the target words meaningfully.
Return STRICT JSON ONLY that matches the provided schema. DO NOT include any extra commentary.

# DEVELOPER
Goals:
- Create a single, cohesive narrative that naturally incorporates ALL target words within meaningful context.
- Target sentence length: 25-35 tokens for 3-5 words, 35-50 tokens for 6-8 words to ensure adequate context and engagement.
- Build logical connections between target words to create memorable learning experiences.
- Overall difficulty ~= ${profile.level_cefr} (consider ${profile.difficulty_bias} as a soft signal).
- Allow incidental learning ONLY if ${profile.allow_incidental} is true, with at most ${profile.unknown_budget} potentially-new terms.
- Respect style: ${profile.style} - create engaging narratives with natural flow.
- Avoid sensitive topics: politics, explicit sexual content, hate, self-harm, illegal acts, personal data.

Narrative Structure Guidelines:
- Begin with an engaging scenario that provides context
- Weave target words into a logical sequence of events or descriptions
- Use connecting phrases and transitional elements for smooth flow
- End with a satisfying conclusion or observation
- Ensure each target word serves a meaningful purpose in the narrative

Definitions:
- "Potentially-new terms" = words that are likely above ${profile.level_cefr}. You will self-estimate them and list them in new_terms[] with a brief gloss.
- Token boundaries: split on whitespace and punctuation. Use simple, human-intuitive tokenization.
- For each target occurrence, return its token span [begin, end] (inclusive indices) in the final \`text\`. If uncertain, keep begin=end at the main head token.

Output Contract:
- Return JSON with:
  {
    "items": [
      {
        "sid": "string",
        "text": "string",
        "targets": [{"word":"string","begin":number,"end":number}, ...],
        "self_eval": {
          "predicted_cefr": "A1|A2|B1|B2|C1|C2",
          "estimated_new_terms_count": number,
          "new_terms": [{"surface":"string","cefr":"A1|A2|B1|B2|C1|C2","gloss":"short plain-English meaning"}],
          "reason": "short justification"
        }
      }
    ]
  }

Hard Requirements:
- Include ALL targets: ${targetsJson} in a SINGLE coherent narrative.
- Create meaningful connections between target words - they should relate to each other within the story context.
- Achieve target length of 25-50 tokens depending on word count (25-35 for 3-5 words, 35-50 for 6-8 words).
- Ensure natural, flowing narrative that feels complete and satisfying to read.
- Use varied sentence structures and descriptive elements appropriate for ${profile.level_cefr}.

Quality Guidelines:
- Avoid simple lists or disconnected statements
- Create scenarios that help users remember word relationships
- Use descriptive language and sensory details when appropriate
- Ensure grammatical complexity matches the target CEFR level
- Make the narrative engaging enough to encourage re-reading

Examples for style (not to copy verbatim):
- neutral: everyday situations with relatable scenarios and natural dialogue
- news: informative articles with clear context and relevant examples
- dialog: character interactions that showcase word usage in realistic conversations
- academic: explanatory texts with clear examples and logical progression

# USER
Target Words: ${targetsJson}

Profile:
${profileJson}

Constraints:
${constraintsJson}

Create ONE engaging narrative that naturally incorporates all target words in meaningful context. Focus on creating memorable connections between the words.

Return STRICT JSON ONLY.`;
}

// ==================== 响应解析和验证 ====================

function parseLLMResponse(response: string): GenerateItemsOutput {
  try {
    // 尝试提取JSON内容
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // 验证基本结构
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('Response missing items array');
    }
    
    // 验证每个item的结构
    const validatedItems: GeneratedItem[] = parsed.items.map((item: any, index: number) => {
      if (!item.sid || !item.text || !item.targets || !item.self_eval) {
        throw new Error(`Item ${index} missing required fields`);
      }
      
      // 验证targets
      if (!Array.isArray(item.targets)) {
        throw new Error(`Item ${index} targets must be an array`);
      }
      
      for (const target of item.targets) {
        if (!target.word || typeof target.begin !== 'number' || typeof target.end !== 'number') {
          throw new Error(`Item ${index} target missing required fields`);
        }
      }
      
      // 验证self_eval
      if (!item.self_eval.predicted_cefr || typeof item.self_eval.estimated_new_terms_count !== 'number') {
        throw new Error(`Item ${index} self_eval missing required fields`);
      }
      
      return item as GeneratedItem;
    });
    
    return {
      items: validatedItems
    };
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ==================== 兜底机制 ====================

function createFallbackResponse(targets: string[]): GenerateItemsOutput {
  console.log('Using fallback response for targets:', targets);
  
  // 创建简单的兜底句子
  const fallbackItems: GeneratedItem[] = targets.map((target, index) => {
    const sentence = `I learned the word "${target}" today.`;
    const tokens = sentence.split(' ');
    const targetIndex = tokens.findIndex(token => 
      token.toLowerCase().includes(target.toLowerCase())
    );
    
    return {
      sid: `fallback_${index + 1}`,
      text: sentence,
      targets: [{
        word: target,
        begin: targetIndex >= 0 ? targetIndex : 4,
        end: targetIndex >= 0 ? targetIndex : 4,
      }],
      self_eval: {
        predicted_cefr: 'B1',
        estimated_new_terms_count: 0,
        new_terms: [],
        reason: 'Fallback response due to generation failure',
      },
    };
  });
  
  return {
    items: fallbackItems
  };
}

// ==================== 主处理函数 ====================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  try {
    console.log('Review generate API called', {
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // 1. 用户认证
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json(createAuthError());
    }
    
    console.log('User authenticated:', { userId: user.id });
    
    // 2. 验证请求体
    const requestBody = req.body as GenerateRequest;
    
    if (!requestBody.targets || !Array.isArray(requestBody.targets) || requestBody.targets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Targets array is required and must not be empty'
      });
    }
    
    if (requestBody.targets.length > 8) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 8 targets allowed'
      });
    }
    
    // 根据目标词数量动态调整长度约束
    const targetCount = requestBody.targets.length;
    if (targetCount <= 3) {
      requestBody.constraints.sentence_length_range = [20, 30];
    } else if (targetCount <= 5) {
      requestBody.constraints.sentence_length_range = [25, 40];
    } else {
      requestBody.constraints.sentence_length_range = [35, 55];
    }
    
    // 3. 获取LLM配置
    const llmConfig = getLLMConfig();
    
    console.log('LLM Config loaded:', {
      apiUrl: llmConfig.apiUrl,
      model: llmConfig.model,
      hasApiKey: !!llmConfig.apiKey,
      apiKeyPrefix: llmConfig.apiKey ? llmConfig.apiKey.substring(0, 10) + '...' : 'none'
    });
    
    // 4. 构建提示词
    const prompt = buildPrompt(
      requestBody.targets,
      requestBody.profile,
      requestBody.constraints
    );
    
    console.log('Generated prompt for targets:', requestBody.targets);
    console.log('Prompt length:', prompt.length);
    
    // 5. 调用LLM（带重试机制）
    let llmResponse: LLMResponse;
    let retryCount = 0;
    const maxRetries = llmConfig.maxRetries;
    
    while (retryCount <= maxRetries) {
      try {
        llmResponse = await callLLM({
          prompt,
          maxTokens: 1000,
          temperature: 0.7,
        }, llmConfig);
        break; // 成功则跳出循环
      } catch (error) {
        retryCount++;
        console.error(`LLM call attempt ${retryCount} failed:`, error);
        
        if (retryCount > maxRetries) {
          console.log('All LLM attempts failed, using fallback');
          const fallbackResult = createFallbackResponse(requestBody.targets);
          return res.status(200).json({
            success: true,
            data: fallbackResult,
            error: 'Used fallback response due to LLM generation failure'
          });
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    // 6. 解析和验证响应
    let generatedResult: GenerateItemsOutput;
    try {
      generatedResult = parseLLMResponse(llmResponse!.text);
    } catch (parseError) {
      console.error('Failed to parse LLM response, using fallback:', parseError);
      const fallbackResult = createFallbackResponse(requestBody.targets);
      return res.status(200).json({
        success: true,
        data: fallbackResult,
        error: 'Used fallback response due to parsing failure'
      });
    }
    
    // 7. 验证生成结果
    if (!generatedResult.items || generatedResult.items.length === 0) {
      console.log('No items generated, using fallback');
      const fallbackResult = createFallbackResponse(requestBody.targets);
      return res.status(200).json({
        success: true,
        data: fallbackResult,
        error: 'Used fallback response due to empty generation result'
      });
    }
    
    // 8. 验证所有目标词都被包含
    const generatedTargets = new Set<string>();
    generatedResult.items.forEach(item => {
      item.targets.forEach(target => {
        generatedTargets.add(target.word.toLowerCase());
      });
    });
    
    const missingTargets = requestBody.targets.filter(target => 
      !generatedTargets.has(target.toLowerCase())
    );
    
    if (missingTargets.length > 0) {
      console.log('Missing targets in generation, using fallback:', missingTargets);
      const fallbackResult = createFallbackResponse(requestBody.targets);
      return res.status(200).json({
        success: true,
        data: fallbackResult,
        error: `Used fallback response due to missing targets: ${missingTargets.join(', ')}`
      });
    }
    
    // 9. 返回成功响应
    console.log('Successfully generated sentences for targets:', requestBody.targets);
    
    return res.status(200).json({
      success: true,
      data: generatedResult
    });
    
  } catch (error) {
    console.error('Review generate API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
} 