/**
 * @fileoverview 用户注册表单组件
 * @module SignupForm
 * @description 处理新用户注册、邮箱验证和密码强度检查的表单组件
 */

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './LoginForm.css'

interface SignupFormProps {
  onSwitchToLogin: () => void
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 密码确认验证
    if (password !== confirmPassword) {
      setError('密码和确认密码不匹配')
      setLoading(false)
      return
    }

    // 密码强度验证
    if (password.length < 6) {
      setError('密码长度至少6位')
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(email, password, displayName)
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setError(null)
      }
    } catch (error) {
      setError('注册失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-form">
        <h2>注册成功</h2>
        <div className="success-message">
          <p>✅ 注册成功！请查收邮箱中的确认邮件。</p>
          <p>点击邮件中的确认链接后即可登录。</p>
        </div>
        <button
          onClick={onSwitchToLogin}
          className="submit-btn"
        >
          返回登录
        </button>
      </div>
    )
  }

  return (
    <div className="auth-form">
      <h2>注册</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="displayName">昵称</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="请输入昵称（可选）"
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">邮箱地址</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
            autoComplete="email"
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
            placeholder="请输入密码（至少6位）"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入密码"
            autoComplete="new-password"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? '注册中...' : '注册'}
        </button>

        <div className="form-links">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="link-btn"
          >
            已有账号？立即登录
          </button>
        </div>
      </form>
    </div>
  )
}