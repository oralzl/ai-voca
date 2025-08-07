/**
 * @fileoverview 词汇反馈网格组件
 * @module WordFeedbackGrid
 * @description 展示多个词汇反馈卡片，支持批量评分
 */

import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { WordFeedbackCard } from './WordFeedbackCard';
import { CheckCircle } from 'lucide-react';
import type { Rating } from '@ai-voca/shared';

interface WordFeedbackGridProps {
  /** 词汇列表 */
  words: string[];
  /** 提交反馈时的回调 */
  onSubmitFeedback: (feedback: Record<string, Rating>) => void;
  /** 是否显示提交按钮 */
  showSubmitButton?: boolean;
  /** 是否显示单词释义 */
  showDefinitions?: boolean;
  /** 单词释义映射 */
  definitions?: Record<string, string>;
  /** 是否正在提交 */
  isSubmitting?: boolean;
}

export function WordFeedbackGrid({
  words,
  onSubmitFeedback,
  showSubmitButton = true,
  showDefinitions = false,
  definitions = {},
  isSubmitting = false
}: WordFeedbackGridProps) {
  const [wordFeedback, setWordFeedback] = useState<Record<string, Rating>>({});

  const handleWordFeedback = (word: string, rating: Rating) => {
    setWordFeedback(prev => ({
      ...prev,
      [word]: rating
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(wordFeedback).length === words.length) {
      onSubmitFeedback(wordFeedback);
    }
  };

  const isComplete = Object.keys(wordFeedback).length === words.length;
  const progress = (Object.keys(wordFeedback).length / words.length) * 100;

  return (
    <div className="space-y-6">
      {/* 进度条 */}
      {words.length > 1 && (
        <Card className="glass border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                评分进度
              </span>
              <span className="text-sm text-muted-foreground">
                {Object.keys(wordFeedback).length} / {words.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 词汇网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {words.map((word) => (
          <WordFeedbackCard
            key={word}
            word={word}
            feedback={wordFeedback[word]}
            onFeedback={(rating) => handleWordFeedback(word, rating)}
            disabled={isSubmitting}
            showDefinition={showDefinitions}
            definition={definitions[word]}
          />
        ))}
      </div>

      {/* 提交按钮 */}
      {showSubmitButton && (
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            className={cn(
              "hover-scale transition-all duration-300 shadow-lg",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isComplete
                ? "bg-gradient-to-r from-primary to-primary/80"
                : "bg-muted text-muted-foreground"
            )}
            onClick={handleSubmit}
            disabled={!isComplete || isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>提交中...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{isComplete ? '提交评分' : '请完成所有评分'}</span>
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// 导出类型供外部使用
export type { WordFeedbackGridProps };