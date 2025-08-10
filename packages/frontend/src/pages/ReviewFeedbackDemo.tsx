/**
 * @fileoverview 词汇反馈演示页面
 * @module ReviewFeedbackDemo
 * @description 展示词汇反馈卡片组件的使用示例
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { WordFeedbackGrid } from '../components/WordFeedbackGrid';
import { WordFeedbackCard } from '../components/WordFeedbackCard';
import { RefreshCw } from 'lucide-react';
import type { Rating } from '@ai-voca/shared';

export function ReviewFeedbackDemo() {
  const [selectedDemo, setSelectedDemo] = useState<'single' | 'grid' | 'interactive'>('single');
  const [singleWordFeedback, setSingleWordFeedback] = useState<Rating | undefined>(undefined);
  const [gridFeedback, setGridFeedback] = useState<Record<string, Rating>>({});

  const demoWords = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
  const demoDefinitions = {
    'apple': 'A round fruit with firm, white flesh and a green or red skin.',
    'banana': 'A long curved fruit with a yellow skin and soft, sweet flesh.',
    'cherry': 'A small, round, red or black fruit with a stone inside.',
    'date': 'A sweet, dark brown fruit with a long seed, from a type of palm tree.',
    'elderberry': 'A small, dark purple berry used in cooking and traditional medicine.'
  };

  const handleReset = () => {
    setSingleWordFeedback(undefined);
    setGridFeedback({});
  };

  const handleGridSubmit = (feedback: Record<string, Rating>) => {
    console.log('Grid feedback submitted:', feedback);
    alert(`已提交 ${Object.keys(feedback).length} 个词汇的评分！`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="glass border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              词汇反馈卡片演示
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* 演示选择器 */}
            <div className="flex flex-wrap gap-2">
              {(['single', 'grid', 'interactive'] as const).map((demo) => (
                <Button
                  key={demo}
                  variant={selectedDemo === demo ? 'default' : 'outline'}
                  onClick={() => setSelectedDemo(demo)}
                  className="hover-scale transition-all duration-200"
                >
                  {demo === 'single' ? '单个卡片' : demo === 'grid' ? '网格布局' : '交互演示'}
                </Button>
              ))}
              <Button
                variant="ghost"
                onClick={handleReset}
                className="hover-scale transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重置
              </Button>
            </div>

            {/* 单个卡片演示 */}
            {selectedDemo === 'single' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">单个卡片示例</h3>
                <div className="max-w-md mx-auto">
                  <WordFeedbackCard
                    word="example"
                    feedback={singleWordFeedback}
                    onFeedback={setSingleWordFeedback}
                    showDefinition={true}
                    definition="A thing characteristic of its kind or illustrating a general rule."
                  />
                </div>
                <div className="text-center text-muted-foreground">
                  当前评分: {singleWordFeedback || '未评分'}
                </div>
              </div>
            )}

            {/* 网格布局演示 */}
            {selectedDemo === 'grid' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">网格布局示例</h3>
                <WordFeedbackGrid
                  words={demoWords.slice(0, 3)}
                  onSubmitFeedback={handleGridSubmit}
                  showDefinitions={true}
                  definitions={demoDefinitions}
                />
              </div>
            )}

            {/* 交互演示 */}
            {selectedDemo === 'interactive' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">交互演示</h3>
                <WordFeedbackGrid
                  words={demoWords}
                  onSubmitFeedback={handleGridSubmit}
                  showDefinitions={true}
                  definitions={demoDefinitions}
                />
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">当前评分状态：</h4>
                  <pre className="text-sm text-muted-foreground overflow-auto">
                    {JSON.stringify(gridFeedback, null, 2)}
                  </pre>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card className="glass border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              组件使用说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-2">
              <li><strong>WordFeedbackCard</strong>：单个词汇的反馈卡片，支持5种评分等级</li>
              <li><strong>WordFeedbackGrid</strong>：多个词汇的网格布局，支持批量评分</li>
              <li>支持显示单词释义和进度跟踪</li>
              <li>响应式设计，适配移动端和桌面端</li>
              <li>动画效果和状态反馈</li>
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default ReviewFeedbackDemo;