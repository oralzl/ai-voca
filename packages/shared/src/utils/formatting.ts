/**
 * 格式化单词（去除多余空格，转换为小写）
 * @param word 原始单词
 * @returns 格式化后的单词
 */
export function formatWord(word: string): string {
  if (!word || typeof word !== 'string') {
    return '';
  }
  
  return word.trim().toLowerCase();
}

/**
 * 格式化时间戳为可读格式
 * @param timestamp 时间戳
 * @returns 格式化的时间字符串
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 截取文本到指定长度
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截取后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * 首字母大写
 * @param text 原始文本
 * @returns 首字母大写的文本
 */
export function capitalize(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}