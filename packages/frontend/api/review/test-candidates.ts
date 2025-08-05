/**
 * @fileoverview 候选词API测试文件
 * @description 用于测试候选词获取API的基本功能
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import candidatesHandler from './candidates';

// 模拟请求和响应对象
function createMockRequest(method: string, headers: Record<string, string> = {}): VercelRequest {
  return {
    method,
    headers,
    query: {},
    body: {},
    url: '/api/review/candidates'
  } as VercelRequest;
}

function createMockResponse(): VercelResponse {
  const res = {
    status: (code: number) => res,
    json: (data: any) => res,
    setHeader: (name: string, value: string) => res,
    end: () => res
  } as VercelResponse;
  
  return res;
}

// 测试函数
export async function testCandidatesAPI() {
  console.log('Testing candidates API...');
  
  // 测试1: 无认证请求
  const req1 = createMockRequest('GET');
  const res1 = createMockResponse();
  
  await candidatesHandler(req1, res1);
  
  // 测试2: 无效方法
  const req2 = createMockRequest('POST');
  const res2 = createMockResponse();
  
  await candidatesHandler(req2, res2);
  
  console.log('Candidates API tests completed');
}

// 如果直接运行此文件
if (require.main === module) {
  testCandidatesAPI().catch(console.error);
} 