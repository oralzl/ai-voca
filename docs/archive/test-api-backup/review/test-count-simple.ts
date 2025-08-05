/**
 * @fileoverview 复习计数API简单测试脚本
 * @module api/review/test-count-simple
 * @description 简单的API测试脚本
 */

import fetch from 'node-fetch';

async function testReviewCountAPI() {
  console.log('🧪 开始测试复习计数API...');
  
  const baseUrl = 'http://localhost:3001';
  const endpoint = '/api/review/count';
  
  try {
    // 测试1: 无认证头的请求
    console.log('\n📋 测试1: 无认证头的请求');
    const response1 = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('状态码:', response1.status);
    const data1 = await response1.json();
    console.log('响应:', JSON.stringify(data1, null, 2));
    
    // 测试2: OPTIONS请求
    console.log('\n📋 测试2: OPTIONS请求');
    const response2 = await fetch(`${baseUrl}${endpoint}`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('状态码:', response2.status);
    console.log('CORS头:', response2.headers.get('Access-Control-Allow-Origin'));
    
    // 测试3: 无效认证格式
    console.log('\n📋 测试3: 无效认证格式');
    const response3 = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'InvalidToken'
      }
    });
    
    console.log('状态码:', response3.status);
    const data3 = await response3.json();
    console.log('响应:', JSON.stringify(data3, null, 2));
    
    // 测试4: 有效认证格式（但token无效）
    console.log('\n📋 测试4: 有效认证格式（但token无效）');
    const response4 = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    console.log('状态码:', response4.status);
    const data4 = await response4.json();
    console.log('响应:', JSON.stringify(data4, null, 2));
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testReviewCountAPI().catch(console.error); 