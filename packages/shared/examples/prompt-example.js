/**
 * 共享模块提示词生成使用示例
 * 展示如何使用提示词生成工具函数
 */

const { createSystemPrompt, createWordQueryMessage, createAiMessages } = require('../dist/index.js');

console.log('=== 提示词生成使用示例 ===\n');

// 1. 系统提示词生成示例
console.log('1. 系统提示词生成示例:');
const languages = ['zh', 'en'];

languages.forEach(lang => {
  const prompt = createSystemPrompt(lang);
  console.log(`  ${lang === 'zh' ? '中文' : '英文'}系统提示词:`);
  console.log(`  "${prompt.substring(0, 100)}..."\n`);
});

// 2. 用户查询消息生成示例
console.log('2. 用户查询消息生成示例:');
const queryExamples = [
  { word: 'hello', includeExample: true },
  { word: 'world', includeExample: false },
  { word: 'javascript', includeExample: true },
  { word: 'react', includeExample: false }
];

queryExamples.forEach(({ word, includeExample }) => {
  const message = createWordQueryMessage(word, includeExample);
  console.log(`  单词: "${word}" (${includeExample ? '包含' : '不包含'}例句)`);
  console.log(`  消息: "${message}"\n`);
});

// 3. 完整AI消息数组生成示例
console.log('3. 完整AI消息数组生成示例:');
const aiExamples = [
  { word: 'hello', language: 'zh', includeExample: true },
  { word: 'world', language: 'en', includeExample: false }
];

aiExamples.forEach(({ word, language, includeExample }) => {
  const messages = createAiMessages(word, language, includeExample);
  console.log(`  单词: "${word}" (${language === 'zh' ? '中文' : '英文'}解释, ${includeExample ? '包含' : '不包含'}例句)`);
  console.log('  消息数组:');
  messages.forEach((msg, index) => {
    console.log(`    ${index + 1}. ${msg.role}: "${msg.content.substring(0, 50)}..."`);
  });
  console.log('');
});

// 4. 实际使用场景示例
console.log('4. 实际使用场景示例:');
console.log('  // 在实际项目中的使用方式');
console.log('  const messages = createAiMessages("hello", "zh", true);');
console.log('  const response = await fetch("/api/ai", {');
console.log('    method: "POST",');
console.log('    headers: { "Content-Type": "application/json" },');
console.log('    body: JSON.stringify({ messages })');
console.log('  });');

console.log('\n=== 示例完成 ===');