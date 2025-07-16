/**
 * 前端组件使用示例
 * 展示如何使用React组件
 */

import React from 'react';
import { WordQueryForm } from '../src/components/WordQueryForm';
import { WordResult } from '../src/components/WordResult';
import { useWordQuery } from '../src/hooks/useWordQuery';

// 1. 基本使用示例
function BasicUsageExample() {
  const { result, loading, error, queryWord, clearResult } = useWordQuery();

  const handleQuery = async (word, language, includeExample) => {
    console.log('开始查询:', { word, language, includeExample });
    await queryWord(word, language, includeExample);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>基本使用示例</h2>
      
      {/* 查询表单 */}
      <WordQueryForm 
        onQuery={handleQuery}
        loading={loading}
        onClear={clearResult}
      />
      
      {/* 错误显示 */}
      {error && (
        <div style={{ 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          padding: '10px', 
          margin: '20px 0',
          borderRadius: '4px',
          color: '#c33'
        }}>
          <strong>错误:</strong> {error}
        </div>
      )}
      
      {/* 结果显示 */}
      {result && (
        <WordResult 
          result={result}
          onClear={clearResult}
        />
      )}
    </div>
  );
}

// 2. 自定义样式示例
function CustomStyleExample() {
  const { result, loading, error, queryWord, clearResult } = useWordQuery();

  const customStyles = {
    container: {
      padding: '30px',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    title: {
      color: '#2c3e50',
      textAlign: 'center',
      marginBottom: '30px'
    }
  };

  return (
    <div style={customStyles.container}>
      <h2 style={customStyles.title}>自定义样式示例</h2>
      
      <WordQueryForm 
        onQuery={queryWord}
        loading={loading}
        onClear={clearResult}
      />
      
      {result && (
        <WordResult 
          result={result}
          onClear={clearResult}
        />
      )}
    </div>
  );
}

// 3. 事件处理示例
function EventHandlingExample() {
  const { result, loading, error, queryWord, clearResult } = useWordQuery();

  const handleQueryWithLogging = async (word, language, includeExample) => {
    console.log('=== 查询开始 ===');
    console.log('参数:', { word, language, includeExample });
    console.log('时间:', new Date().toISOString());
    
    const startTime = Date.now();
    
    try {
      await queryWord(word, language, includeExample);
      const endTime = Date.now();
      console.log('查询完成，耗时:', endTime - startTime, 'ms');
    } catch (error) {
      console.error('查询失败:', error);
    }
    
    console.log('=== 查询结束 ===');
  };

  const handleClearWithLogging = () => {
    console.log('清空结果');
    clearResult();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>事件处理示例</h2>
      <p>打开浏览器开发者工具查看控制台输出</p>
      
      <WordQueryForm 
        onQuery={handleQueryWithLogging}
        loading={loading}
        onClear={handleClearWithLogging}
      />
      
      {result && (
        <WordResult 
          result={result}
          onClear={handleClearWithLogging}
        />
      )}
    </div>
  );
}

// 4. 状态管理示例
function StateManagementExample() {
  const { result, loading, error, queryWord, clearResult } = useWordQuery();
  const [queryHistory, setQueryHistory] = React.useState([]);

  const handleQueryWithHistory = async (word, language, includeExample) => {
    // 记录查询历史
    const queryRecord = {
      word,
      language,
      includeExample,
      timestamp: Date.now()
    };
    
    setQueryHistory(prev => [queryRecord, ...prev.slice(0, 9)]); // 保留最近10条

    await queryWord(word, language, includeExample);
  };

  const handleClearAll = () => {
    clearResult();
    setQueryHistory([]);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>状态管理示例</h2>
      
      <WordQueryForm 
        onQuery={handleQueryWithHistory}
        loading={loading}
        onClear={clearResult}
      />
      
      {/* 查询历史 */}
      {queryHistory.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3>查询历史</h3>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {queryHistory.map((record, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                <strong>{record.word}</strong> 
                ({record.language === 'zh' ? '中文' : '英文'})
                - {new Date(record.timestamp).toLocaleTimeString()}
              </li>
            ))}
          </ul>
          <button 
            onClick={handleClearAll}
            style={{ 
              marginTop: '10px',
              padding: '5px 10px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            清空历史
          </button>
        </div>
      )}
      
      {result && (
        <WordResult 
          result={result}
          onClear={clearResult}
        />
      )}
    </div>
  );
}

// 5. 完整应用示例
function CompleteAppExample() {
  const { result, loading, error, queryWord, clearResult } = useWordQuery();
  const [favorites, setFavorites] = React.useState([]);

  const handleAddToFavorites = () => {
    if (result && result.success && result.data) {
      const favorite = {
        word: result.data.word,
        definition: result.data.definition,
        timestamp: Date.now()
      };
      
      setFavorites(prev => {
        const exists = prev.find(f => f.word === favorite.word);
        if (!exists) {
          return [favorite, ...prev];
        }
        return prev;
      });
    }
  };

  const handleRemoveFromFavorites = (word) => {
    setFavorites(prev => prev.filter(f => f.word !== word));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 主要内容 */}
        <div style={{ flex: 2 }}>
          <h2>完整应用示例</h2>
          
          <WordQueryForm 
            onQuery={queryWord}
            loading={loading}
            onClear={clearResult}
          />
          
          {error && (
            <div style={{ 
              backgroundColor: '#fee', 
              border: '1px solid #fcc', 
              padding: '15px', 
              margin: '20px 0',
              borderRadius: '8px',
              color: '#c33'
            }}>
              <strong>错误:</strong> {error}
            </div>
          )}
          
          {result && (
            <div>
              <WordResult 
                result={result}
                onClear={clearResult}
              />
              
              {result.success && (
                <button 
                  onClick={handleAddToFavorites}
                  style={{ 
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  添加到收藏
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* 侧边栏 */}
        <div style={{ flex: 1 }}>
          <h3>收藏单词</h3>
          {favorites.length === 0 ? (
            <p style={{ color: '#666' }}>暂无收藏单词</p>
          ) : (
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {favorites.map((favorite, index) => (
                <div key={index} style={{ 
                  marginBottom: '10px',
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}>
                  <strong>{favorite.word}</strong>
                  <p style={{ 
                    fontSize: '0.9em',
                    color: '#666',
                    margin: '5px 0'
                  }}>
                    {favorite.definition?.substring(0, 100)}...
                  </p>
                  <button 
                    onClick={() => handleRemoveFromFavorites(favorite.word)}
                    style={{ 
                      fontSize: '0.8em',
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 导出所有示例
export {
  BasicUsageExample,
  CustomStyleExample,
  EventHandlingExample,
  StateManagementExample,
  CompleteAppExample
};

// 默认导出主示例
export default BasicUsageExample;