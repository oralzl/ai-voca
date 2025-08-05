/**
 * @fileoverview 复习主界面组件
 * @module ReviewPage
 * @description 复习系统的主界面，管理复习流程、状态和用户交互
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useReviewData } from '../hooks/useReviewData';
import { SentenceDisplay } from '../components/SentenceDisplay';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Play,
  SkipForward
} from 'lucide-react';
import type { CandidateWord } from '@ai-voca/shared';

interface ReviewPageProps {
  onBack: () => void;
}

export function ReviewPage({ onBack }: ReviewPageProps) {
  const { user } = useAuth();
  const {
    candidates,
    candidatesLoading,
    candidatesError,
    refreshCandidates,
    generatedItems,
    generatedLoading,
    generatedError,
    generateSentences,
    userPrefs,
    reset
  } = useReviewData();

  const [currentStep, setCurrentStep] = useState<'loading' | 'candidates' | 'reviewing' | 'completed'>('loading');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  // 处理候选词选择
  const handleTargetSelection = (targets: string[]) => {
    setSelectedTargets(targets);
    setCurrentStep('reviewing');
    generateSentences(targets);
  };

  // 处理句子切换
  const handleNextSentence = () => {
    if (currentSentenceIndex < generatedItems.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    } else {
      setCurrentStep('completed');
    }
  };

  // 处理重新开始
  const handleRestart = () => {
    setCurrentStep('candidates');
    setSelectedTargets([]);
    setCurrentSentenceIndex(0);
    reset();
  };

  // 自动处理状态转换
  useEffect(() => {
    if (candidatesLoading) {
      setCurrentStep('loading');
    } else if (candidatesError) {
      setCurrentStep('loading');
    } else if (candidates.length > 0 && currentStep === 'loading') {
      setCurrentStep('candidates');
    } else if (generatedItems.length > 0 && currentStep === 'reviewing') {
      // 保持在reviewing状态
    }
  }, [candidatesLoading, candidatesError, candidates.length, generatedItems.length, currentStep]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold">需要登录</h2>
              <p className="text-muted-foreground">请先登录以使用复习功能</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 加载状态
  if (currentStep === 'loading' || candidatesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold">准备复习</h2>
              <p className="text-muted-foreground">正在加载复习内容...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 错误状态
  if (candidatesError || generatedError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold">复习出错</h2>
              <p className="text-muted-foreground">
                {candidatesError || generatedError}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={onBack} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回
                </Button>
                <Button onClick={refreshCandidates} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重试
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 候选词选择界面
  if (currentStep === 'candidates') {
    return (
      <div className="min-h-screen bg-background">
        {/* 顶部导航 */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </Button>
            
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">词汇复习</h1>
            </div>
            
            <div className="w-16" /> {/* 占位 */}
          </div>
        </div>

        {/* 主要内容 */}
        <div className="p-4 space-y-4">
          {/* 统计信息 */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">今日复习</h2>
                <p className="text-muted-foreground">
                  发现 {candidates.length} 个需要复习的词汇
                </p>
                {userPrefs && (
                  <div className="flex justify-center gap-2">
                    <Badge variant="outline">
                      等级: {userPrefs.level_cefr}
                    </Badge>
                    <Badge variant="outline">
                      风格: {userPrefs.style}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 候选词列表 */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">选择要复习的词汇</h3>
                <p className="text-sm text-muted-foreground">
                  最多选择 8 个词汇进行复习
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {candidates.slice(0, 12).map((candidate, index) => (
                    <CandidateWordCard
                      key={candidate.word}
                      candidate={candidate}
                      onSelect={() => {
                        const targets = [candidate.word];
                        handleTargetSelection(targets);
                      }}
                    />
                  ))}
                </div>

                {candidates.length > 12 && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      还有 {candidates.length - 12} 个词汇...
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 复习进行中
  if (currentStep === 'reviewing') {
    const currentItem = generatedItems[currentSentenceIndex];
    
    if (!currentItem) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <h2 className="text-xl font-semibold">生成复习内容</h2>
                <p className="text-muted-foreground">正在生成包含目标词汇的句子...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        {/* 顶部导航 */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </Button>
            
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">词汇复习</h1>
              <p className="text-xs text-muted-foreground">
                {currentSentenceIndex + 1} / {generatedItems.length}
              </p>
            </div>
            
            <div className="w-16" /> {/* 占位 */}
          </div>
        </div>

        {/* 主要内容 */}
        <div className="p-4 space-y-4">
          {/* 句子展示 */}
          <SentenceDisplay
            item={currentItem}
            showNewTerms={true}
            expandable={true}
          />

          {/* 操作按钮 */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleNextSentence}
              className="flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              下一句
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 复习完成
  if (currentStep === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">复习完成</h2>
              <p className="text-muted-foreground">
                已完成 {generatedItems.length} 个句子的复习
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={onBack} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回
                </Button>
                <Button onClick={handleRestart}>
                  <Play className="w-4 h-4 mr-2" />
                  继续复习
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

/**
 * 候选词卡片组件
 */
function CandidateWordCard({ 
  candidate, 
  onSelect 
}: { 
  candidate: CandidateWord; 
  onSelect: () => void;
}) {
  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="text-center space-y-2">
          <div className="font-semibold text-sm">{candidate.word}</div>
          <div className="flex justify-center gap-1">
            <Badge variant="outline" className="text-xs">
              熟悉度: {candidate.state.familiarity}/5
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReviewPage; 