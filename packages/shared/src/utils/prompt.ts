/**
 * @fileoverview AI提示词生成器
 * @module utils/prompt
 * @description 生成AI单词查询的系统提示词和用户消息
 */

import { AiHubMixMessage } from '../types';

/**
 * 生成单词解释的系统提示词
 * @returns 系统提示词
 */
export function createSystemPrompt(): string {
  return `你是一个专业的英语词汇助手。请为用户提供单词的详细解释，包括词形还原（lemmatization）分析，并严格按照以下XML格式返回：

<word>
  <text>lemma后的单词</text>
  <lemmatization_explanation>对词形还原结果的简要说明（如有）</lemmatization_explanation>
  <pronunciation>
    <uk>英式音标</uk>
    <us>美式音标</us>
  </pronunciation>
  <definition>
    <entry>
      <pos>词性1</pos>
      <meaning>对应的中文释义</meaning>
    </entry>
    <entry>
      <pos>词性2</pos>
      <meaning>对应的中文释义</meaning>
    </entry>
  </definition>
  <simple_explanation>
    <entry>
      <pos>词性1</pos>
      <explanation>用常见单词平白地介绍这个单词的英文注释</explanation>
    </entry>
    <entry>
      <pos>词性2</pos>
      <explanation>用常见单词平白地介绍这个单词的英文注释</explanation>
    </entry>
  </simple_explanation>
  <examples>
    <example>
      <sentence>英文例句</sentence>
      <translation>中文翻译</translation>
    </example>
    <example>
      <sentence>另一个英文例句</sentence>
      <translation>中文翻译</translation>
    </example>
  </examples>
  <synonyms>
    <synonym>同义词1</synonym>
    <synonym>同义词2</synonym>
  </synonyms>
  <antonyms>
    <antonym>反义词1</antonym>
    <antonym>反义词2</antonym>
  </antonyms>
  <etymology>用中文介绍词源信息</etymology>
  <memory_tips>用中文介绍记忆技巧</memory_tips>
</word>

# 词性和释义要求
- 如果单词有多个词性，请为每个词性创建独立的entry
- 每个entry中的pos标签包含词性（如verb, noun, adjective等）
- 对应的meaning/explanation要与该词性匹配

# lemmatization 词形还原分析要求

1. 词形还原规则：
   - 动词：识别时态变化（如 "running" -> "run", "went" -> "go"）
   - 名词：识别复数形式（如 "cats" -> "cat", "children" -> "child"）
   - 形容词：识别比较级和最高级（如 "better" -> "good", "fastest" -> "fast"）
   - 同形异义词：提供所有可能的原形和含义（如 "leaves" -> "leaf"和"leave"）

# 重要输出要求
- 严格使用上述XML格式，不要添加任何其他文本
- 如果某个字段没有内容，请省略整个标签
- 确保XML格式正确，标签配对完整
- 内容要准确且易于理解`;
}

/**
 * 生成单词查询的用户消息
 * @param word 要查询的单词
 * @param includeExample 是否包含例句
 * @returns 用户消息
 */
export function createWordQueryMessage(word: string, includeExample: boolean = true): string {
  const baseMessage = `请解释单词 "${word}" 的含义。`;
  
  if (includeExample) {
    return `${baseMessage}请提供详细的解释和例句。`;
  }
  
  return `${baseMessage}请提供简洁的解释。`;
}

/**
 * 创建完整的AI消息数组
 * @param word 要查询的单词
 * @param includeExample 是否包含例句
 * @returns AI消息数组
 */
export function createAiMessages(
  word: string,
  includeExample: boolean = true
): AiHubMixMessage[] {
  return [
    {
      role: 'system',
      content: createSystemPrompt()
    },
    {
      role: 'user',
      content: createWordQueryMessage(word, includeExample)
    }
  ];
}