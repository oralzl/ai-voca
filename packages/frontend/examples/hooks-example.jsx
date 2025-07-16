/**
 * 前端Hooks使用示例
 * 展示如何使用useWordQuery Hook
 */

import React, { useState, useEffect } from 'react';
import { useWordQuery } from '../src/hooks/useWordQuery';

// 1. 基本Hook使用示例
function BasicHookExample() {
  const { result, loading, error, queryWord, clearResult } = useWordQuery();
  const [inputWord, setInputWord] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputWord.trim()) {
      await queryWord(inputWord.trim(), 'zh', true);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>基本Hook使用示例</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          placeholder="输入单词..."
          style={{ 
            padding: '10px',
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '查询中...' : '查询'}
        </button>
      </form>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          错误: {error}
        </div>
      )}
      
      {result && (
        <div style={{ 
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>查询结果</h3>
          <pre style={{ fontSize: '14px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          <button 
            onClick={clearResult}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            清空结果
          </button>
        </div>
      )}
    </div>
  );
}

// 2. 高级Hook使用示例
function AdvancedHookExample() {
  const { result, loading, error, queryWord, clearResult } = useWordQuery();
  const [queryLog, setQueryLog] = useState([]);
  const [autoQuery, setAutoQuery] = useState(false);

  // 自动查询示例单词
  const sampleWords = ['hello', 'world', 'javascript', 'react', 'vue'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (autoQuery && !loading) {
      const timer = setTimeout(() => {
        const word = sampleWords[currentIndex];
        queryWord(word, 'zh', false);
        setCurrentIndex((prev) => (prev + 1) % sampleWords.length);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [autoQuery, loading, currentIndex, queryWord]);

  // 记录查询日志
  useEffect(() => {
    if (result) {
      setQueryLog(prev => [...prev, {
        timestamp: Date.now(),
        word: result.data?.word || 'unknown',
        success: result.success,
        error: result.error
      }].slice(-10)); // 保留最近10条记录
    }
  }, [result]);

  const toggleAutoQuery = () => {
    setAutoQuery(prev => !prev);
    if (!autoQuery) {
      setCurrentIndex(0);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>高级Hook使用示例</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={toggleAutoQuery}
          style={{
            padding: '10px 20px',
            backgroundColor: autoQuery ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {autoQuery ? '停止自动查询' : '开始自动查询'}
        </button>
        
        <button 
          onClick={clearResult}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          清空结果
        </button>
      </div>
      
      {autoQuery && (
        <div style={{ 
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          🔄 自动查询模式已启用，当前查询: {sampleWords[currentIndex]}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 状态显示 */}
        <div style={{ flex: 1 }}>
          <h3>当前状态</h3>
          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p><strong>加载中:</strong> {loading ? '是' : '否'}</p>
            <p><strong>错误:</strong> {error || '无'}</p>
            <p><strong>结果:</strong> {result ? '有' : '无'}</p>
          </div>
          
          {result && (
            <div style={{ 
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <h4>最新查询结果</h4>
              <p><strong>单词:</strong> {result.data?.word}</p>
              <p><strong>成功:</strong> {result.success ? '是' : '否'}</p>
              <p><strong>时间:</strong> {new Date(result.timestamp).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
        
        {/* 查询日志 */}
        <div style={{ flex: 1 }}>
          <h3>查询日志</h3>
          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {queryLog.length === 0 ? (
              <p style={{ color: '#666' }}>暂无查询记录</p>
            ) : (
              <div>
                {queryLog.map((log, index) => (
                  <div key={index} style={{ 
                    marginBottom: '10px',
                    padding: '8px',
                    backgroundColor: log.success ? '#d4edda' : '#f8d7da',
                    borderRadius: '4px',
                    fontSize: '0.9em'
                  }}>
                    <div><strong>{log.word}</strong></div>
                    <div>{log.success ? '✓ 成功' : '✗ 失败'}</div>
                    <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    {log.error && <div style={{ color: '#721c24' }}>{log.error}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. 性能优化示例
function PerformanceOptimizedExample() {
  const { result, loading, error, queryWord, clearResult } = useWordQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // 防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 自动查询（防抖后）
  useEffect(() => {
    if (debouncedTerm && debouncedTerm.length > 2) {
      queryWord(debouncedTerm, 'zh', false);
    }
  }, [debouncedTerm, queryWord]);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>性能优化示例</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="输入单词 (自动查询，防抖500ms)"
          style={{ 
            width: '100%',
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
        />
        <div style={{ 
          fontSize: '12px',
          color: '#666',
          marginTop: '5px'
        }}>
          输入长度: {searchTerm.length} | 防抖状态: {debouncedTerm}
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={clearResult}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          清空结果
        </button>
      </div>
      
      {loading && (
        <div style={{ 
          backgroundColor: '#cce5ff',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          🔄 正在查询 "{debouncedTerm}"...
        </div>
      )}
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#721c24'
        }}>
          ❌ 查询失败: {error}
        </div>
      )}
      
      {result && result.success && (
        <div style={{ 
          backgroundColor: '#d4edda',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>"{result.data?.word}" 的释义</h3>
          <p>{result.data?.definition}</p>
          <div style={{ 
            fontSize: '12px',
            color: '#666',
            marginTop: '10px'
          }}>
            查询时间: {new Date(result.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

// 4. 错误处理示例
function ErrorHandlingExample() {
  const { result, loading, error, queryWord, clearResult } = useWordQuery();
  const [testCases] = useState([
    { word: '', description: '空字符串' },
    { word: 'a', description: '太短的单词' },
    { word: 'a'.repeat(100), description: '太长的单词' },
    { word: '123!@#', description: '无效字符' },
    { word: 'validword', description: '有效单词' }
  ]);

  const testErrorCase = async (testCase) => {
    console.log(`测试用例: ${testCase.description}`);
    await queryWord(testCase.word, 'zh', false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>错误处理示例</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>测试用例</h3>
        {testCases.map((testCase, index) => (
          <button
            key={index}
            onClick={() => testErrorCase(testCase)}
            disabled={loading}
            style={{
              display: 'block',
              width: '100%',
              margin: '5px 0',
              padding: '10px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              textAlign: 'left'
            }}
          >
            {testCase.description}: "{testCase.word}"
          </button>
        ))}
      </div>
      
      <button 
        onClick={clearResult}
        style={{
          padding: '8px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        清空结果
      </button>
      
      {loading && (
        <div style={{ 
          backgroundColor: '#cce5ff',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          🔄 测试中...
        </div>
      )}
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#721c24', margin: '0 0 10px 0' }}>错误信息</h4>
          <p style={{ color: '#721c24', margin: 0 }}>{error}</p>
        </div>
      )}
      
      {result && (
        <div style={{ 
          backgroundColor: result.success ? '#d4edda' : '#f8d7da',
          border: result.success ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>
            {result.success ? '✓ 查询成功' : '✗ 查询失败'}
          </h4>
          {result.success && result.data && (
            <div>
              <p><strong>单词:</strong> {result.data.word}</p>
              <p><strong>释义:</strong> {result.data.definition}</p>
            </div>
          )}
          {!result.success && (
            <p style={{ color: '#721c24', margin: 0 }}>
              <strong>错误:</strong> {result.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// 导出所有示例
export {
  BasicHookExample,
  AdvancedHookExample,
  PerformanceOptimizedExample,
  ErrorHandlingExample
};

// 默认导出基本示例
export default BasicHookExample;