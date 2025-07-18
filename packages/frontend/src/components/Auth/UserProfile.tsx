import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import './UserProfile.css'

interface UserStats {
  totalQueries: number
  todayQueries: number
  remainingQueries: number
  lastQueryDate: string | null
}

export function UserProfile() {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserStats()
    }
  }, [user])

  const fetchUserStats = async () => {
    if (!user) return

    try {
      const { wordApi } = await import('../../utils/api')
      const response = await wordApi.getUserStats()
      
      if (response.success) {
        setStats({
          totalQueries: response.data.totalQueries || 0,
          todayQueries: response.data.todayQueries || 0,
          remainingQueries: response.data.remainingQueries || 100,
          lastQueryDate: response.data.lastQueryDate,
        })
      } else {
        // 新用户或获取失败，设置默认值
        setStats({
          totalQueries: 0,
          todayQueries: 0,
          remainingQueries: 100,
          lastQueryDate: null,
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      // 降级处理
      setStats({
        totalQueries: 0,
        todayQueries: 0,
        remainingQueries: 100,
        lastQueryDate: null,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setShowDropdown(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getDisplayName = () => {
    return user?.user_metadata?.display_name || user?.email?.split('@')[0] || '用户'
  }

  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || null
  }

  const getInitials = () => {
    const name = getDisplayName()
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  if (!user) return null

  return (
    <div className="user-profile">
      <div className="user-avatar" onClick={() => setShowDropdown(!showDropdown)}>
        {getAvatarUrl() ? (
          <img src={getAvatarUrl()} alt="用户头像" />
        ) : (
          <div className="avatar-placeholder">
            {getInitials()}
          </div>
        )}
        <span className="user-name">{getDisplayName()}</span>
        <span className="dropdown-arrow">▼</span>
      </div>

      {showDropdown && (
        <div className="user-dropdown">
          <div className="user-info">
            <h4>{getDisplayName()}</h4>
            <p>{user.email}</p>
          </div>

          {!loading && stats && (
            <div className="user-stats">
              <div className="stat-item">
                <span className="stat-label">今日查询</span>
                <span className="stat-value">{stats.todayQueries}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">剩余次数</span>
                <span className="stat-value">{stats.remainingQueries}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">总查询数</span>
                <span className="stat-value">{stats.totalQueries}</span>
              </div>
            </div>
          )}

          <div className="dropdown-actions">
            <button onClick={handleSignOut} className="sign-out-btn">
              退出登录
            </button>
          </div>
        </div>
      )}

      {showDropdown && (
        <div 
          className="dropdown-overlay" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}