/**
 * AiHubMix 客户端使用示例
 * 展示如何使用 AiHubMixClient 类进行 AI 模型调用
 */

// 模拟环境变量
process.env.AIHUBMIX_API_KEY = 'test-api-key';
process.env.AIHUBMIX_API_URL = 'https://aihubmix.com/v1';
process.env.AIHUBMIX_MODEL = 'gemini-2.5-flash-lite-preview-06-17';
process.env.AIHUBMIX_TIMEOUT = '30000';

// 导入客户端类（需要先构建项目）
const { AiHubMixClient, createAiHubMixClient, createAiHubMixClientFromEnv } = require('../dist/utils/aihubmix-client.js');

console.log('=== AiHubMix 客户端使用示例 ===\n');

// 1. 创建客户端实例
console.log('1. 创建 AiHubMixClient 实例:');

try {
  // 方式1：直接创建
  const client1 = createAiHubMixClient({
    apiKey: 'test-api-key',
    apiUrl: 'https://aihubmix.com/v1',
    model: 'gemini-2.5-flash-lite-preview-06-17',
    timeout: 30000
  });
  console.log('  ✓ 直接创建客户端成功');

  // 方式2：从环境变量创建
  const client2 = createAiHubMixClientFromEnv();
  console.log('  ✓ 从环境变量创建客户端成功');
  
  console.log(`  默认模型: ${client2.getDefaultModel()}`);
} catch (error) {
  console.log('  ✗ 客户端创建失败:', error.message);
}
console.log('');

// 2. 基本聊天完成示例
async function basicChatExample() {
  console.log('2. 基本聊天完成示例:');
  
  try {
    const client = createAiHubMixClientFromEnv();
    
    const messages = [
      { role: 'user', content: '解释一下单词 "hello" 的意思' }
    ];
    
    console.log('  发送消息:', messages[0].content);
    
    const response = await client.chatCompletion(messages);
    
    console.log('  ✓ 请求成功:');
    console.log(`    模型: ${response.model}`);
    console.log(`    响应: ${response.choices[0].message.content.substring(0, 100)}...`);
    console.log(`    用量: ${response.usage.total_tokens} tokens`);
  } catch (error) {
    console.log('  ✗ 请求失败:', error.message);
  }
  console.log('');
}

// 3. 高级配置示例
async function advancedConfigExample() {
  console.log('3. 高级配置示例:');
  
  try {
    const client = createAiHubMixClient({
      apiKey: process.env.AIHUBMIX_API_KEY,
      apiUrl: process.env.AIHUBMIX_API_URL,
      model: 'gemini-2.0-flash', // 使用不同的模型
      timeout: 15000, // 更短的超时时间
      defaultTemperature: 0.7,
      defaultMaxTokens: 1000
    });
    
    const messages = [
      { role: 'system', content: '你是一个专业的英语教师' },
      { role: 'user', content: '用简单的方式解释单词 "serendipity"' }
    ];
    
    console.log('  使用自定义配置发送请求...');
    
    const response = await client.chatCompletion(messages, {
      temperature: 0.3, // 覆盖默认设置
      maxTokens: 500,
      model: 'gemini-2.5-flash-lite-preview-06-17' // 覆盖默认模型
    });
    
    console.log('  ✓ 高级配置请求成功');
    console.log(`    实际使用模型: ${response.model}`);
    console.log(`    响应长度: ${response.choices[0].message.content.length} 字符`);
  } catch (error) {
    console.log('  ✗ 高级配置请求失败:', error.message);
  }
  console.log('');
}

