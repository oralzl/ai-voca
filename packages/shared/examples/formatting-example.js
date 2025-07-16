/**
 * 共享模块格式化函数使用示例
 * 展示如何使用格式化工具函数
 */

const { formatWord, formatTimestamp, truncateText, capitalize } = require('../dist/index.js');

console.log('=== 格式化函数使用示例 ===\n');

// 1. 单词格式化示例
console.log('1. 单词格式化示例:');
const rawWords = ['  HELLO  ', 'WoRlD', '   JavaScript   ', 'React'];

rawWords.forEach(word => {
  const formatted = formatWord(word);
  console.log(`  "${word}" -> "${formatted}"`);
});

console.log('\n');

// 2. 时间戳格式化示例
console.log('2. 时间戳格式化示例:');
const timestamps = [
  Date.now(),
  Date.now() - 86400000, // 昨天
  Date.now() - 86400000 * 7, // 一周前
  1704067200000 // 2024-01-01
];

timestamps.forEach(timestamp => {
  const formatted = formatTimestamp(timestamp);
  console.log(`  ${timestamp} -> "${formatted}"`);
});

console.log('\n');

// 3. 文本截取示例
console.log('3. 文本截取示例:');
const texts = [
  { text: '这是一个很长的文本内容，需要被截取', maxLength: 10 },
  { text: 'Short text', maxLength: 20 },
  { text: '中文测试内容比较长需要截取处理', maxLength: 15 },
  { text: 'Hello World', maxLength: 50 }
];

texts.forEach(({ text, maxLength }) => {
  const truncated = truncateText(text, maxLength);
  console.log(`  "${text}" (max:${maxLength}) -> "${truncated}"`);
});

console.log('\n');

// 4. 首字母大写示例
console.log('4. 首字母大写示例:');
const words = ['hello', 'WORLD', 'javaScript', 'rEact', 'vue.js'];

words.forEach(word => {
  const capitalized = capitalize(word);
  console.log(`  "${word}" -> "${capitalized}"`);
});

console.log('\n=== 示例完成 ===');