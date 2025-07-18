import { useState } from 'react';
import { WordQueryForm } from './components/WordQueryForm';
import { WordResult } from './components/WordResult';
import { useWordQuery } from './hooks/useWordQuery';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/Auth/AuthModal';
import { UserProfile } from './components/Auth/UserProfile';
import './App.css';

function AppContent() {
  const { 
    result, 
    loading, 
    error, 
    queryWord, 
    clearResult,
    retryQuery 
  } = useWordQuery();
  
  const { user, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 如果认证还在加载中，显示加载状态
  if (authLoading) {
    return (
      <div className="app">
        <div className="container">
          <div className="loading-screen">
            <div className="spinner"></div>
            <p>正在加载...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <h1>AI单词查询</h1>
              <p>基于AI的智能词汇助手，提供详细的单词解释和用法指导</p>
            </div>
            <div className="header-right">
              {user ? (
                <UserProfile />
              ) : (
                <button 
                  className="login-btn"
                  onClick={() => setShowAuthModal(true)}
                >
                  登录 / 注册
                </button>
              )}
            </div>
          </div>
        </header>
        
        <main className="main">
          {user ? (
            <>
              <WordQueryForm 
                onQuery={queryWord}
                loading={loading}
                onClear={clearResult}
              />
              
              {error && (
                <div className="error-message">
                  <h3>查询出错</h3>
                  <p>{error}</p>
                </div>
              )}
              
              {result && (
                <WordResult 
                  result={result}
                  onClear={clearResult}
                  onRetry={retryQuery}
                  loading={loading}
                />
              )}
            </>
          ) : (
            <div className="welcome-section">
              <div className="welcome-content">
                <h2>欢迎使用AI单词查询</h2>
                <p>请先登录或注册账号以使用词汇查询功能</p>
                <ul className="feature-list">
                  <li>✨ 智能AI词汇解释</li>
                  <li>📚 详细的词源和用法</li>
                  <li>🎯 个性化学习记录</li>
                  <li>🔄 查询历史管理</li>
                  <li>🚀 每日100次免费查询</li>
                </ul>
                <button 
                  className="cta-btn"
                  onClick={() => setShowAuthModal(true)}
                >
                  开始使用
                </button>
              </div>
            </div>
          )}
        </main>
        
        <footer className="footer">
          <p>© 2024 AI单词查询 - 智能词汇学习助手</p>
        </footer>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
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