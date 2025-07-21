/**
 * @fileoverview 验证工具函数
 * @module utils/validation
 * @description 提供单词、API密钥和URL等输入的验证函数
 */

/**
 * 验证单词格式
 * @param word 待验证的单词
 * @returns 是否为有效单词
 */
export function isValidWord(word: string): boolean {
  if (!word || typeof word !== 'string') {
    return false;
  }
  
  const trimmed = word.trim();
  if (trimmed.length === 0 || trimmed.length > 50) {
    return false;
  }
  
  // 允许字母、数字、连字符和空格
  const wordPattern = /^[a-zA-Z0-9\s\-']+$/;
  return wordPattern.test(trimmed);
}

/**
 * 验证API密钥格式
 * @param apiKey API密钥
 * @returns 是否为有效API密钥
 */
export function isValidApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  const trimmed = apiKey.trim();
  return trimmed.length >= 10 && trimmed.length <= 100;
}

/**
 * 验证URL格式
 * @param url 待验证的URL
 * @returns 是否为有效URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}