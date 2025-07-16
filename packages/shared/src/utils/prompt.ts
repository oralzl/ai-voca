import { AiHubMixMessage } from '../types';

/**
 * 生成单词解释的系统提示词
 * @param language 目标语言
 * @returns 系统提示词
 */
export function createSystemPrompt(language: 'zh' | 'en' = 'zh'): string {
  const prompts = {
    zh: `你是一个专业的英语词汇助手。请为用户提供单词的详细解释，并严格按照以下XML格式返回：

<word_explanation>
  <word>单词本身</word>
  <pronunciation>音标（如果适用）</pronunciation>
  <part_of_speech>词性</part_of_speech>
  <definition>中文释义</definition>
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
  <etymology>词源或记忆技巧（如果有用）</etymology>
</word_explanation>

重要要求：
1. 严格使用上述XML格式，不要添加任何其他文本
2. 如果某个字段没有内容，请省略整个标签
3. 确保XML格式正确，标签配对完整
4. 内容要准确且易于理解`,
    
    en: `You are a professional English vocabulary assistant. Please provide detailed explanations for words in the following XML format:

<word_explanation>
  <word>the word itself</word>
  <pronunciation>phonetic transcription (if applicable)</pronunciation>
  <part_of_speech>part of speech</part_of_speech>
  <definition>definition in English</definition>
  <examples>
    <example>
      <sentence>example sentence</sentence>
      <translation>translation if needed</translation>
    </example>
    <example>
      <sentence>another example sentence</sentence>
      <translation>translation if needed</translation>
    </example>
  </examples>
  <synonyms>
    <synonym>synonym1</synonym>
    <synonym>synonym2</synonym>
  </synonyms>
  <antonyms>
    <antonym>antonym1</antonym>
    <antonym>antonym2</antonym>
  </antonyms>
  <etymology>etymology or memory tips (if useful)</etymology>
</word_explanation>

Important requirements:
1. Use strictly the XML format above, no additional text
2. If a field has no content, omit the entire tag
3. Ensure XML format is correct with proper tag pairing
4. Content should be accurate and comprehensible`
  };
  
  return prompts[language];
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
 * @param language 目标语言
 * @param includeExample 是否包含例句
 * @returns AI消息数组
 */
export function createAiMessages(
  word: string,
  language: 'zh' | 'en' = 'zh',
  includeExample: boolean = true
): AiHubMixMessage[] {
  return [
    {
      role: 'system',
      content: createSystemPrompt(language)
    },
    {
      role: 'user',
      content: createWordQueryMessage(word, includeExample)
    }
  ];
}