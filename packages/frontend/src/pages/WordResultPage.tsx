/**
 * @fileoverview 单词结果页面组件
 * @module WordResultPage  
 * @description 独立的单词查询结果页面，包含完整的页面级交互和导航
 */

import { useState, useEffect } from 'react';
import { WordQueryResponse } from '@ai-voca/shared';
import { WordResult } from '../components/WordResult';
import { EnhancedSearchInput } from '../components/ui/enhanced-search-input';
import { Button } from '../components/ui/button';
import { useFavorites } from '../hooks/useFavorites';
import { 
  ArrowLeft,
  Star,
  RotateCcw,
  Copy,
  Loader2
} from 'lucide-react';

interface WordResultPageProps {
  result: WordQueryResponse | null;
  originalQuery: string;
  onBack: () => void;
  onNewSearch: (word: string) => void;
  onRetry: () => void;
  loading?: boolean;
}

export function WordResultPage({ result, originalQuery, onBack, onNewSearch, onRetry, loading = false }: WordResultPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  const { toggleFavorite } = useFavorites();
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Check if desktop (移到前面，确保loading状态能正确获取isDesktop值)
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // 定义事件处理函数
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    console.log('WordResultPage: handleSearch called with:', searchTerm.trim());
    await onNewSearch(searchTerm.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      console.log('WordResultPage: Enter key pressed, calling handleSearch');
      handleSearch();
    }
  };

  // 如果result为null（loading状态），显示带搜索栏的loading页面
  if (!result) {
    console.log('WordResultPage: Loading state detected, isDesktop:', isDesktop);
    // Desktop loading layout
    if (isDesktop) {
      return (
        <div className="w-full min-h-screen flex flex-col animate-fade-in">
          {/* Top Bar - 保持搜索栏功能 */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
            <div className="flex items-center justify-between px-6 py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回</span>
              </Button>
              
              <div className="flex-1 max-w-md mx-8">
                <div className="relative animate-scale-in">
                  <EnhancedSearchInput
                    value={searchTerm}
                    onChange={(value) => setSearchTerm(value)}
                    onKeyPress={handleKeyPress}
                    onSearch={handleSearch}
                    placeholder="输入英文单词..."
                    disabled={loading}
                    className="w-full"
                    compact={true}
                  />
                </div>
              </div>
              
              <div className="w-20"></div>
            </div>
          </div>

          {/* Loading Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <div className="absolute inset-0 w-12 h-12 border-2 border-primary/20 rounded-full animate-pulse mx-auto"></div>
              </div>
              <p className="text-muted-foreground">
                正在查询单词...
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Mobile loading layout
    return (
      <div className="w-full min-h-screen flex flex-col">
        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-primary/20 rounded-full animate-pulse mx-auto"></div>
            </div>
            <p className="text-muted-foreground">
              正在查询单词...
            </p>
          </div>
        </div>

        {/* Mobile Bottom Toolbar - 保持返回功能 */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/40 px-4 py-3">
          <div className="flex items-center justify-center max-w-2xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center justify-center p-3"
              title="返回"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="ml-2">返回</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }



  const handleToggleFavorite = async () => {
    if (!result.data?.text) return;
    
    setFavoriteLoading(true);
    try {
      await toggleFavorite(
        result.data.text,
        originalQuery || result.data.word,
        result.data,
        result.rawResponse
      );
      // 更新本地状态
      result.isFavorited = !result.isFavorited;
    } catch (error) {
      console.error('收藏操作失败:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleRetry = async () => {
    onRetry();
  };

  const handleCopyResult = () => {
    if (!result.data) return;
    const text = `${result.data.word} - ${result.data.definition}`;
    navigator.clipboard.writeText(text);
  };

  // Desktop layout - 在AppLayout内部渲染，有侧边栏
  if (isDesktop) {
    return (
      <div className="w-full h-full flex flex-col animate-fade-in">
        {/* Top Bar - 匹配oca-2的高度和布局 */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
          <div className="flex items-center justify-between px-6 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </Button>
            
            <div className="flex-1 max-w-md mx-8">
              <div className="relative animate-scale-in">
                <EnhancedSearchInput
                  value={searchTerm}
                  onChange={(value) => setSearchTerm(value)}
                  onKeyPress={handleKeyPress}
                  onSearch={handleSearch}
                  placeholder="输入英文单词..."
                  disabled={loading}
                  className="w-full"
                  compact={true}
                />
              </div>
            </div>
            
            <div className="w-20"></div>
          </div>
        </div>

        {/* Search Results Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <WordResult 
              result={result}
              onClear={onBack}
              onRetry={handleRetry}
              loading={loading}
              originalQuery={originalQuery}
            />
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout - 保持原有的底部工具栏
  return (
    <div className="w-full h-full flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto space-y-8 p-4 pt-8 pb-20">
          <WordResult 
            result={result}
            onClear={onBack}
            onRetry={handleRetry}
            loading={loading}
            originalQuery={originalQuery}
          />
        </div>
      </div>

      {/* Mobile Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/40 px-4 py-3">
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center justify-center p-3"
            title="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            className="flex items-center justify-center p-3"
            title={result.isFavorited ? '取消收藏' : '添加收藏'}
          >
            {favoriteLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : result.isFavorited ? (
              <Star className="w-5 h-5 fill-current text-yellow-500" />
            ) : (
              <Star className="w-5 h-5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={loading}
            className="flex items-center justify-center p-3"
            title="重试查询"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RotateCcw className="w-5 h-5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyResult}
            className="flex items-center justify-center p-3"
            title="复制结果"
          >
            <Copy className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
} 