import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase配置（使用环境变量）
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

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
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error);
      return null;
    }
    
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('User stats handler started');
  console.log('Supabase config:', {
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasAnonKey: !!supabaseAnonKey
  });
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    console.log('Starting user authentication');
    
    // 用户认证
    const user = await authenticateUser(req);
    if (!user) {
      console.log('User authentication failed');
      res.status(401).json(createAuthError('请先登录'));
      return;
    }
    
    console.log('User authenticated successfully:', user.id);
    
    // 先返回一个简单的响应来测试基本功能
    res.json({
      success: true,
      data: {
        totalQueries: 0,
        todayQueries: 0,
        remainingQueries: 100,
        maxDailyQueries: 100,
        lastQueryDate: null
      }
    });
    
  } catch (error: any) {
    console.error('User stats error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    const errorMessage = error.message || '获取用户统计信息失败';
    res.status(500).json({
      success: false,
      error: errorMessage,
      debug: {
        code: error.code,
        hint: error.hint
      }
    });
  }
}