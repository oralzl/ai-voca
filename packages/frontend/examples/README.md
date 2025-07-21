# Examples - 使用示例代码

此目录包含应用功能的使用示例，展示如何正确使用组件、Hooks和API。

## 📋 示例文件

- **`components-example.jsx`** - React组件使用示例
- **`hooks-example.jsx`** - 自定义Hooks使用示例

## 🧩 components-example.jsx - 组件使用示例

### 文件概述
展示如何正确使用应用中的各种React组件，包括认证组件、查询组件等。

### 示例内容
- ✅ **认证组件使用** - AuthModal、LoginForm、UserProfile的集成使用
- ✅ **查询组件使用** - WordQueryForm和WordResult的配合使用
- ✅ **状态管理** - 组件间的状态传递和管理
- ✅ **事件处理** - 用户交互事件的处理方式

### 核心示例
```jsx
// 完整的应用示例
function AppExample() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="app-example">
      {/* 认证状态展示 */}
      {user ? (
        <UserProfile user={user} onLogout={handleLogout} />
      ) : (
        <button onClick={() => setShowAuth(true)}>
          登录
        </button>
      )}

      {/* 认证模态框 */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        initialMode="login"
      />

      {/* 单词查询功能 */}
      {user && <WordQuerySection />}
    </div>
  );
}
```

## 🪝 hooks-example.jsx - Hooks使用示例

### 文件概述
演示自定义Hooks的使用方法，特别是`useWordQuery`的各种使用场景。

### 示例内容
- ✅ **基本Hook使用** - 展示useWordQuery的基本用法
- ✅ **高级功能** - 词形还原、智能重试、无限制查询
- ✅ **认证集成** - 与AuthContext的集成使用
- ✅ **错误处理** - 完整的错误处理和用户反馈

### 核心示例

