import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './LoginForm.css'

interface LoginFormProps {
  onSwitchToSignup: () => void
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResetPassword, setShowResetPassword] = useState(false)

  const { signIn, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      }
    } catch (error) {
      setError('登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('请输入邮箱地址')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
      } else {
        setError(null)
        alert('重置密码邮件已发送，请查收邮箱')
        setShowResetPassword(false)
      }
    } catch (error) {
      setError('发送重置邮件失败')
    } finally {
      setLoading(false)
    }
  }

  if (showResetPassword) {
    return (
      <div className="auth-form">
        <h2>重置密码</h2>
        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label htmlFor="email">邮箱地址</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入您的邮箱"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? '发送中...' : '发送重置邮件'}
          </button>

          <button
            type="button"
            onClick={() => setShowResetPassword(false)}
            className="link-btn"
          >
            返回登录
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="auth-form">
      <h2>登录</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">邮箱地址</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? '登录中...' : '登录'}
        </button>

        <div className="form-links">
          <button
            type="button"
            onClick={() => setShowResetPassword(true)}
            className="link-btn"
          >
            忘记密码？
          </button>
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="link-btn"
          >
            还没有账号？立即注册
          </button>
        </div>
      </form>
    </div>
  )
}