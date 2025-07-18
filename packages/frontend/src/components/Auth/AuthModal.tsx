import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import './AuthModal.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)

  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button 
          className="close-btn"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
        
        <div className="auth-modal-content">
          {isLogin ? (
            <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
          ) : (
            <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  )
}