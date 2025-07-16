import React from 'react';
import { WordQueryForm } from './components/WordQueryForm';
import { WordResult } from './components/WordResult';
import { useWordQuery } from './hooks/useWordQuery';
import './App.css';

function App() {
  const { 
    result, 
    loading, 
    error, 
    queryWord, 
    clearResult 
  } = useWordQuery();

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>AI单词查询</h1>
          <p>基于AI的智能词汇助手，提供详细的单词解释和用法指导</p>
        </header>
        
        <main className="main">
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
            />
          )}
        </main>
        
        <footer className="footer">
          <p>© 2024 AI单词查询 - 智能词汇学习助手</p>
        </footer>
      </div>
    </div>
  );
}

export default App;