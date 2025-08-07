/**
 * @fileoverview WordFeedbackCard组件测试
 * @module WordFeedbackCard.test
 * @description 测试词汇反馈卡片组件的核心功能
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { WordFeedbackCard } from './WordFeedbackCard';
import type { Rating } from '@ai-voca/shared';

describe('WordFeedbackCard', () => {
  const mockOnFeedback = jest.fn();

  beforeEach(() => {
    mockOnFeedback.mockClear();
  });

  it('应该正确渲染单词', () => {
    render(
      <WordFeedbackCard 
        word="example" 
        feedback={undefined} 
        onFeedback={mockOnFeedback} 
      />
    );

    expect(screen.getByText('example')).toBeInTheDocument();
  });

  it('应该显示所有评分选项', () => {
    render(
      <WordFeedbackCard 
        word="test" 
        feedback={undefined} 
        onFeedback={mockOnFeedback} 
      />
    );

    expect(screen.getByText('😵')).toBeInTheDocument();
    expect(screen.getByText('🤔')).toBeInTheDocument();
    expect(screen.getByText('😊')).toBeInTheDocument();
    expect(screen.getByText('😎')).toBeInTheDocument();
    expect(screen.getByText('🤷')).toBeInTheDocument();
  });

  it('应该调用onFeedback回调当按钮被点击', () => {
    render(
      <WordFeedbackCard 
        word="test" 
        feedback={undefined} 
        onFeedback={mockOnFeedback} 
      />
    );

    const goodButton = screen.getByText('😊').closest('button');
    fireEvent.click(goodButton!);

    expect(mockOnFeedback).toHaveBeenCalledWith('good');
  });

  it('应该显示已选择的评分状态', () => {
    render(
      <WordFeedbackCard 
        word="test" 
        feedback="easy" 
        onFeedback={mockOnFeedback} 
      />
    );

    expect(screen.getByText('容易已选择')).toBeInTheDocument();
  });

  it('应该显示单词定义当提供时', () => {
    render(
      <WordFeedbackCard 
        word="test" 
        feedback={undefined} 
        onFeedback={mockOnFeedback} 
        showDefinition={true}
        definition="A procedure intended to establish the quality, performance, or reliability of something."
      />
    );

    expect(screen.getByText(/A procedure intended to establish/)).toBeInTheDocument();
  });

  it('应该禁用交互当disabled为true', () => {
    render(
      <WordFeedbackCard 
        word="test" 
        feedback={undefined} 
        onFeedback={mockOnFeedback} 
        disabled={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('应该应用自定义类名', () => {
    const { container } = render(
      <WordFeedbackCard 
        word="test" 
        feedback={undefined} 
        onFeedback={mockOnFeedback} 
        className="custom-test-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-test-class');
  });

  it('应该正确显示评分徽章', () => {
    render(
      <WordFeedbackCard 
        word="test" 
        feedback="good" 
        onFeedback={mockOnFeedback} 
      />
    );

    expect(screen.getByText('😊')).toBeInTheDocument();
  });
});