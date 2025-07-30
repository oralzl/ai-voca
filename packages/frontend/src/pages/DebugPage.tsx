/**
 * @fileoverview 调试页面
 * @module DebugPage
 * @description 用于调试环境变量和认证状态
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function DebugPage() {
  const { user, session, loading } = useAuth();
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [apiTest, setApiTest] = useState<any>(null);

  useEffect(() => {
    // 检查环境变量
    const envData = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置',
      VITE_API_URL: import.meta.env.VITE_API_URL || '未设置',
      MODE: import.meta.env.MODE,
      PROD: import.meta.env.PROD,
      DEV: import.meta.env.DEV,
      VERCEL_ENV: import.meta.env.VITE_VERCEL_ENV || '未设置',
      NODE_ENV: import.meta.env.VITE_NODE_ENV || '未设置',
      timestamp: new Date().toISOString()
    };
    setEnvInfo(envData);

    // 测试 API
    fetch('/api/test-env')
      .then(res => res.json())
      .then(data => setApiTest(data))
      .catch(err => setApiTest({ error: err.message }));
  }, []);

  const testAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      alert(`Session: ${session ? '已登录' : '未登录'}`);
    } catch (error) {
      console.error('Auth test error:', error);
      alert(`Auth test error: ${error}`);
    }
  };

  const testApiWithAuth = async () => {
    try {
      console.log('开始 API 测试...');
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session 信息:', {
        hasSession: !!session,
        hasToken: !!session?.access_token,
        tokenLength: session?.access_token?.length || 0
      });
      
      if (!session?.access_token) {
        alert('请先登录 - 没有找到有效的认证 token');
        return;
      }

      console.log('准备发送 API 请求...');
      const response = await fetch('/api/words/query?word=hello', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API 响应状态:', response.status, response.statusText);
      const data = await response.json();
      console.log('API 响应数据:', data);
      
      if (data.success) {
        alert(`API 测试成功！\n单词: ${data.data?.word}\n定义: ${data.data?.definition?.substring(0, 50)}...`);
      } else {
        alert(`API 测试失败: ${data.error}`);
      }
    } catch (error) {
      console.error('API test error:', error);
      alert(`API 测试错误: ${error}`);
    }
  };

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">调试页面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 认证状态 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">认证状态</h2>
          <div className="space-y-2">
            <p><strong>用户:</strong> {user ? user.email : '未登录'}</p>
            <p><strong>Session:</strong> {session ? '已建立' : '未建立'}</p>
            <p><strong>Token:</strong> {session?.access_token ? '已获取' : '未获取'}</p>
            <button 
              onClick={testAuth}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              测试认证
            </button>
          </div>
        </div>

        {/* 环境变量 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">环境变量</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(envInfo, null, 2)}
          </pre>
        </div>

        {/* API 测试 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">API 测试</h2>
          <div className="space-y-2">
            <button 
              onClick={testApiWithAuth}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              测试 API (带认证)
            </button>
            <button 
              onClick={async () => {
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  console.log('当前 Session:', session);
                  alert(`Session: ${session ? '已登录' : '未登录'}\nToken: ${session?.access_token ? '已获取' : '未获取'}`);
                } catch (error) {
                  console.error('Session 检查错误:', error);
                  alert(`Session 检查错误: ${error}`);
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              检查当前 Session
            </button>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          </div>
        </div>

        {/* 登录表单 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">快速登录</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        alert(`登录失败: ${error.message}`);
      } else {
        alert('登录成功！');
      }
    } catch (error) {
      alert(`登录错误: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-2">
      <input
        type="email"
        placeholder="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
} 