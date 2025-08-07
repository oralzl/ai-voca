/**
 * @fileoverview 词汇反馈卡片组件
 * @module WordFeedbackCard
 * @description 为单个词汇提供评分反馈的交互式卡片组件
 */

import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import type { Rating } from '@ai-voca/shared';

interface WordFeedbackCardProps {
  /** 词汇文本 */
  word: string;
  /** 当前反馈状态 */
  feedback: Rating | undefined;
  /** 反馈状态改变时的回调 */
  onFeedback: (rating: Rating) => void;
  /** 是否禁用交互 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否显示单词释义 */
  showDefinition?: boolean;
  /** 单词定义或释义 */
  definition?: string;
}

interface RatingOption {
  value: Rating;
  label: string;
  emoji: string;
  variant: "destructive" | "secondary" | "default" | "outline";
  color: string;
}

const ratingOptions: RatingOption[] = [
  {
    value: 'again',
    label: '不记得',
    emoji: '😵',
    variant: 'destructive',
    color: 'text-red-500'
  },
  {
    value: 'hard',
    label: '困难',
    emoji: '🤔',
    variant: 'secondary',
    color: 'text-orange-500'
  },
  {
    value: 'good',
    label: '良好',
    emoji: '😊',
    variant: 'default',
    color: 'text-green-500'
  },
  {
    value: 'easy',
    label: '容易',
    emoji: '😎',
    variant: 'outline',
    color: 'text-blue-500'
  },
  {
    value: 'unknown',
    label: '不熟悉',
    emoji: '🤷',
    variant: 'secondary',
    color: 'text-purple-500'
  }
];

export function WordFeedbackCard({
  word,
  feedback,
  onFeedback,
  disabled = false,
  className,
  showDefinition = false,
  definition
}: WordFeedbackCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleRatingClick = (rating: Rating) => {
    if (!disabled) {
      onFeedback(rating);
    }
  };

  const getRatingColor = (selectedRating: Rating | undefined) => {
    if (!selectedRating) return 'border-border';
    const option = ratingOptions.find(opt => opt.value === selectedRating);
    return option?.color || 'border-border';
  };

  return (
    <Card 
      className={cn(
        "glass hover-lift border-0 shadow-sm transition-all duration-300",
        "hover:shadow-md hover:shadow-primary/10",
        isHovered && "transform hover:-translate-y-1",
        disabled && "opacity-60 cursor-not-allowed",
        getRatingColor(feedback),
        className
      )}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
    >
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* 单词标题 */}
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {word}
          </h3>
          {feedback && (
            <Badge 
              variant={ratingOptions.find(opt => opt.value === feedback)?.variant as any}
              className="text-xs px-2 py-1"
            >
              {ratingOptions.find(opt => opt.value === feedback)?.emoji}
            </Badge>
          )}
        </div>

        {/* 单词释义 */}
        {showDefinition && definition && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {definition}
          </p>
        )}

        {/* 评分按钮 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ratingOptions.map((option) => {
            const isSelected = feedback === option.value;
            const isDisabled = disabled;

            return (
              <Button
                key={option.value}
                variant={isSelected ? 'default' : option.variant}
                size="sm"
                className={cn(
                  "text-xs sm:text-sm transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  "focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                  isSelected && "shadow-md shadow-primary/25",
                  isDisabled && "cursor-not-allowed opacity-60"
                )}
                onClick={() => handleRatingClick(option.value)}
                disabled={isDisabled}
                aria-label={`${option.label} - ${option.emoji}`}
              >
                <span className="flex items-center gap-1">
                  <span className="text-sm">{option.emoji}</span>
                  <span className="hidden sm:inline">{option.label}</span>
                </span>
              </Button>
            );
          })}
        </div>

        {/* 评分提示 */}
        {feedback && (
          <div className="text-xs text-center text-muted-foreground">
            {ratingOptions.find(opt => opt.value === feedback)?.label}已选择
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 导出类型供外部使用
export type { WordFeedbackCardProps };