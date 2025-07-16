/**
 * 后端API使用示例
 * 展示如何调用后端API接口
 */

const axios = require('axios');

// 配置API客户端
const apiClient = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('=== 后端API使用示例 ===\n');

// 1. 健康检查示例
async function healthCheckExample() {
  console.log('1. 健康检查示例:');
  try {
    const response = await apiClient.get('/health');
    console.log('  ✓ 健康检查成功:', response.data);
  } catch (error) {
    console.log('  ✗ 健康检查失败:', error.message);
  }
  console.log('');
}

// 2. GET方式查询单词示例
async function getWordQueryExample() {
  console.log('2. GET方式查询单词示例:');
  const examples = [
    { word: 'hello', language: 'zh', includeExample: true },
    { word: 'world', language: 'en', includeExample: false }
  ];
  
  for (const example of examples) {
    try {
      const response = await apiClient.get('/api/words/query', {
        params: example
      });
      console.log(`  ✓ 查询 "${example.word}" 成功:`);
      console.log(`    释义: ${response.data.data?.definition?.substring(0, 100)}...`);
    } catch (error) {
      console.log(`  ✗ 查询 "${example.word}" 失败:`, error.response?.data?.error || error.message);
    }
  }
  console.log('');
}

// 3. POST方式查询单词示例
async function postWordQueryExample() {
  console.log('3. POST方式查询单词示例:');
  const examples = [
    { word: 'javascript', language: 'zh', includeExample: true },
    { word: 'react', language: 'zh', includeExample: false }
  ];
  
  for (const example of examples) {
    try {
      const response = await apiClient.post('/api/words/query', example);
      console.log(`  ✓ 查询 "${example.word}" 成功:`);
      console.log(`    释义: ${response.data.data?.definition?.substring(0, 100)}...`);
    } catch (error) {
      console.log(`  ✗ 查询 "${example.word}" 失败:`, error.response?.data?.error || error.message);
    }
  }
  console.log('');
}

// 4. 错误处理示例
async function errorHandlingExample() {
  console.log('4. 错误处理示例:');
  
  // 无效单词
  try {
    await apiClient.get('/api/words/query', {
      params: { word: '' }
    });
  } catch (error) {
    console.log('  ✓ 捕获到空单词错误:', error.response?.data?.error);
  }
  
  // 无效格式
  try {
    await apiClient.get('/api/words/query', {
      params: { word: '12345@#$%' }
    });
  } catch (error) {
    console.log('  ✓ 捕获到无效格式错误:', error.response?.data?.error);
  }
  
  console.log('');
}

// 5. 获取API文档示例
async function getApiDocsExample() {
  console.log('5. 获取API文档示例:');
  try {
    const response = await apiClient.get('/api/words');
    console.log('  ✓ 获取API文档成功:');
    console.log(`    API名称: ${response.data.name}`);
    console.log(`    版本: ${response.data.version}`);
    console.log(`    可用端点: ${Object.keys(response.data.endpoints).join(', ')}`);
  } catch (error) {
    console.log('  ✗ 获取API文档失败:', error.message);
  }
  console.log('');
}

// 6. 性能测试示例
async function performanceTestExample() {
  console.log('6. 性能测试示例:');
  const startTime = Date.now();
  const promises = [];
  
  // 并发查询多个单词
  const words = ['hello', 'world', 'javascript', 'react', 'vue'];
  
  words.forEach(word => {
    promises.push(
      apiClient.post('/api/words/query', {
        word,
        language: 'zh',
        includeExample: false
      }).catch(error => ({ error: error.message }))
    );
  });
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`  ✓ 并发查询 ${words.length} 个单词完成:`);
    console.log(`    耗时: ${duration}ms`);
    console.log(`    成功: ${results.filter(r => !r.error).length}/${words.length}`);
  } catch (error) {
    console.log('  ✗ 性能测试失败:', error.message);
  }
  console.log('');
}

// 运行所有示例
async function runAllExamples() {
  await healthCheckExample();
  await getWordQueryExample();
  await postWordQueryExample();
  await errorHandlingExample();
  await getApiDocsExample();
  await performanceTestExample();
  
  console.log('=== 示例完成 ===');
}

// 检查服务器是否运行
apiClient.get('/health')
  .then(() => {
    console.log('✓ 后端服务器运行中，开始运行示例...\n');
    runAllExamples();
  })
  .catch(() => {
    console.log('✗ 后端服务器未运行，请先启动服务器:');
    console.log('  cd packages/backend && npm run dev\n');
  });