/**
 * @fileoverview SentenceDisplay组件测试
 * @module SentenceDisplay.test
 * @description 测试句子展示组件的核心功能
 */

import { render, screen } from '@testing-library/react';
import { SentenceDisplay } from './SentenceDisplay';
import type { GeneratedItem } from '@ai-voca/shared';

// 模拟数据
const mockGeneratedItem: GeneratedItem = {
  sid: 'test-sentence-1',
  text: 'The quick brown fox jumps over the lazy dog.',
  translation: '敏捷的棕色狐狸跳过了懒惰的狗。',
  targets: [
    { word: 'quick', begin: 4, end: 9 },
    { word: 'fox', begin: 16, end: 19 },
    { word: 'lazy', begin: 35, end: 39 }
  ],
  self_eval: {
    predicted_cefr: 'B1',
    estimated_new_terms_count: 2,
    new_terms: [
      {
        surface: 'jumps',
        cefr: 'A2',
        gloss: '跳跃'
      },
      {
        surface: 'over',
        cefr: 'A1',
        gloss: '越过'
      }
    ],
    reason: '生成包含多个目标词的简单句子'
  }
};

describe('SentenceDisplay', () => {
  it('应该正确渲染组件', () => {
    render(<SentenceDisplay item={mockGeneratedItem} />);
    
    // 检查组件是否正常渲染
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('应该显示目标词标签', () => {
    render(<SentenceDisplay item={mockGeneratedItem} />);
    
    // 使用getAllByText来获取所有匹配的元素
    const quickElements = screen.getAllByText('quick');
    const foxElements = screen.getAllByText('fox');
    const lazyElements = screen.getAllByText('lazy');
    
    expect(quickElements.length).toBeGreaterThan(0);
    expect(foxElements.length).toBeGreaterThan(0);
    expect(lazyElements.length).toBeGreaterThan(0);
  });

  it('应该显示难度等级', () => {
    render(<SentenceDisplay item={mockGeneratedItem} />);
    
    expect(screen.getByText('B1')).toBeInTheDocument();
  });

  it('应该显示新词汇数量', () => {
    render(<SentenceDisplay item={mockGeneratedItem} />);
    
    expect(screen.getByText('+2 新词')).toBeInTheDocument();
  });

  it('应该显示新词汇提示按钮', () => {
    render(<SentenceDisplay item={mockGeneratedItem} showNewTerms={true} />);
    
    expect(screen.getByText('2 个新词')).toBeInTheDocument();
  });

  it('应该在没有新词汇时不显示提示', () => {
    const itemWithoutNewTerms: GeneratedItem = {
      ...mockGeneratedItem,
      self_eval: {
        ...mockGeneratedItem.self_eval,
        estimated_new_terms_count: 0,
        new_terms: []
      }
    };
    
    render(<SentenceDisplay item={itemWithoutNewTerms} showNewTerms={true} />);
    
    expect(screen.queryByText(/个新词/)).not.toBeInTheDocument();
  });

  it('应该应用自定义样式类', () => {
    const { container } = render(
      <SentenceDisplay item={mockGeneratedItem} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
}); 