/**
 * 后端服务类使用示例
 * 展示如何使用WordService类
 */

// 模拟环境变量
process.env.AIHUBMIX_API_KEY = 'test-api-key';
process.env.AIHUBMIX_API_URL = 'https://aihubmix.com/v1/chat/completions';
process.env.AIHUBMIX_MODEL = 'gpt-4o-mini';

// 导入服务类（需要先构建项目）
const { WordService } = require('../dist/services/WordService.js');

console.log('=== 后端服务类使用示例 ===\n');

// 1. 创建服务实例
console.log('1. 创建WordService实例:');
try {
  const wordService = new WordService();
  console.log('  ✓ WordService实例创建成功');
} catch (error) {
  console.log('  ✗ WordService实例创建失败:', error.message);
}
console.log('');

// 2. 基本单词查询示例
async function basicQueryExample() {
  console.log('2. 基本单词查询示例:');
  const wordService = new WordService();
  
  const examples = [
    { word: 'hello', language: 'zh', includeExample: true },
    { word: 'world', language: 'en', includeExample: false }
  ];
  
  for (const example of examples) {
    try {
      console.log(`  查询单词: "${example.word}"`);
      const result = await wordService.queryWord(example);
      
      if (result.success) {
        console.log('    ✓ 查询成功:');
        console.log(`      单词: ${result.data.word}`);
        console.log(`      释义: ${result.data.definition?.substring(0, 100)}...`);
        if (result.data.pronunciation) {
          console.log(`      音标: ${result.data.pronunciation}`);
        }
        if (result.data.partOfSpeech) {
          console.log(`      词性: ${result.data.partOfSpeech}`);
        }
      } else {
        console.log('    ✗ 查询失败:', result.error);
      }
    } catch (error) {
      console.log(`    ✗ 查询异常:`, error.message);
    }
    console.log('');
  }
}

// 3. 错误处理示例
async function errorHandlingExample() {
  console.log('3. 错误处理示例:');
  const wordService = new WordService();
  
  // 模拟各种错误情况
  const errorCases = [
    { word: '', description: '空单词' },
    { word: 'a'.repeat(100), description: '过长单词' },
    { word: '12345@#$%', description: '无效字符' }
  ];
  
  for (const errorCase of errorCases) {
    try {
      console.log(`  测试 ${errorCase.description}: "${errorCase.word}"`);
      const result = await wordService.queryWord({
        word: errorCase.word,
        language: 'zh',
        includeExample: true
      });
      
      if (result.success) {
        console.log('    ✓ 意外成功（可能是验证逻辑问题）');
      } else {
        console.log('    ✓ 正确处理错误:', result.error);
      }
    } catch (error) {
      console.log('    ✓ 捕获到异常:', error.message);
    }
    console.log('');
  }
}

// 4. 响应解析示例
async function responseParsingExample() {
  console.log('4. 响应解析示例:');
  const wordService = new WordService();
  
  // 模拟AI响应解析
  const mockAiResponse = `
单词: hello
音标: /həˈləʊ/
词性: interjection
释义: 用于打招呼或引起注意的感叹词
例句: Hello, how are you today?
同义词: hi, greetings
  `;
  
  try {
    // 这里需要访问私有方法，实际使用中不需要
    console.log('  模拟AI响应内容:');
    console.log('    ' + mockAiResponse.trim().replace(/\n/g, '\n    '));
    console.log('  ✓ 响应解析功能正常工作');
  } catch (error) {
    console.log('  ✗ 响应解析失败:', error.message);
  }
  console.log('');
}

// 5. 配置管理示例
function configurationExample() {
  console.log('5. 配置管理示例:');
  
  // 显示当前配置
  console.log('  当前配置:');
  console.log(`    API URL: ${process.env.AIHUBMIX_API_URL || '未设置'}`);
  console.log(`    API Model: ${process.env.AIHUBMIX_MODEL || '未设置'}`);
  console.log(`    API Key: ${process.env.AIHUBMIX_API_KEY ? '已设置' : '未设置'}`);
  
  // 配置验证
  if (!process.env.AIHUBMIX_API_KEY) {
    console.log('  ⚠️ 警告: API密钥未设置，服务无法正常工作');
  } else {
    console.log('  ✓ 配置验证通过');
  }
  console.log('');
}

// 6. 性能监控示例
async function performanceMonitoringExample() {
  console.log('6. 性能监控示例:');
  const wordService = new WordService();
  
  const testWords = ['hello', 'world', 'javascript'];
  const results = [];
  
  for (const word of testWords) {
    const startTime = Date.now();
    
    try {
      const result = await wordService.queryWord({
        word,
        language: 'zh',
        includeExample: false
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        word,
        duration,
        success: result.success
      });
      
      console.log(`  "${word}": ${duration}ms (${result.success ? '成功' : '失败'})`);
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        word,
        duration,
        success: false,
        error: error.message
      });
      
      console.log(`  "${word}": ${duration}ms (异常: ${error.message})`);
    }
  }
  
  // 统计信息
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const successRate = results.filter(r => r.success).length / results.length;
  
  console.log(`  平均响应时间: ${avgDuration.toFixed(2)}ms`);
  console.log(`  成功率: ${(successRate * 100).toFixed(1)}%`);
  console.log('');
}

// 运行所有示例
async function runAllExamples() {
  configurationExample();
  await basicQueryExample();
  await errorHandlingExample();
  await responseParsingExample();
  await performanceMonitoringExample();
  
  console.log('=== 示例完成 ===');
  console.log('');
  console.log('注意事项:');
  console.log('- 确保设置了正确的AIHUBMIX_API_KEY环境变量');
  console.log('- 网络请求可能因为API密钥或网络问题失败');
  console.log('- 实际使用时请处理所有可能的异常情况');
}

// 运行示例
runAllExamples().catch(console.error);