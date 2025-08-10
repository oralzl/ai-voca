/**
 * @fileoverview FSRS 算法使用示例
 * @description 展示如何使用 FSRS 算法的各种功能
 * @author thiskee
 * 
 * 任务 2.1 实现
 * 提供 FSRS 算法的使用示例和最佳实践
 */

import { 
  fsrsUpdate, 
  initializeWordState, 
  isDueToday, 
  getReviewPriority, 
  getReviewStats,
  validateWordState,
  formatInterval
} from './fsrs';
import type { WordState, Rating } from '@ai-voca/shared';

/**
 * 示例：新词汇的完整复习流程
 */
export function demonstrateNewWordFlow() {
  console.log('=== 新词汇复习流程示例 ===');
  
  const now = new Date();
  
  // 1. 初始化新词汇状态
  const initialState = initializeWordState(now);
  console.log('初始状态:', initialState);
  
  // 2. 第一次复习 - 用户回答 "good"
  const firstReview = fsrsUpdate(initialState, 'good', now);
  console.log('第一次复习后 (good):', firstReview.next);
  
  // 3. 模拟3天后再次复习 - 用户回答 "again"
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const secondReview = fsrsUpdate(firstReview.next, 'again', threeDaysLater);
  console.log('第二次复习后 (again):', secondReview.next);
  
  // 4. 检查是否需要复习
  console.log('今天需要复习吗?', isDueToday(secondReview.next, threeDaysLater));
  
  // 5. 获取复习统计
  const stats = getReviewStats(secondReview.next);
  console.log('复习统计:', stats);
}

/**
 * 示例：不同评分的间隔变化
 */
export function demonstrateIntervalChanges() {
  console.log('\n=== 不同评分的间隔变化示例 ===');
  
  const now = new Date();
  const initialState = initializeWordState(now);
  
  const ratings: Rating[] = ['again', 'hard', 'good', 'easy'];
  
  ratings.forEach(rating => {
    const result = fsrsUpdate(initialState, rating, now);
    const intervalDays = Math.floor(
      (new Date(result.next.next_due_at!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    
    console.log(`${rating}: ${formatInterval(intervalDays)} (熟悉度: ${result.next.familiarity})`);
  });
}

/**
 * 示例：优先级计算
 */
export function demonstratePriorityCalculation() {
  console.log('\n=== 优先级计算示例 ===');
  
  const now = new Date();
  
  // 创建不同状态的词汇
  const words: WordState[] = [
    // 新词汇
    { familiarity: 0, difficulty: 2.5, successes: 0, lapses: 0 },
    // 过期1天的词汇
    { 
      familiarity: 2, 
      difficulty: 2.5, 
      successes: 5, 
      lapses: 2,
      next_due_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    },
    // 过期3天的词汇
    { 
      familiarity: 1, 
      difficulty: 2.5, 
      successes: 3, 
      lapses: 3,
      next_due_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    // 高熟悉度但过期的词汇
    { 
      familiarity: 5, 
      difficulty: 2.5, 
      successes: 15, 
      lapses: 1,
      next_due_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  words.forEach((word, index) => {
    const priority = getReviewPriority(word, now);
    const isDue = isDueToday(word, now);
    console.log(`词汇 ${index + 1}: 优先级=${priority}, 今天需要复习=${isDue}`);
  });
}

/**
 * 示例：状态验证
 */
export function demonstrateValidation() {
  console.log('\n=== 状态验证示例 ===');
  
  const validState: WordState = {
    familiarity: 3,
    difficulty: 2.5,
    successes: 5,
    lapses: 2,
    last_seen_at: new Date().toISOString(),
    next_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  
  const invalidState: WordState = {
    familiarity: 6, // 超出范围
    difficulty: 2.5,
    successes: -1, // 负数
    lapses: 2,
    last_seen_at: 'invalid-date',
  };
  
  console.log('有效状态验证:', validateWordState(validState));
  console.log('无效状态验证:', validateWordState(invalidState));
}

/**
 * 运行所有示例
 */
export function runAllExamples() {
  demonstrateNewWordFlow();
  demonstrateIntervalChanges();
  demonstratePriorityCalculation();
  demonstrateValidation();
}

// 如果直接运行此文件，执行所有示例
if (require.main === module) {
  runAllExamples();
} 