/**
 * @fileoverview 复习主界面组件
 * @module ReviewPage
 * @description 复习系统的主界面，管理复习流程、状态和用户交互
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useReviewData } from '../hooks/useReviewData';
import { useReviewSync } from '../hooks/useReviewSync';
import { useReviewFeedback } from '../hooks/useReviewFeedback';
import { ReviewFeedbackPanel } from '../components/ReviewFeedbackPanel';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
// import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader as ModalHeader, DialogTitle as ModalTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Play
} from 'lucide-react';
// import type { CandidateWord } from '@ai-voca/shared';

interface ReviewPageProps {
  onBack: () => void;
}

export function ReviewPage({ onBack }: ReviewPageProps) {
  const { user, getAccessToken } = useAuth();
  const {
    candidates,
    candidatesLoading,
    candidatesError,
    refreshCandidates,
    getCandidates,
    generatedItems,
    generatedError,
    generateSentences,
    updateUserPrefs,
    saveAutoPrefs,
    loadAutoPrefs,
    reset
  } = useReviewData();
  const { syncStatus } = useReviewSync();
  const { isSubmitting, submitError, submitFeedback, reset: resetFeedback } = useReviewFeedback();

  const [currentStep, setCurrentStep] = useState<'loading' | 'candidates' | 'reviewing' | 'completed'>('loading');
  const [autoMode, setAutoMode] = useState<boolean>(true);
  const [batchSize, setBatchSize] = useState<number>(2);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [prefetchTargets, setPrefetchTargets] = useState<string[] | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  
  const [startingReview, setStartingReview] = useState<boolean>(false);

  // 处理候选词选择
  const handleTargetToggle = (word: string) => {
    setSelectedTargets(prev => {
      if (prev.includes(word)) {
        return prev.filter(w => w !== word);
      } else {
        return [...prev, word].slice(0, 8); // 最多选择8个
      }
    });
  };

  const handleStartReview = async () => {
    if (startingReview) return;
    setStartingReview(true);
    if (autoMode) {
      const trySizes = [batchSize, 2, 1].filter((v, i, a) => a.indexOf(v) === i);
      let autoTargets: string[] = [];
      for (const size of trySizes) {
        if (size <= 0) continue;
        const cand = await getCandidates({ n: size });
        if (cand.length > 0) {
          autoTargets = cand.slice(0, size).map(c => c.word);
          break;
        }
      }
      if (autoTargets.length === 0) {
        alert('当前没有可用的复习词汇，请稍后再试或切换手动选词');
        setStartingReview(false);
        return;
      }
      setSelectedTargets(autoTargets);
      setCurrentStep('reviewing');
      try {
        await generateSentences(autoTargets);
      } finally {
        prefetchNext(autoTargets);
        setStartingReview(false);
      }
    } else {
      if (selectedTargets.length > 0) {
        setCurrentStep('reviewing');
        try {
          await generateSentences(selectedTargets);
        } finally {
          prefetchNext(selectedTargets);
          setStartingReview(false);
        }
      } else {
        setStartingReview(false);
      }
    }
  };

  async function prefetchNext(currentTargets: string[]) {
    try {
      const next = await getCandidates({ n: batchSize, exclude: currentTargets });
      setPrefetchTargets(next.map(c => c.word));
    } catch {
      setPrefetchTargets(null);
    }
  }

  // 处理句子切换
  const handleNextSentence = () => {
    if (currentSentenceIndex < generatedItems.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    } else {
      if (prefetchTargets && prefetchTargets.length > 0) {
        setSelectedTargets(prefetchTargets);
        setPrefetchTargets(null);
        setCurrentSentenceIndex(0);
        generateSentences(prefetchTargets);
        // 进入新一轮后，立即为下一轮预取，避免只进行两轮后结束
        prefetchNext(prefetchTargets);
      } else {
        setCurrentStep('completed');
      }
    }
  };
  // 首次加载：读本地偏好（模式/批次）
  useEffect(() => {
    (async () => {
      // 先读服务端偏好
      try {
        const prefs = await loadAutoPrefs();
        if (prefs) {
          setAutoMode(prefs.auto);
          setBatchSize(prefs.batchSize);
          return;
        }
      } catch {}
      // 兜底读本地
      try {
        const m = localStorage.getItem('review:autoMode');
        if (m) setAutoMode(m !== 'manual');
        const b = localStorage.getItem('review:batchSize');
        if (b) {
          const n = Math.max(1, Math.min(8, parseInt(b)));
          if (!Number.isNaN(n)) setBatchSize(n);
        }
      } catch {}
    })();
  }, [loadAutoPrefs]);

  // 写本地偏好
  useEffect(() => {
    try { localStorage.setItem('review:autoMode', autoMode ? 'auto' : 'manual'); } catch {}
    // 同步到服务端
    (async () => { try { await saveAutoPrefs({ auto: autoMode, batchSize }); } catch {} })();
  }, [autoMode, batchSize, saveAutoPrefs]);
  useEffect(() => {
    try { localStorage.setItem('review:batchSize', String(batchSize)); } catch {}
    (async () => { try { await saveAutoPrefs({ auto: autoMode, batchSize }); } catch {} })();
  }, [batchSize, autoMode, saveAutoPrefs]);

  // 获取今日/总计计数
  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const token = await getAccessToken();
        const resp = await fetch('/api/review/count', { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) return;
        const json = await resp.json();
        if (json?.success && json?.data) {
          setTodayCount(json.data.today_count);
        }
      } catch {}
    })();
  }, [user, getAccessToken]);


  // 处理反馈提交
  const handleSubmitFeedback = async (feedback: any) => {
    const success = await submitFeedback(feedback);
    if (success) {
      handleNextSentence();
    }
  };

  // 处理重新开始
  const handleRestart = () => {
    setCurrentStep('candidates');
    setSelectedTargets([]);
    setCurrentSentenceIndex(0);
    reset();
    resetFeedback();
  };

  // 自动处理状态转换 - 防止无限循环
  useEffect(() => {
    if (syncStatus.isSyncing || candidatesLoading) {
      setCurrentStep('loading');
    } else if (selectedTargets.length === 0) {
      // 无论候选词是否为空，只要不在加载/同步中且未选择目标词，就进入 candidates 界面
      // 避免在候选词为空时卡在“准备复习”界面
      setCurrentStep('candidates');
    }
  }, [syncStatus.isSyncing, candidatesLoading, candidates.length, selectedTargets.length]);

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
  if (currentStep === 'loading' || candidatesLoading || syncStatus.isSyncing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold">准备复习</h2>
              <p className="text-muted-foreground">
                {syncStatus.isSyncing 
                  ? `正在同步 ${syncStatus.syncedWords.length} 个词汇到复习系统...` 
                  : '正在加载复习内容...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 错误状态
  if (candidatesError || generatedError || submitError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold">复习出错</h2>
              <p className="text-muted-foreground">
                {candidatesError || generatedError || submitError}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={onBack} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回
                </Button>
                <Button onClick={submitError ? () => ({}) : () => refreshCandidates()} variant="outline">
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

  // 候选词选择界面（重设计样式）
  if (currentStep === 'candidates') {
    const todayTotal = todayCount ?? 0;
    const completedToday = todayTotal > 0 ? todayTotal : 0; // 暂无完成度数据，先显示满进度
    const progressPercent = todayTotal > 0 ? Math.round((completedToday / todayTotal) * 100) : 0;

    return (
      <div className="min-h-screen bg-background">
        <header className="container py-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{todayCount ?? '-'} 个单词可以复习</h1>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>今日完成度 {completedToday}/{todayTotal}</span>
            </div>
            <Progress value={progressPercent} />
          </div>
        </header>

        <main className="container pb-12 grid gap-6 md:grid-cols-1">
          <section aria-labelledby="review-settings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle id="review-settings" className="text-xl">复习设置</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-right text-lg text-primary hover:underline">高级设置</button>
                    </DialogTrigger>
                    <DialogContent>
                      <ModalHeader>
                        <ModalTitle>高级设置</ModalTitle>
                      </ModalHeader>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label>等级（CEFR）</Label>
                          <div className="flex gap-2 flex-wrap">
                            {(['A2','B1','B2','C1'] as const).map(level => (
                              <Button
                                key={level}
                                variant="outline"
                                size="sm"
                                onClick={() => updateUserPrefs({ level_cefr: level })}
                              >{level}</Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>风格</Label>
                          <div className="flex gap-2 flex-wrap">
                            {(['neutral','news','dialog','academic'] as const).map(style => (
                              <Button
                                key={style}
                                variant="outline"
                                size="sm"
                                onClick={() => updateUserPrefs({ style })}
                              >{style}</Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="space-y-2">
                  <Label>选择模式</Label>
                  <Tabs value={autoMode ? 'auto' : 'manual'} onValueChange={(v) => setAutoMode(v === 'auto')}>
                    <TabsList className="w-full">
                      <TabsTrigger value="auto" className="w-full">自动选词</TabsTrigger>
                      <TabsTrigger value="manual" className="w-full">手动选词</TabsTrigger>
                    </TabsList>
                    <TabsContent value="auto" className="text-sm text-muted-foreground">
                      系统将按算法自动挑选合适的单词。
                    </TabsContent>
                    <TabsContent value="manual" className="text-sm text-muted-foreground">
                      你可以自行从词库中挑选将要复习的单词。
                    </TabsContent>
                  </Tabs>
                </div>

                {autoMode && (
                  <div className="space-y-2">
                    <Label htmlFor="target">每轮目标词数</Label>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" size="sm" aria-label="减少目标词数" onClick={() => setBatchSize(Math.max(1, batchSize - 1))}>-</Button>
                      <Input
                        id="target"
                        inputMode="numeric"
                        value={batchSize}
                        onChange={(e) => setBatchSize(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
                        aria-label="每轮目标词数"
                        className="w-24 text-center"
                      />
                      <Button type="button" variant="secondary" size="sm" aria-label="增加目标词数" onClick={() => setBatchSize(Math.min(8, batchSize + 1))}>+</Button>
                    </div>
                  </div>
                )}

                {/* 手动选词：放入同一卡片内，贴合层级结构 */}
                {!autoMode && (
                  <div className="space-y-3">
                    {/* 说明文案已在 TabsContent 中呈现，这里直接展示 Chips 与计数 */}
                    <div className="flex flex-wrap gap-3">
                      {candidates.slice(0, 50).map((candidate) => (
                        <CandidateWordChip
                          key={candidate.word}
                          text={candidate.word}
                          selected={selectedTargets.includes(candidate.word)}
                          onClick={() => handleTargetToggle(candidate.word)}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">已选择 {selectedTargets.length} 个</div>
                  </div>
                )}

                {/* 高级设置已移入弹窗 */}

                <div className="pt-2">
                  <Button
                    size="lg"
                    className="w-full inline-flex items-center justify-center gap-2"
                    onClick={handleStartReview}
                    disabled={startingReview || (!autoMode && selectedTargets.length === 0)}
                  >
                    {startingReview ? (<><Loader2 className="w-4 h-4 animate-spin" /> 正在开始...</>) : '开始复习'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
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
      <ReviewFeedbackPanel
        item={currentItem}
        currentIndex={currentSentenceIndex}
        totalSentences={generatedItems.length}
        isSubmitting={isSubmitting}
        onSubmitFeedback={handleSubmitFeedback}
        onNextSentence={handleNextSentence}
        onPreviousSentence={currentSentenceIndex > 0 ? () => setCurrentSentenceIndex(currentSentenceIndex - 1) : undefined}
      />
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

// 旧的卡片样式已弃用

/**
 * 胶囊样式的候选词Chip
 */
function CandidateWordChip({
  text,
  selected,
  onClick,
}: {
  text: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-sm transition-colors select-none ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/40 hover:bg-accent border-border text-foreground'
      }`}
    >
      {text}
    </button>
  );
}

export default ReviewPage; 