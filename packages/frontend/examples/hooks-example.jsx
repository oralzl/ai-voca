/**
 * 前端Hooks使用示例 - 云原生版本
 * 展示如何使用useWordQuery Hook在云原生架构中进行单词查询
 * 
 * 注意：此示例需要用户登录状态，展示了新的认证集成功能
 */

import React, { useState, useEffect } from 'react';
import { useWordQuery } from '../src/hooks/useWordQuery';
import { useAuth } from '../src/contexts/AuthContext';

// 1. 基本Hook使用示例（需要认证）
function BasicHookExample() {
  const { result, loading, error, queryWord, clearResult, retryQuery } = useWordQuery();
  const { user } = useAuth();
  const [inputWord, setInputWord] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('请先登录');
      return;
    }
    if (inputWord.trim()) {
      // 新的API：移除了language参数，专注中文解释
      await queryWord(inputWord.trim(), true);
    }
  };

  const handleRetry = async () => {
    if (!result?.inputParams) {
      alert('无重试参数');
      return;
    }
    await retryQuery();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>基本Hook使用示例（云原生版本）</h2>
      
      {/* 认证状态显示 */}
      <div style={{ 
        backgroundColor: user ? '#d4edda' : '#f8d7da',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <strong>认证状态: </strong>
        {user ? `已登录 (${user.email})` : '未登录'}
      </div>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          placeholder="输入英文单词（如: running, cats, better）..."
          style={{ 
            padding: '10px',
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            width: '250px'
          }}
        />
        <button 
          type="submit" 
          disabled={loading || !user}
          style={{
            padding: '10px 20px',
            backgroundColor: loading || !user ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !user ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '查询中...' : '查询单词'}
        </button>
      </form>
      
      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          padding: '10px',
          borderRadius: '4px'
        }}>
          错误: {error}
        </div>
      )}
      
      {result && result.success && (
        <div style={{ 
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>查询结果</h3>
          
          {/* 词形还原信息 */}
          {result.data?.lemmatizationExplanation && (
            <div style={{ 
              backgroundColor: '#cce5ff',
              padding: '8px',
              borderRadius: '4px',
              marginBottom: '10px'
            }}>
              <strong>词形还原: </strong>
              {result.data.lemmatizationExplanation}
            </div>
          )}
          
          <div style={{ marginBottom: '10px' }}>
            <strong>单词: </strong>{result.data?.word}
            {result.data?.text && result.data.text !== result.data.word && (
              <span style={{ color: '#666' }}> (原形: {result.data.text})</span>
            )}
          </div>
          
          {result.data?.pronunciation && (
            <div style={{ marginBottom: '10px' }}>
              <strong>音标: </strong>{result.data.pronunciation}
            </div>
          )}
          
          {result.data?.partOfSpeech && (
            <div style={{ marginBottom: '10px' }}>
              <strong>词性: </strong>{result.data.partOfSpeech}
            </div>
          )}
          
          <div style={{ marginBottom: '10px' }}>
            <strong>中文释义: </strong>
            <div dangerouslySetInnerHTML={{ __html: result.data?.definition || '' }} />
          </div>
          
          {result.data?.simpleExplanation && (
            <div style={{ marginBottom: '10px' }}>
              <strong>英文解释: </strong>
              <div dangerouslySetInnerHTML={{ __html: result.data.simpleExplanation }} />
            </div>
          )}
          
          {result.data?.examples && result.data.examples.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <strong>例句: </strong>
              {result.data.examples.map((example, index) => (
                <div key={index} style={{ marginLeft: '10px', marginBottom: '5px' }}>
                  <div>{example.sentence}</div>
                  {example.translation && (
                    <div style={{ color: '#666', fontSize: '0.9em' }}>
                      {example.translation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div style={{ marginTop: '15px' }}>
            <button 
              onClick={clearResult}
              style={{
                marginRight: '10px',
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
            
            {/* 智能重试按钮 */}
            {result.inputParams && (
              <button 
                onClick={handleRetry}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: loading ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '重试中...' : '智能重试'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 2. 高级Hook使用示例（无限制查询）
function AdvancedHookExample() {
  const { result, loading, error, queryWord, clearResult } = useWordQuery();
  const { user } = useAuth();
  const [queryLog, setQueryLog] = useState([]);
  const [autoQuery, setAutoQuery] = useState(false);

  // 展示词形还原的示例单词
  const sampleWords = [
    'running',     // 动词现在分词
    'cats',        // 名词复数
    'better',      // 形容词比较级
    'children',    // 不规则复数
    'went',        // 不规则过去式
    'leaves'       // 同形异义词
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (autoQuery && !loading && user) {
      const timer = setTimeout(() => {
        const word = sampleWords[currentIndex];
        queryWord(word, true); // 无限制查询
        setCurrentIndex((prev) => (prev + 1) % sampleWords.length);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [autoQuery, loading, currentIndex, queryWord, user]);

  // 记录查询日志
  useEffect(() => {
    if (result) {
      setQueryLog(prev => [...prev, {
        timestamp: Date.now(),
        word: result.data?.word || 'unknown',
        lemma: result.data?.text || '',
        success: result.success,
        error: result.error,
        hasLemmatization: !!result.data?.lemmatizationExplanation
      }].slice(-15)); // 保留最近15条记录
    }
  }, [result]);

  const toggleAutoQuery = () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    setAutoQuery(prev => !prev);
    if (!autoQuery) {
      setCurrentIndex(0);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2>高级Hook使用示例（无限制查询）</h2>
      
      <div style={{ 
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        ✨ <strong>新特性展示:</strong> 词形还原分析、无限制查询、智能重试机制
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={toggleAutoQuery}
          disabled={!user}
          style={{
            padding: '10px 20px',
            backgroundColor: !user ? '#ccc' : (autoQuery ? '#dc3545' : '#28a745'),
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !user ? 'not-allowed' : 'pointer',
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
      
      {autoQuery && user && (
        <div style={{ 
          backgroundColor: '#cce5ff',
          border: '1px solid #b3d9ff',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          🔄 自动查询模式已启用，当前查询: <strong>{sampleWords[currentIndex]}</strong>
          <br />
          <small>演示词形还原功能，每4秒自动查询一个单词</small>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 当前查询状态 */}
        <div style={{ flex: 1 }}>
          <h3>当前查询状态</h3>
          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p><strong>认证状态:</strong> {user ? '已登录' : '未登录'}</p>
            <p><strong>加载中:</strong> {loading ? '是' : '否'}</p>
            <p><strong>错误:</strong> {error || '无'}</p>
            <p><strong>查询限制:</strong> 无限制 ♾️</p>
            <p><strong>查询总数:</strong> {queryLog.length}</p>
          </div>
          
          {result && result.success && (
            <div style={{ 
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <h4>最新查询结果</h4>
              <p><strong>单词:</strong> {result.data?.word}</p>
              {result.data?.text && result.data.text !== result.data?.word && (
                <p><strong>词形还原:</strong> {result.data.word} → {result.data.text}</p>
              )}
              <p><strong>成功:</strong> {result.success ? '是' : '否'}</p>
              <p><strong>时间:</strong> {new Date(result.timestamp).toLocaleTimeString()}</p>
              {result.inputParams && (
                <p><strong>支持重试:</strong> ✅</p>
              )}
            </div>
          )}
        </div>
        
        {/* 查询日志 */}
        <div style={{ flex: 1 }}>
          <h3>查询日志（最近15条）</h3>
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
                    {log.lemma && log.lemma !== log.word && (
                      <div style={{ color: '#666' }}>→ {log.lemma}</div>
                    )}
                    <div>{log.success ? '✓ 成功' : '✗ 失败'}</div>
                    {log.hasLemmatization && (
                      <div style={{ color: '#007bff', fontSize: '0.8em' }}>🧠 词形还原</div>
                    )}
                    <div style={{ fontSize: '0.8em' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
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

// 3. 认证集成示例
function AuthIntegrationExample() {
  const { result, loading, queryWord } = useWordQuery();
  const { user, signIn, signUp, signOut } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        const { error } = await signIn(email, password);
        if (error) alert('登录失败: ' + error.message);
      } else {
        const { error } = await signUp(email, password);
        if (error) alert('注册失败: ' + error.message);
      }
    } catch (err) {
      alert('认证错误: ' + err.message);
    }
  };

  const testQuery = async () => {
    await queryWord('authentication', true);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>认证集成示例</h2>
      
      {!user ? (
        <div style={{ 
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>请先登录或注册</h3>
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: '10px' }}>
              <button 
                type="button"
                onClick={() => setAuthMode('login')}
                style={{
                  marginRight: '10px',
                  padding: '5px 15px',
                  backgroundColor: authMode === 'login' ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                登录
              </button>
              <button 
                type="button"
                onClick={() => setAuthMode('signup')}
                style={{
                  padding: '5px 15px',
                  backgroundColor: authMode === 'signup' ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                注册
              </button>
            </div>
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
            
            <button 
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {authMode === 'login' ? '登录' : '注册'}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <div style={{ 
            backgroundColor: '#d4edda',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3>欢迎回来！</h3>
            <p><strong>用户:</strong> {user.email}</p>
            <p><strong>认证状态:</strong> 已验证 ✅</p>
            <p><strong>查询权限:</strong> 无限制查询</p>
            
            <button 
              onClick={signOut}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              登出
            </button>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={testQuery}
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
              {loading ? '查询中...' : '测试查询 "authentication"'}
            </button>
          </div>
          
          {result && (
            <div style={{ 
              backgroundColor: result.success ? '#d4edda' : '#f8d7da',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <h4>查询结果</h4>
              {result.success ? (
                <div>
                  <p><strong>单词:</strong> {result.data?.word}</p>
                  <p><strong>释义:</strong> {result.data?.definition}</p>
                  <p><strong>查询时间:</strong> {new Date(result.timestamp).toLocaleString()}</p>
                </div>
              ) : (
                <p><strong>错误:</strong> {result.error}</p>
              )}
            </div>
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
  AuthIntegrationExample
};

// 默认导出基本示例
export default BasicHookExample;