/**
 * @fileoverview 主应用程序组件
 * @module App
 * @description AI单词查询应用的核心组件，包含用户认证、单词查询和结果展示功能
 */

import { useState } from 'react';
import { FavoriteWord } from '@ai-voca/shared';
import { WordQueryForm } from './components/WordQueryForm';
import { FavoritesList } from './components/FavoritesList';
import { UserProfile } from './components/UserProfile';
import { WordResultPage } from './pages/WordResultPage';
import { useWordQuery } from './hooks/useWordQuery';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Button } from './components/ui/button';
import { Brain } from 'lucide-react';

type PageType = 'search' | 'favorites' | 'profile' | 'wordResult';

function AppContent() {
  const { 
    result, 
    loading, 
    error, 
    queryWord, 
    clearResult,
    retryQuery,
    loadFromFavorite
  } = useWordQuery();
  
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('search');
  const [currentQuery, setCurrentQuery] = useState<string>('');

  // 处理单词查询，成功后跳转到结果页面
  const handleQueryWord = async (word: string) => {
    setCurrentQuery(word);
    await queryWord(word);
    
    // 查询完成后跳转到结果页面（无论成功失败都跳转，让结果页面处理显示）
    setCurrentPage('wordResult');
  };

  // 从结果页面返回到搜索页面
  const handleBackToSearch = () => {
    setCurrentPage('search');
  };

  // 在结果页面进行新搜索
  const handleNewSearchFromResult = async (word: string) => {
    console.log('App: handleNewSearchFromResult called with:', word);
    setCurrentQuery(word);
    await queryWord(word);
    
    // 保持在结果页面，结果会自动更新，因为使用的是同一个result状态
    console.log('App: queryWord completed, should stay on wordResult page');
  };

  // 从收藏列表跳转到单词结果页面
  const handleWordClickFromFavorites = (favorite: FavoriteWord) => {
    console.log('App: handleWordClickFromFavorites called with:', favorite.word);
    
    // 设置结果和查询词
    setCurrentQuery(favorite.originalQuery || favorite.word);
    
    // 跳转到结果页面
    setCurrentPage('wordResult');
    
    // 直接使用已保存的收藏数据，无需重新查询AI
    loadFromFavorite(favorite.queryData, favorite.originalQuery || favorite.word);
  };

  // 处理底部导航栏的页面切换（不包括wordResult）
  const handlePageChange = (page: 'search' | 'favorites' | 'profile') => {
    setCurrentPage(page);
  };

  // 如果认证还在加载中，显示加载状态
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/10">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-24 bg-muted rounded mx-auto animate-pulse" />
            <p className="text-muted-foreground">正在加载...</p>
          </div>
        </div>
      </div>
    );
  }

  // 未登录状态的欢迎页面
  if (!user) {
    return (
      <AppLayout 
        currentPage={currentPage === 'wordResult' ? 'search' : currentPage} 
        onPageChange={handlePageChange}
        hideBottomNavigation={false}
      >
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gradient">欢迎使用AI单词查询</h1>
              <p className="text-lg text-muted-foreground">
                请先登录或注册账号以使用词汇查询功能
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">✨</span>
                  <span>智能AI词汇解释</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📚</span>
                  <span>详细的词源和用法</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⭐</span>
                  <span>单词收藏功能</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎯</span>
                  <span>个性化学习记录</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔄</span>
                  <span>查询历史管理</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🚀</span>
                  <span>无限次免费查询</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 所有页面都在AppLayout内部渲染

  // 已登录状态的主应用内容
  return (
    <AppLayout 
      currentPage={currentPage === 'wordResult' ? 'search' : currentPage} 
      onPageChange={handlePageChange}
      hideBottomNavigation={currentPage === 'wordResult'} // 结果页面隐藏底部导航
    >
      {currentPage === 'search' ? (
        <div className="flex-1 flex flex-col">
          <WordQueryForm 
            onQuery={handleQueryWord}
            loading={loading}
            onClear={clearResult}
          />
          
          {error && (
            <div className="mx-auto max-w-2xl p-4">
              <div className="text-center p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h3 className="text-lg font-semibold text-destructive mb-2">查询出错</h3>
                <p className="text-destructive/80">{error}</p>
                <Button 
                  onClick={retryQuery}
                  variant="outline" 
                  className="mt-4"
                >
                  重试查询
                </Button>
              </div>
            </div>
          )}
          
          {/* 不再在搜索页面显示结果，而是跳转到结果页面 */}
        </div>
      ) : currentPage === 'wordResult' ? (
        <WordResultPage
          result={result}
          originalQuery={currentQuery}
          onBack={handleBackToSearch}
          onNewSearch={handleNewSearchFromResult}
          onRetry={retryQuery}
          loading={loading}
        />
      ) : currentPage === 'favorites' ? (
        <div className="flex-1 p-4 pb-20 md:pb-4">
          <FavoritesList onWordClick={handleWordClickFromFavorites} />
        </div>
      ) : (
        <div className="flex-1 p-4 pb-20 md:pb-4">
          <UserProfile />
        </div>
      )}
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;