/**
 * @fileoverview 句子生成API简单测试脚本
 * @module api/review/test-generate-simple
 * @description 用于快速测试句子生成API的功能
 * @version 1.0.0
 */

import type { GenerateRequest } from '@ai-voca/shared';

// ==================== 测试配置 ====================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-token';

// ==================== 测试数据 ====================

const testRequests: GenerateRequest[] = [
  {
    targets: ['happy', 'success'],
    profile: {
      level_cefr: 'B1',
      allow_incidental: true,
      unknown_budget: 2,
      style: 'neutral',
      difficulty_bias: 0.0
    },
    constraints: {
      sentence_length_range: [12, 22],
      max_targets_per_sentence: 2
    }
  },
  {
    targets: ['learn', 'study', 'improve'],
    profile: {
      level_cefr: 'B2',
      allow_incidental: true,
      unknown_budget: 1,
      style: 'academic',
      difficulty_bias: 0.2
    },
    constraints: {
      sentence_length_range: [15, 25],
      max_targets_per_sentence: 3
    }
  },
  {
    targets: ['hello', 'world'],
    profile: {
      level_cefr: 'A1',
      allow_incidental: false,
      unknown_budget: 0,
      style: 'dialog',
      difficulty_bias: -0.5
    },
    constraints: {
      sentence_length_range: [8, 15],
      max_targets_per_sentence: 2
    }
  }
];

// ==================== 测试函数 ====================

async function testGenerateAPI(request: GenerateRequest, testName: string) {
  console.log(`\n🧪 测试: ${testName}`);
  console.log('📝 请求数据:', JSON.stringify(request, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/review/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(request),
    });
    
    const data = await response.json();
    
    console.log(`📊 响应状态: ${response.status}`);
    console.log('📄 响应数据:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ 测试通过');
      
      // 验证响应结构
      if (data.data && data.data.items) {
        console.log(`📊 生成了 ${data.data.items.length} 个句子`);
        
        data.data.items.forEach((item: any, index: number) => {
          console.log(`  📝 句子 ${index + 1}: "${item.text}"`);
          console.log(`  🎯 目标词: ${item.targets.map((t: any) => t.word).join(', ')}`);
          console.log(`  📈 预测CEFR: ${item.self_eval.predicted_cefr}`);
          console.log(`  🔤 新词汇数: ${item.self_eval.estimated_new_terms_count}`);
        });
      }
    } else {
      console.log('❌ 测试失败:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('💥 请求失败:', error);
    return null;
  }
}

// ==================== 错误测试 ====================

async function testErrorCases() {
  console.log('\n🧪 错误测试');
  
  // 测试缺少认证
  console.log('\n📝 测试缺少认证...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/review/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequests[0]),
    });
    
    const data = await response.json();
    console.log(`📊 状态: ${response.status}, 响应:`, data);
  } catch (error) {
    console.error('💥 请求失败:', error);
  }
  
  // 测试无效请求
  console.log('\n📝 测试无效请求...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/review/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({
        targets: [], // 空数组
        profile: testRequests[0].profile,
        constraints: testRequests[0].constraints
      }),
    });
    
    const data = await response.json();
    console.log(`📊 状态: ${response.status}, 响应:`, data);
  } catch (error) {
    console.error('💥 请求失败:', error);
  }
  
  // 测试GET请求
  console.log('\n📝 测试GET请求...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/review/generate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    
    const data = await response.json();
    console.log(`📊 状态: ${response.status}, 响应:`, data);
  } catch (error) {
    console.error('💥 请求失败:', error);
  }
}

// ==================== 主测试函数 ====================

async function runTests() {
  console.log('🚀 开始句子生成API测试');
  console.log(`🌐 API地址: ${API_BASE_URL}`);
  console.log(`🔑 测试Token: ${TEST_TOKEN}`);
  
  // 运行正常测试
  for (let i = 0; i < testRequests.length; i++) {
    await testGenerateAPI(testRequests[i], `正常测试 ${i + 1}`);
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 运行错误测试
  await testErrorCases();
  
  console.log('\n🎉 测试完成');
}

// ==================== 执行测试 ====================

if (require.main === module) {
  runTests().catch(console.error);
}

export {
  testGenerateAPI,
  testErrorCases,
  runTests,
  testRequests
}; 