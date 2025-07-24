/**
 * @fileoverview 单词查询表单组件
 * @module WordQueryForm
 * @description 提供单词输入、验证和查询提交功能的表单组件
 */

import { useState, FormEvent } from 'react';
import { isValidWord } from '@ai-voca/shared';
import { 
  Sparkles,
  BookOpen,
  Languages,
  Lightbulb
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { EnhancedSearchInput } from './ui/enhanced-search-input';

interface WordQueryFormProps {
  onQuery: (word: string) => void;
  loading: boolean;
  onClear: () => void;
}

export function WordQueryForm({ onQuery, loading, onClear: _ }: WordQueryFormProps) {
  // onClear prop保留以维持接口兼容性，但在新设计中未使用
  const [word, setWord] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleSearch = () => {
    if (!word.trim()) {
      setError('请输入要查询的单词');
      return;
    }
    
    if (!isValidWord(word)) {
      setError('请输入有效的单词（仅支持字母、数字、连字符和空格）');
      return;
    }
    
    setError('');
    onQuery(word.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };



  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 p-4 pb-20 md:pb-4 h-full flex flex-col justify-center">
      {/* Search Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-gradient animate-fade-in">智能单词查询</h1>
        <p className="text-muted-foreground text-lg animate-slide-up">
          输入任何英文单词，获得AI驱动的深度解释
        </p>
      </div>

      {/* Enhanced Search Form */}
      <form onSubmit={handleSubmit} className="space-y-6 w-full animate-scale-in">
        <EnhancedSearchInput
          value={word}
          onChange={(value) => setWord(value)}
          onKeyPress={handleKeyPress}
          onSearch={handleSearch}
          placeholder="输入英文单词..."
          loading={loading}
          disabled={loading}
        />
        
        {error && (
          <div className="text-center animate-fade-in">
            <div className="inline-block p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          </div>
        )}
      </form>

      {/* Quick Start Tips */}
      <Card className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-primary/20 hover-lift animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <span>使用技巧</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <BookOpen className="w-4 h-4 mt-0.5 text-primary/60 flex-shrink-0" />
                <span>支持词形变化查询（如 running → run）</span>
              </div>
              <div className="flex items-start space-x-2">
                <Languages className="w-4 h-4 mt-0.5 text-primary/60 flex-shrink-0" />
                <span>提供多层次的单词解释</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 mt-0.5 text-primary/60 flex-shrink-0" />
                <span>包含词源和记忆技巧</span>
              </div>
              <div className="flex items-start space-x-2">
                <Sparkles className="w-4 h-4 mt-0.5 text-primary/60 flex-shrink-0" />
                <span>一键收藏重要单词</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}