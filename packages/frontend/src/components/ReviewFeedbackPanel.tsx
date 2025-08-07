/**
 * @fileoverview 复习反馈面板组件
 * @module ReviewFeedbackPanel
 * @description 集成词汇反馈卡片到句子展示界面，实现完整的复习反馈闭环
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { WordFeedbackGrid } from './WordFeedbackGrid';
import { SentenceDisplay } from './SentenceDisplay';
import { 
  Send,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import type { GeneratedItem, Rating } from '@ai-voca/shared';

interface ReviewFeedbackPanelProps {
  /** 当前句子数据 */
  item: GeneratedItem;
  /** 句子索引 */
  currentIndex: number;
  /** 总句子数量 */
  totalSentences: number;
  /** 是否正在提交 */
  isSubmitting?: boolean;
  /** 提交反馈 */
  onSubmitFeedback: (feedback: ReviewFeedback) => void;
  /** 下一句 */
  onNextSentence: () => void;
  /** 上一句 */
  onPreviousSentence?: () => void;
}

export interface ReviewFeedback {
  /** 词汇反馈 */
  wordFeedback: Record<string, Rating>;
  /** 整体难度反馈 */
  difficultyFeedback: 'too_easy' | 'ok' | 'too_hard' | null;
  /** 句子ID */
  sentenceId: string;
  /** 目标词汇 */
  targets: string[];
}

interface DifficultyFeedbackProps {
  feedback: 'too_easy' | 'ok' | 'too_hard' | null;
  onFeedback: (feedback: 'too_easy' | 'ok' | 'too_hard') => void;
}

/**
 * 整体难度反馈组件
 */
function DifficultyFeedback({ feedback, onFeedback }: DifficultyFeedbackProps) {
  const options = [
    { value: 'too_easy' as const, label: '太简单', emoji: '😊', color: 'text-green-600' },
    { value: 'ok' as const, label: '合适', emoji: '😌', color: 'text-blue-600' },
    { value: 'too_hard' as const, label: '太难', emoji: '😅', color: 'text-orange-600' }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          整体难度反馈
        </h3>
        <p className="text-sm text-muted-foreground">
          您觉得这句话的整体难度如何？
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={feedback === option.value ? 'default' : 'outline'}
            size="lg"
            className={`flex flex-col items-center gap-1 h-auto py-3 transition-all duration-200 ${
              feedback === option.value
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:scale-105'
            }`}
            onClick={() => onFeedback(option.value)}
          >
            <span className="text-2xl">{option.emoji}</span>
            <span className="text-sm font-medium">{option.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * 复习进度显示
 */
function ReviewProgress({ current, total }: { current: number; total: number }) {
  const progress = (current / total) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">复习进度</span>
        <span className="text-sm text-muted-foreground">
          {current} / {total}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

/**
 * 复习反馈面板
 */
export function ReviewFeedbackPanel({
  item,
  currentIndex,
  totalSentences,
  isSubmitting = false,
  onSubmitFeedback,
  onNextSentence,
  onPreviousSentence
}: ReviewFeedbackPanelProps) {
  const [wordFeedback, setWordFeedback] = useState<Record<string, Rating>>({});
  const [difficultyFeedback, setDifficultyFeedback] = useState<'too_easy' | 'ok' | 'too_hard' | null>(null);

  // 获取当前句子的目标词汇
  const targetWords = item.targets.map(target => target.word);

  // 计算完成度
  const isWordFeedbackComplete = Object.keys(wordFeedback).length === targetWords.length;
  const isDifficultyFeedbackComplete = difficultyFeedback !== null;
  const isFeedbackComplete = isWordFeedbackComplete && isDifficultyFeedbackComplete;


  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            {onPreviousSentence && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPreviousSentence}
                disabled={currentIndex === 0}
                className="flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>上一句</span>
              </Button>
            )}
          </div>

          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold">词汇复习</h1>
            <p className="text-xs text-muted-foreground">
              句子 {currentIndex + 1} / {totalSentences}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextSentence}
              disabled={!isFeedbackComplete}
              className="flex items-center space-x-1"
            >
              <span>下一句</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* 进度条 */}
        <ReviewProgress current={currentIndex + 1} total={totalSentences} />

        {/* 句子展示 */}
        <Card className="glass hover-lift border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <SentenceDisplay
              item={item}
              showNewTerms={true}
              expandable={true}
            />
          </CardContent>
        </Card>

        {/* 词汇反馈卡片 */}
        <Card className="glass hover-lift border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              词汇反馈
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              请对每个目标词汇进行评分
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <WordFeedbackGrid
              words={targetWords}
              onSubmitFeedback={(feedback) => {
                setWordFeedback(feedback);
              }}
              showDefinitions={false}
              showSubmitButton={false}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* 整体难度反馈 */}
        <Card className="glass hover-lift border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <DifficultyFeedback
              feedback={difficultyFeedback}
              onFeedback={setDifficultyFeedback}
            />
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={() => {
              if (isFeedbackComplete) {
                onSubmitFeedback({
                  wordFeedback,
                  difficultyFeedback,
                  sentenceId: item.sid,
                  targets: targetWords
                });
              }
            }}
            disabled={!isFeedbackComplete || isSubmitting}
            className="flex items-center gap-2 hover-scale transition-all duration-300 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {currentIndex === totalSentences - 1 ? '完成复习' : '提交并继续'}
              </>
            )}
          </Button>
        </div>

        {/* 提示信息 */}
        {!isFeedbackComplete && (
          <div className="text-center text-sm text-muted-foreground">
            {isWordFeedbackComplete ? (
              "请选择整体难度反馈"
            ) : (
              `请完成所有 ${targetWords.length} 个词汇的评分`
            )}
          </div>
        )}
      </div>
    </div>
  );
}