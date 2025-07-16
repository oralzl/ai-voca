/**
 * 共享模块验证函数使用示例
 * 展示如何使用验证工具函数
 */

const { isValidWord, isValidApiKey, isValidUrl } = require('../dist/index.js');

console.log('=== 验证函数使用示例 ===\n');

// 1. 单词验证示例
console.log('1. 单词验证示例:');
const words = ['hello', 'world', 'test-word', 'café', '123', '', '   ', 'a'.repeat(60)];

words.forEach(word => {
  const isValid = isValidWord(word);
  console.log(`  "${word}" -> ${isValid ? '✓ 有效' : '✗ 无效'}`);
});

console.log('\n');

// 2. API密钥验证示例
console.log('2. API密钥验证示例:');
const apiKeys = [
  'sk-1234567890abcdef',
  'key-abcdef1234567890',
  'short',
  '',
  'a'.repeat(100),
  'sk-' + 'a'.repeat(50)
];

apiKeys.forEach(key => {
  const isValid = isValidApiKey(key);
  console.log(`  "${key.length > 20 ? key.substring(0, 20) + '...' : key}" -> ${isValid ? '✓ 有效' : '✗ 无效'}`);
});

console.log('\n');

// 3. URL验证示例
console.log('3. URL验证示例:');
const urls = [
  'https://example.com',
  'http://localhost:3000',
  'https://api.example.com/v1/test',
  'ftp://example.com',
  'not-a-url',
  'https://',
  ''
];

urls.forEach(url => {
  const isValid = isValidUrl(url);
  console.log(`  "${url}" -> ${isValid ? '✓ 有效' : '✗ 无效'}`);
});

console.log('\n=== 示例完成 ===');