/**
 * @fileoverview 复习提交API测试文件
 * @module api/review/test-submit
 * @description 测试复习提交API的功能
 * @version 1.0.0
 */

import type { ReviewSubmitRequest } from '@ai-voca/shared';

// ==================== 测试数据 ====================

const testUserToken = 'test-token'; // 需要替换为真实的用户token

const testRequests: ReviewSubmitRequest[] = [
  {
    word: 'example',
    rating: 'good',
    latency_ms: 2500,
    meta: {
      delivery_id: 'test-delivery-001',
      predicted_cefr: 'B1',
      estimated_new_terms_count: 1
    }
  },
  {
    word: 'difficult',
    rating: 'again',
    difficulty_feedback: 'too_hard',
    latency_ms: 5000,
    meta: {
      delivery_id: 'test-delivery-001',
      predicted_cefr: 'B2',
      estimated_new_terms_count: 2
    }
  },
  {
    word: 'easy',
    rating: 'easy',
    difficulty_feedback: 'too_easy',
    latency_ms: 1500,
    meta: {
      delivery_id: 'test-delivery-001',
      predicted_cefr: 'A2',
      estimated_new_terms_count: 0
    }
  }
];

// ==================== 测试函数 ====================

/**
 * 测试复习提交API
 */
async function testReviewSubmit() {
  console.log('🧪 开始测试复习提交API');
  
  for (const request of testRequests) {
    try {
      console.log(`\n📝 测试词汇: ${request.word}`);
      console.log(`📊 评分: ${request.rating}`);
      console.log(`⏱️ 响应时间: ${request.latency_ms}ms`);
      
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserToken}`
        },
        body: JSON.stringify(request)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 提交成功');
        console.log(`📈 新熟悉度: ${result.data.word_state.familiarity}`);
        console.log(`📅 下次复习: ${result.data.word_state.next_due_at}`);
        console.log(`🎯 难度偏置: ${result.data.user_prefs.difficulty_bias}`);
      } else {
        console.log('❌ 提交失败:', result.error);
      }
      
    } catch (error) {
      console.error('❌ 请求失败:', error);
    }
  }
  
  console.log('\n🏁 测试完成');
}

/**
 * 测试错误情况
 */
async function testErrorCases() {
  console.log('\n🧪 开始测试错误情况');
  
  const errorCases = [
    {
      name: '缺少必要参数',
      request: { rating: 'good' } as any,
      expectedError: '缺少必要参数：word 和 rating'
    },
    {
      name: '无效的rating值',
      request: { word: 'test', rating: 'invalid' } as any,
      expectedError: '无效的rating值'
    },
    {
      name: '无效的difficulty_feedback值',
      request: { 
        word: 'test', 
        rating: 'good', 
        difficulty_feedback: 'invalid' 
      } as any,
      expectedError: '无效的difficulty_feedback值'
    }
  ];
  
  for (const testCase of errorCases) {
    try {
      console.log(`\n📝 测试: ${testCase.name}`);
      
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserToken}`
        },
        body: JSON.stringify(testCase.request)
      });
      
      const result = await response.json();
      
      if (!result.success && result.error === testCase.expectedError) {
        console.log('✅ 错误处理正确');
      } else {
        console.log('❌ 错误处理不正确:', result.error);
      }
      
    } catch (error) {
      console.error('❌ 请求失败:', error);
    }
  }
  
  console.log('\n🏁 错误测试完成');
}

// ==================== 主测试函数 ====================

export async function runSubmitTests() {
  console.log('🚀 开始复习提交API测试套件\n');
  
  await testReviewSubmit();
  await testErrorCases();
  
  console.log('\n🎉 所有测试完成');
}

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  // 浏览器环境
  (window as any).runSubmitTests = runSubmitTests;
} else {
  // Node.js环境
  runSubmitTests().catch(console.error);
} 