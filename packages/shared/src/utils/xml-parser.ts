/**
 * XML解析工具函数
 * 用于解析AI返回的结构化XML响应
 */

export interface Example {
  sentence: string;
  translation?: string;
}

export interface ParsedWordExplanation {
  word?: string;
  text?: string;
  lemmatizationExplanation?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definition?: string;
  simpleExplanation?: string;
  examples?: Example[];
  synonyms?: string[];
  antonyms?: string[];
  etymology?: string;
  memoryTips?: string;
}

/**
 * 提取XML标签内容
 * @param xml XML字符串
 * @param tagName 标签名
 * @returns 标签内容，如果没有找到则返回undefined
 */
function extractTagContent(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 's');
  const match = xml.match(regex);
  return match ? match[1].trim() : undefined;
}

/**
 * 提取多个同名标签的内容
 * @param xml XML字符串
 * @param tagName 标签名
 * @returns 标签内容数组
 */
function extractMultipleTagContents(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'gs');
  const matches = [];
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1].trim());
  }
  
  return matches;
}

/**
 * 解析例句XML
 * @param examplesXml examples标签内的XML内容
 * @returns 解析后的例句数组
 */
function parseExamples(examplesXml: string): Example[] {
  const examples: Example[] = [];
  const exampleBlocks = extractMultipleTagContents(examplesXml, 'example');
  
  for (const block of exampleBlocks) {
    const sentence = extractTagContent(block, 'sentence');
    const translation = extractTagContent(block, 'translation');
    
    if (sentence) {
      examples.push({
        sentence,
        translation
      });
    }
  }
  
  return examples;
}

/**
 * 清理XML字符串
 * @param xml 原始XML字符串
 * @returns 清理后的XML字符串
 */
function cleanXml(xml: string): string {
  // 移除多余的空白字符
  return xml
    .replace(/\n\s*\n/g, '\n') // 移除多余的换行
    .replace(/>\s+</g, '><') // 移除标签间的空白
    .trim();
}

/**
 * 提取多个 word 标签内容
 * @param xml XML字符串
 * @returns word标签内容数组
 */
function extractWordBlocks(xml: string): string[] {
  const regex = /<word>(.*?)<\/word>/gs;
  const matches = [];
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1].trim());
  }
  
  return matches;
}

/**
 * 解析AI返回的XML格式单词解释
 * @param xmlContent AI返回的XML内容
 * @returns 解析后的单词解释对象（只返回第一个word的解析结果）
 */
export function parseWordExplanationXml(xmlContent: string): ParsedWordExplanation {
  try {
    // 清理XML内容
    const cleanedXml = cleanXml(xmlContent);
    
    // 提取所有的word内容块
    const wordBlocks = extractWordBlocks(cleanedXml);
    if (wordBlocks.length === 0) {
      throw new Error('未找到word标签');
    }
    
    // 只解析第一个word块
    const mainContent = wordBlocks[0];
    const result: ParsedWordExplanation = {};
    
    // 提取基本信息
    result.text = extractTagContent(mainContent, 'text');
    result.word = result.text; // 将text字段的值作为word字段的值
    result.lemmatizationExplanation = extractTagContent(mainContent, 'lemmatization_explanation');
    result.pronunciation = extractTagContent(mainContent, 'pronunciation');
    result.partOfSpeech = extractTagContent(mainContent, 'part_of_speech');
    result.definition = extractTagContent(mainContent, 'definition');
    result.simpleExplanation = extractTagContent(mainContent, 'simple_explanation');
    result.etymology = extractTagContent(mainContent, 'etymology');
    result.memoryTips = extractTagContent(mainContent, 'memory_tips');
    
    // 提取例句
    const examplesContent = extractTagContent(mainContent, 'examples');
    if (examplesContent) {
      result.examples = parseExamples(examplesContent);
    }
    
    // 提取同义词
    const synonymsContent = extractTagContent(mainContent, 'synonyms');
    if (synonymsContent) {
      result.synonyms = extractMultipleTagContents(synonymsContent, 'synonym');
    }
    
    // 提取反义词
    const antonymsContent = extractTagContent(mainContent, 'antonyms');
    if (antonymsContent) {
      result.antonyms = extractMultipleTagContents(antonymsContent, 'antonym');
    }
    
    return result;
    
  } catch (error) {
    console.error('XML解析失败:', error);
    
    // 返回降级解析结果
    return {
      definition: xmlContent, // 如果解析失败，将原始内容作为定义
      word: '解析失败'
    };
  }
}

/**
 * 验证XML格式是否正确
 * @param xml XML字符串
 * @returns 是否为有效XML
 */
export function isValidXml(xml: string): boolean {
  try {
    const cleanedXml = cleanXml(xml);
    
    // 检查是否有word标签
    const hasMainTag = cleanedXml.includes('<word>') && 
                       cleanedXml.includes('</word>');
    
    if (!hasMainTag) {
      return false;
    }
    
    // 基本的标签配对检查
    const openTags = (cleanedXml.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (cleanedXml.match(/<\/[^>]+>/g) || []).length;
    
    return openTags === closeTags;
    
  } catch (error) {
    return false;
  }
}

/**
 * 提取纯文本内容（移除所有XML标签）
 * @param xml XML字符串
 * @returns 纯文本内容
 */
export function extractPlainText(xml: string): string {
  return xml.replace(/<[^>]*>/g, '').trim();
}