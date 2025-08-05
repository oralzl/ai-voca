/**
 * @fileoverview 复习计数API简单测试脚本
 * @module api/review/test-count
 * @description 简单的API测试脚本
 */

import http from 'http';

async function testReviewCountAPI() {
  console.log('🧪 开始测试复习计数API...');
  
  const baseUrl = 'http://localhost:3001';
  const endpoint = '/api/review/count';
  
  // 测试1: 无认证头的请求
  console.log('\n📋 测试1: 无认证头的请求');
  await makeRequest(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // 测试2: OPTIONS请求
  console.log('\n📋 测试2: OPTIONS请求');
  await makeRequest(`${baseUrl}${endpoint}`, {
    method: 'OPTIONS',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // 测试3: 无效认证格式
  console.log('\n📋 测试3: 无效认证格式');
  await makeRequest(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'InvalidToken'
    }
  });
  
  // 测试4: 有效认证格式（但token无效）
  console.log('\n📋 测试4: 有效认证格式（但token无效）');
  await makeRequest(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token'
    }
  });
  
  console.log('\n🎉 所有测试完成！');
}

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method,
      headers: options.headers
    };
    
    const req = http.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('状态码:', res.statusCode);
        console.log('响应头:', res.headers);
        
        try {
          const jsonData = JSON.parse(data);
          console.log('响应:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log('响应:', data);
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('请求错误:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

// 运行测试
testReviewCountAPI().catch(console.error); 