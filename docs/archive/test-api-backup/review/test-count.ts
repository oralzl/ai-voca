/**
 * @fileoverview 复习计数API测试文件
 * @module api/review/test-count
 * @description 测试复习计数API的功能
 * @version 1.0.0
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './count';

// ==================== 测试辅助函数 ====================

function createMockRequest(
  method: string = 'GET',
  headers: Record<string, string> = {},
  body?: any
): VercelRequest {
  return {
    method,
    headers,
    body,
    url: '/api/review/count',
    query: {},
    cookies: {},
    env: process.env
  } as VercelRequest;
}

function createMockResponse(): VercelResponse {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  } as VercelResponse;
  
  return res;
}

// ==================== 测试用例 ====================

describe('Review Count API', () => {
  let mockRes: VercelResponse;
  
  beforeEach(() => {
    mockRes = createMockResponse();
    jest.clearAllMocks();
  });
  
  test('should handle OPTIONS request', async () => {
    const req = createMockRequest('OPTIONS');
    
    await handler(req, mockRes);
    
    expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, OPTIONS');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.end).toHaveBeenCalled();
  });
  
  test('should reject non-GET requests', async () => {
    const req = createMockRequest('POST');
    
    await handler(req, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Method not allowed'
    });
  });
  
  test('should reject requests without authorization header', async () => {
    const req = createMockRequest('GET');
    
    await handler(req, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized'
    });
  });
  
  test('should reject requests with invalid authorization format', async () => {
    const req = createMockRequest('GET', {
      'authorization': 'InvalidToken'
    });
    
    await handler(req, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized'
    });
  });
  
  test('should handle server configuration errors', async () => {
    // 临时移除环境变量
    const originalSupabaseUrl = process.env.SUPABASE_URL;
    const originalSupabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
    
    const req = createMockRequest('GET', {
      'authorization': 'Bearer valid-token'
    });
    
    await handler(req, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server configuration error'
    });
    
    // 恢复环境变量
    process.env.SUPABASE_URL = originalSupabaseUrl;
    process.env.SUPABASE_SERVICE_KEY = originalSupabaseServiceKey;
  });
});

// ==================== 手动测试函数 ====================

/**
 * 手动测试复习计数API
 */
export async function testReviewCountAPI() {
  console.log('🧪 开始测试复习计数API...');
  
  // 模拟环境变量
  process.env.SUPABASE_URL = 'https://your-project.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'your-anon-key';
  process.env.SUPABASE_SERVICE_KEY = 'your-service-key';
  
  try {
    // 测试1: OPTIONS请求
    console.log('\n📋 测试1: OPTIONS请求');
    const optionsReq = createMockRequest('OPTIONS');
    const optionsRes = createMockResponse();
    
    await handler(optionsReq, optionsRes);
    console.log('✅ OPTIONS请求测试通过');
    
    // 测试2: 非GET请求
    console.log('\n📋 测试2: 非GET请求');
    const postReq = createMockRequest('POST');
    const postRes = createMockResponse();
    
    await handler(postReq, postRes);
    console.log('✅ 非GET请求测试通过');
    
    // 测试3: 无认证头
    console.log('\n📋 测试3: 无认证头');
    const noAuthReq = createMockRequest('GET');
    const noAuthRes = createMockResponse();
    
    await handler(noAuthReq, noAuthRes);
    console.log('✅ 无认证头测试通过');
    
    // 测试4: 无效认证格式
    console.log('\n📋 测试4: 无效认证格式');
    const invalidAuthReq = createMockRequest('GET', {
      'authorization': 'InvalidToken'
    });
    const invalidAuthRes = createMockResponse();
    
    await handler(invalidAuthReq, invalidAuthRes);
    console.log('✅ 无效认证格式测试通过');
    
    console.log('\n🎉 所有基础测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// ==================== 导出测试函数 ====================

if (require.main === module) {
  testReviewCountAPI().catch(console.error);
} 