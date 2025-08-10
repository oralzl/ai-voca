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
import { ReviewPage } from './pages/ReviewPage';
import { DebugPage } from './pages/DebugPage';
import { useWordQuery } from './hooks/useWordQuery';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { AuthModal } from './components/Auth/AuthModal';
import { Brain, Star, Users, Zap, Shield, Globe } from 'lucide-react';

type PageType = 'search' | 'favorites' | 'review' | 'profile' | 'wordResult' | 'debug';

// Features configuration for landing page
const features = [
  {
    icon: Brain,
    title: 'AI驱动智能解释',
    description: '采用先进AI模型提供深度、个性化的单词解释',
    color: 'text-blue-500'
  },
  {
    icon: Zap,
    title: '词形还原技术',
    description: '智能识别单词变形，提供标准形式和变形说明',
    color: 'text-yellow-500'
  },
  {
    icon: Star,
    title: '个性化收藏系统',
    description: '用户可收藏单词，建立个人词汇库',
    color: 'text-purple-500'
  },
  {
    icon: Globe,
    title: '云原生架构',
    description: '无服务器架构，零运维，全球加速访问',
    color: 'text-green-500'
  },
  {
    icon: Users,
    title: '学习者友好',
    description: '专注中文用户英语学习需求，提供结构化学习内容',
    color: 'text-indigo-500'
  },
  {
    icon: Shield,
    title: '数据安全',
    description: '用户数据安全存储，隐私保护放心使用',
    color: 'text-red-500'
  }
];

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
  const [showAuthModal, setShowAuthModal] = useState(false);

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
    // 传递完整的收藏数据，包括rawResponse
    loadFromFavorite(favorite);
  };

  // 处理底部导航栏的页面切换（不包括wordResult）
  const handlePageChange = (page: 'search' | 'favorites' | 'review' | 'profile' | 'debug') => {
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

  // 未登录状态的欢迎页面 - 使用oca-2样式的无侧边栏设计
  if (!user) {
    return (
      <>
        {/* Full-screen centered layout for marketing impact */}
        <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-br from-background via-background to-muted/10">
          <div className="max-w-4xl w-full space-y-8 sm:space-y-12">
            {/* Hero Section - Main value proposition and CTA */}
            <div className="text-center space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      AI-Voca-2
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">智能词汇学习助手</p>
                  </div>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
                  采用先进的AI模型，为你提供深度、个性化的单词解释。
                  支持词形还原、智能收藏，助你高效构建个人词汇库。
                </p>
              </div>

              <div className="pt-2 sm:pt-4">
                <Button 
                  size="lg" 
                  className="text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-6 h-12 sm:h-14 font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                  onClick={() => setShowAuthModal(true)}
                >
                  立即开始学习
                </Button>
              </div>
            </div>

            {/* Features Section - Showcase top 3 features for marketing */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 pt-4 sm:pt-8">
              {features.slice(0, 3).map((feature, index) => (
                <Card key={index} className="hover:scale-105 transition-all duration-300 shadow-lg border-0 bg-card/50 backdrop-blur-sm text-center">
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center space-y-3 sm:space-y-4">
                    <div className={`p-3 sm:p-4 rounded-full bg-background/50 ${feature.color} shadow-sm`}>
                      <feature.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <h3 className="font-semibold text-base sm:text-lg">{feature.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Features Grid - Show all features for comprehensive overview */}
            <div className="space-y-6 pt-4 sm:pt-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">更多功能特性</h3>
                <p className="text-muted-foreground">
                  AI-Voca-2 为你提供全面的英语词汇学习体验
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.slice(3).map((feature, index) => (
                  <Card key={index + 3} className="hover:scale-105 transition-all duration-300 shadow-sm bg-card/30 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg bg-background/50 ${feature.color}`}>
                          <feature.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Call to Action Section */}
            <div className="text-center pt-4 sm:pt-8">
              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-semibold">准备开始你的学习之旅？</h3>
                <p className="text-muted-foreground">
                  注册账户，立即体验AI驱动的智能词汇学习
                </p>
                <Button 
                  variant="outline"
                  size="lg"
                  className="text-base px-8 py-4 h-12 hover:scale-105 transition-all duration-300"
                  onClick={() => setShowAuthModal(true)}
                >
                  免费注册账户
                </Button>
              </div>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialType="register"
        />
      </>
    );
  }

  // 所有页面都在AppLayout内部渲染

  // 已登录状态的主应用内容
  return (
    <AppLayout 
      currentPage={currentPage === 'wordResult' ? 'search' : currentPage} 
      onPageChange={handlePageChange}
      hideBottomNavigation={currentPage === 'wordResult' || currentPage === 'review'} // 结果与复习页面隐藏底部导航
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
      ) : currentPage === 'review' ? (
        <ReviewPage onBack={() => setCurrentPage('search')} />
      ) : currentPage === 'debug' ? (
        <div className="flex-1">
          <DebugPage />
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