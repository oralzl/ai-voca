/**
 * @fileoverview XML解析工具
 * @module utils/xml-parser
 * @description 解析AI返回的结构化XML响应，支持多种标签格式和HTML转换
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
 * 安全的HTML内容清理，只允许特定的HTML标签
 * @param html HTML字符串
 * @returns 清理后的HTML字符串
 */
function sanitizeHtml(html: string): string {
  // 简单的标签清理：只允许 ul, li, br, strong, em, b, i 标签
  const sanitized = html.replace(/<(?!\/?(?:ul|li|br|strong|em|b|i)\b)[^>]*>/gi, '');
  
  return sanitized;
}

/**
 * 处理包含各种列表标签的内容，将其转换为HTML格式
 * @param content 包含列表标签的XML内容
 * @returns 处理后的HTML内容
 */
function processItemTags(content: string): string {
  if (!content) return content;
  
  // 检查不同的列表标签类型
  const hasItems = content.includes('<item>') && content.includes('</item>');
  const hasTips = content.includes('<tip>') && content.includes('</tip>');
  const hasEntries = content.includes('<entry>') && content.includes('</entry>');
  
  if (hasItems) {
    // 提取所有 item 内容
    const items = extractMultipleTagContents(content, 'item');
    if (items.length > 0) {
      return formatItemsList(items);
    }
  }
  
  if (hasTips) {
    // 提取所有 tip 内容
    const tips = extractMultipleTagContents(content, 'tip');
    if (tips.length > 0) {
      return formatItemsList(tips);
    }
  }
  
  if (hasEntries) {
    // 提取所有 entry 内容并格式化
    const entries = extractMultipleTagContents(content, 'entry');
    if (entries.length > 0) {
      const formattedEntries = entries.map(entry => {
        const pos = extractTagContent(entry, 'pos');
        const meaning = extractTagContent(entry, 'meaning');
        const explanation = extractTagContent(entry, 'explanation');
        
        if (pos && meaning) {
          return `<span style="font-weight: bold; font-style: italic;">${pos}</span>：${meaning}`;
        } else if (pos && explanation) {
          return `<span style="font-weight: bold; font-style: italic;">${pos}</span>: ${explanation}`;
        } else if (meaning) {
          return meaning;
        } else if (explanation) {
          return explanation;
        } else {
          return entry.trim();
        }
      });
      return formatItemsList(formattedEntries);
    }
  }
  
  // 如果没有特殊标签，检查是否有其他需要清理的HTML标签
  const hasHtmlTags = /<[^>]+>/.test(content);
  if (hasHtmlTags) {
    return sanitizeHtml(content);
  }
  
  // 如果没有任何标签，直接返回原内容
  return content;
}

/**
 * 将项目列表格式化为HTML
 * @param items 项目数组
 * @returns 格式化后的HTML
 */
function formatItemsList(items: string[]): string {
  if (items.length > 1) {
    // 如果有多个项目，转换为无序列表
    const listHtml = '<ul>' + items.map(item => `<li>${item.trim()}</li>`).join('') + '</ul>';
    return sanitizeHtml(listHtml);
  } else {
    // 如果只有一个项目，直接返回内容
    return sanitizeHtml(items[0].trim());
  }
}

/**
 * 提取并处理可能包含item标签的字段内容
 * @param xml XML字符串
 * @param tagName 标签名
 * @returns 处理后的内容
 */
function extractAndProcessTagContent(xml: string, tagName: string): string | undefined {
  const content = extractTagContent(xml, tagName);
  if (!content) return undefined;
  
  return processItemTags(content);
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
    result.etymology = extractTagContent(mainContent, 'etymology');
    
    // 处理可能包含item标签的字段
    result.definition = extractAndProcessTagContent(mainContent, 'definition');
    result.simpleExplanation = extractAndProcessTagContent(mainContent, 'simple_explanation');
    result.memoryTips = extractAndProcessTagContent(mainContent, 'memory_tips');
    
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

/**
 * 从rawResponse中提取查询参数
 * @param rawResponse 包含input标签的完整响应
 * @returns 查询参数对象，如果解析失败则返回null
 */
export function extractInputParams(rawResponse: string): {
  word: string;
  includeExample: boolean;
  timestamp: number;
} | null {
  try {
    if (!rawResponse) return null;
    
    const inputContent = extractTagContent(rawResponse, 'input');
    if (!inputContent) return null;
    
    const word = extractTagContent(inputContent, 'word');
    const includeExampleStr = extractTagContent(inputContent, 'includeExample');
    const timestampStr = extractTagContent(inputContent, 'timestamp');
    
    if (!word || !includeExampleStr || !timestampStr) return null;
    
    const includeExample = includeExampleStr === 'true';
    const timestamp = parseInt(timestampStr, 10);
    
    if (isNaN(timestamp)) return null;
    
    return { word, includeExample, timestamp };
  } catch (error) {
    console.error('提取查询参数失败:', error);
    return null;
  }
}