#### 1. 基本Hook使用示例
```jsx
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
      await queryWord(inputWord.trim(), true);
    }
  };

  return (
    <div className="basic-example">
      {/* 认证状态显示 */}
      <div className="auth-status">
        认证状态: {user ? `已登录 (${user.email})` : '未登录'}
      </div>
      
      {/* 查询表单 */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          placeholder="输入英文单词..."
        />
        <button type="submit" disabled={loading || !user}>
          {loading ? '查询中...' : '查询单词'}
        </button>
      </form>
      
      {/* 查询结果 */}
      {result && result.success && (
        <div className="result">
          <h3>查询结果</h3>
          {/* 词形还原信息 */}
          {result.data?.lemmatizationExplanation && (
            <div className="lemmatization">
              <strong>词形还原: </strong>
              {result.data.lemmatizationExplanation}
            </div>
          )}
          
          {/* 基本信息 */}
          <div>
            <strong>单词: </strong>{result.data?.word}
            {result.data?.text && result.data.text !== result.data.word && (
              <span> (原形: {result.data.text})</span>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="actions">
            <button onClick={clearResult}>清空结果</button>
            {result.inputParams && (
              <button onClick={retryQuery} disabled={loading}>
                {loading ? '重试中...' : '智能重试'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 2. 高级Hook使用示例
```jsx
function AdvancedHookExample() {
  const { result, loading, error, queryWord, clearResult } = useWordQuery();
  const { user } = useAuth();
  const [queryLog, setQueryLog] = useState([]);
  const [autoQuery, setAutoQuery] = useState(false);

  // 展示词形还原的示例单词
  const sampleWords = ['running', 'cats', 'better', 'children', 'went', 'leaves'];
  const [currentIndex, setCurrentIndex] = useState(0);

  // 自动查询功能
  useEffect(() => {
    if (autoQuery && !loading && user) {
      const timer = setTimeout(() => {
        const word = sampleWords[currentIndex];
        queryWord(word, true);
        setCurrentIndex((prev) => (prev + 1) % sampleWords.length);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [autoQuery, loading, currentIndex, queryWord, user]);

  return (
    <div className="advanced-example">
      <h2>高级Hook使用示例（无限制查询）</h2>
      
      {/* 功能说明 */}
      <div className="feature-notice">
        ✨ 新特性展示: 词形还原分析、无限制查询、智能重试机制
      </div>
      
      {/* 自动查询控制 */}
      <div className="auto-query-controls">
        <button 
          onClick={() => setAutoQuery(!autoQuery)}
          disabled={!user}
        >
          {autoQuery ? '停止自动查询' : '开始自动查询'}
        </button>
        
        {autoQuery && user && (
          <div className="auto-status">
            🔄 自动查询模式已启用，当前查询: <strong>{sampleWords[currentIndex]}</strong>
            <br />
            <small>演示词形还原功能，每4秒自动查询一个单词</small>
          </div>
        )}
      </div>
      
      {/* 状态展示 */}
      <div className="status-display">
        <div className="current-status">
          <h3>当前查询状态</h3>
          <p><strong>认证状态:</strong> {user ? '已登录' : '未登录'}</p>
          <p><strong>加载中:</strong> {loading ? '是' : '否'}</p>
          <p><strong>查询限制:</strong> 无限制 ♾️</p>
          <p><strong>查询总数:</strong> {queryLog.length}</p>
        </div>
        
        {/* 查询日志 */}
        <div className="query-log">
          <h3>查询日志（最近15条）</h3>
          {queryLog.slice(-15).map((log, index) => (
            <div key={index} className={`log-entry ${log.success ? 'success' : 'error'}`}>
              <div><strong>{log.word}</strong></div>
              {log.lemma && log.lemma !== log.word && (
                <div>→ {log.lemma}</div>
              )}
              <div>{log.success ? '✓ 成功' : '✗ 失败'}</div>
              {log.hasLemmatization && (
                <div className="lemma-indicator">🧠 词形还原</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### 3. 认证集成示例
```jsx
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
    <div className="auth-integration">
      <h2>认证集成示例</h2>
      
      {!user ? (
        <div className="auth-form">
          <h3>请先登录或注册</h3>
          <form onSubmit={handleAuth}>
            {/* 模式切换 */}
            <div className="mode-toggle">
              <button 
                type="button"
                onClick={() => setAuthMode('login')}
                className={authMode === 'login' ? 'active' : ''}
              >
                登录
              </button>
              <button 
                type="button"
                onClick={() => setAuthMode('signup')}
                className={authMode === 'signup' ? 'active' : ''}
              >
                注册
              </button>
            </div>
            
            {/* 表单字段 */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
            />
            <button type="submit">
              {authMode === 'login' ? '登录' : '注册'}
            </button>
          </form>
        </div>
      ) : (
        <div className="user-dashboard">
          <h3>欢迎回来！</h3>
          <p><strong>用户:</strong> {user.email}</p>
          <p><strong>认证状态:</strong> 已验证 ✅</p>
          <p><strong>查询权限:</strong> 无限制查询</p>
          
          <div className="actions">
            <button onClick={signOut}>登出</button>
            <button onClick={testQuery} disabled={loading}>
              {loading ? '查询中...' : '测试查询 "authentication"'}
            </button>
          </div>
          
          {/* 查询结果展示 */}
          {result && (
            <div className="query-result">
              <h4>查询结果</h4>
              {result.success ? (
                <div>
                  <p><strong>单词:</strong> {result.data?.word}</p>
                  <p><strong>释义:</strong> {result.data?.definition}</p>
                </div>
              ) : (
                <p className="error">错误: {result.error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## 🎯 使用指南

### 运行示例
```bash
# 1. 确保开发服务器运行
npm run dev

# 2. 在浏览器中访问应用
# 示例代码已集成在主应用中，可以直接使用
```

### 学习路径
1. **从基本示例开始** - 理解基本的Hook使用模式
2. **学习认证集成** - 了解如何与用户认证系统集成
3. **探索高级功能** - 掌握词形还原、重试等高级特性
4. **自定义扩展** - 基于示例代码开发自己的功能

### 最佳实践
- **错误处理**: 始终包含完整的错误处理逻辑
- **加载状态**: 为异步操作提供合适的加载提示
- **用户反馈**: 操作成功或失败时给予明确反馈
- **认证检查**: 需要认证的操作前先检查用户状态

---

**📦 示例状态**: ✅ 与生产代码同步  
**🎯 覆盖功能**: 认证、查询、状态管理、错误处理  
**📚 学习价值**: 实际可运行的代码示例