// 4. 错误处理示例
async function errorHandlingExample() {
  console.log('4. 错误处理示例:');
  
  // 测试无效 API 密钥
  try {
    const client = createAiHubMixClient({
      apiKey: 'invalid-key',
      apiUrl: 'https://aihubmix.com/v1'
    });
    
    console.log('  测试无效 API 密钥...');
    
    const messages = [{ role: 'user', content: 'test' }];
    await client.chatCompletion(messages);
    
    console.log('  ✗ 意外成功（应该失败）');
  } catch (error) {
    console.log('  ✓ 正确捕获错误:', error.message);
  }
  
  // 测试无效 URL
  try {
    const client = createAiHubMixClient({
      apiKey: 'test-key',
      apiUrl: 'https://invalid-url.com/v1'
    });
    
    console.log('  测试无效 URL...');
    
    const messages = [{ role: 'user', content: 'test' }];
    await client.chatCompletion(messages);
    
    console.log('  ✗ 意外成功（应该失败）');
  } catch (error) {
    console.log('  ✓ 正确捕获错误:', error.message);
  }
  
  console.log('');
}

// 5. 性能测试示例
async function performanceExample() {
  console.log('5. 性能测试示例:');
  
  const client = createAiHubMixClientFromEnv();
  const testMessages = [
    { role: 'user', content: '解释单词 "performance"' },
    { role: 'user', content: '解释单词 "efficiency"' },
    { role: 'user', content: '解释单词 "optimization"' }
  ];
  
  const results = [];
  
  for (const [index, message] of testMessages.entries()) {
    const startTime = Date.now();
    
    try {
      const response = await client.chatCompletion([message], {
        maxTokens: 200,
        temperature: 0.1
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        index: index + 1,
        duration,
        tokens: response.usage.total_tokens,
        success: true
      });
      
      console.log(`  请求 ${index + 1}: ${duration}ms, ${response.usage.total_tokens} tokens`);
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        index: index + 1,
        duration,
        success: false,
        error: error.message
      });
      
      console.log(`  请求 ${index + 1}: ${duration}ms (失败: ${error.message})`);
    }
  }
  
  // 统计信息
  const successfulResults = results.filter(r => r.success);
  const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
  const avgTokens = successfulResults.reduce((sum, r) => sum + r.tokens, 0) / successfulResults.length;
  const successRate = successfulResults.length / results.length;
  
  console.log(`  平均响应时间: ${avgDuration.toFixed(2)}ms`);
  console.log(`  平均 Token 使用: ${avgTokens.toFixed(0)} tokens`);
  console.log(`  成功率: ${(successRate * 100).toFixed(1)}%`);
  console.log('');
}

// 6. 模型切换示例
async function modelSwitchingExample() {
  console.log('6. 模型切换示例:');
  
  const client = createAiHubMixClientFromEnv();
  
  const models = [
    'gemini-2.5-flash-lite-preview-06-17',
    'gemini-2.0-flash',
    'gpt-4o-mini'
  ];
  
  const testMessage = [{ role: 'user', content: '简单解释单词 "versatile"' }];
  
  for (const model of models) {
    try {
      console.log(`  测试模型: ${model}`);
      
      const response = await client.chatCompletion(testMessage, {
        model,
        maxTokens: 100
      });
      
      console.log(`    ✓ 成功: ${response.choices[0].message.content.substring(0, 50)}...`);
    } catch (error) {
      console.log(`    ✗ 失败: ${error.message}`);
    }
  }
  
  console.log('');
}

// 运行所有示例
async function runAllExamples() {
  await basicChatExample();
  await advancedConfigExample();
  await errorHandlingExample();
  await performanceExample();
  await modelSwitchingExample();
  
  console.log('=== 示例完成 ===');
  console.log('');
  console.log('使用说明:');
  console.log('1. AiHubMixClient 提供了统一的 AI 模型调用接口');
  console.log('2. 支持多种模型，只需更改 model 参数');
  console.log('3. 自动处理错误和超时');
  console.log('4. 支持灵活的配置选项');
  console.log('5. 可以从环境变量或直接配置创建客户端');
  console.log('');
  console.log('注意事项:');
  console.log('- 确保设置了正确的 AIHUBMIX_API_KEY');
  console.log('- 不同模型可能有不同的性能特征');
  console.log('- 合理设置超时时间和 token 限制');
  console.log('- 错误处理已经封装在客户端中');
}

// 运行示例
runAllExamples().catch(console.error);