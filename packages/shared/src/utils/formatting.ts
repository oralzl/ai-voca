/**
 * @fileoverview 格式化工具函数
 * @module utils/formatting
 * @description 提供时间格式化函数
 */

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