/**
 * @fileoverview 收藏列表页面组件
 * @module FavoritesList
 * @description 展示用户收藏的单词列表，支持搜索、分页和删除操作
 */

import { useState, useEffect, useCallback } from 'react';
import { FavoriteWord } from '@ai-voca/shared';
import { useFavorites } from '../hooks/useFavorites';
import './FavoritesList.css';

export function FavoritesList() {
  const { favorites, loading, error, getFavoritesList, toggleFavorite } = useFavorites();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFavorite, setSelectedFavorite] = useState<FavoriteWord | null>(null);

  const pageSize = 20;

  // 加载收藏列表
  const loadFavorites = useCallback(async (page = 1, search = '') => {
    try {
      const result = await getFavoritesList(page, pageSize, search);
      if (result.success && result.data) {
        setTotalPages(Math.ceil(result.data.total / pageSize));
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('加载收藏列表失败:', error);
    }
  }, [getFavoritesList]);

  // 初始加载
  useEffect(() => {
    loadFavorites(1, searchTerm);
  }, [loadFavorites, searchTerm]);

  // 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadFavorites(1, searchTerm);
  };

  // 页码切换
  const handlePageChange = (page: number) => {
    loadFavorites(page, searchTerm);
  };

  // 取消收藏
  const handleRemoveFavorite = async (favorite: FavoriteWord) => {
    try {
      await toggleFavorite(favorite.word);
      // 重新加载当前页
      loadFavorites(currentPage, searchTerm);
      // 如果当前显示的就是被删除的项目，清空显示
      if (selectedFavorite?.id === favorite.id) {
        setSelectedFavorite(null);
      }
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && favorites.length === 0) {
    return (
      <div className="favorites-list">
        <div className="loading">加载收藏列表中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-list">
        <div className="error">
          <p>加载失败: {error}</p>
          <button onClick={() => loadFavorites(1, searchTerm)} className="retry-button">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-list">
      <div className="favorites-header">
        <h1>我的收藏</h1>
        <p className="favorites-count">共 {favorites.length} 个单词</p>
      </div>

      {/* 搜索框 */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索收藏的单词..."
          className="search-input"
        />
        <button type="submit" className="search-button">搜索</button>
      </form>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <p>暂无收藏的单词</p>
          <p className="empty-hint">查询单词后点击收藏按钮即可添加到这里</p>
        </div>
      ) : (
        <div className="favorites-content">
          {/* 收藏列表 */}
          <div className="favorites-grid">
            {favorites.map((favorite) => (
              <div 
                key={favorite.id} 
                className={`favorite-card ${selectedFavorite?.id === favorite.id ? 'selected' : ''}`}
                onClick={() => setSelectedFavorite(favorite)}
              >
                <div className="favorite-card-header">
                  <h3 className="favorite-word">{favorite.word}</h3>
                  {favorite.originalQuery && favorite.originalQuery !== favorite.word && (
                    <span className="original-query">({favorite.originalQuery})</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(favorite);
                    }}
                    className="remove-favorite-button"
                    title="取消收藏"
                  >
                    ×
                  </button>
                </div>
                <div className="favorite-definition">
                  {favorite.queryData.definition.length > 100
                    ? `${favorite.queryData.definition.substring(0, 100)}...`
                    : favorite.queryData.definition
                  }
                </div>
                <div className="favorite-meta">
                  <span className="favorite-date">{formatDate(favorite.createdAt)}</span>
                  {favorite.notes && (
                    <span className="has-notes">📝</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-button"
              >
                上一页
              </button>
              <span className="page-info">
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-button"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      {/* 详情面板 */}
      {selectedFavorite && (
        <div className="favorite-detail-overlay" onClick={() => setSelectedFavorite(null)}>
          <div className="favorite-detail" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h2>{selectedFavorite.word}</h2>
              <button
                onClick={() => setSelectedFavorite(null)}
                className="close-detail-button"
              >
                ×
              </button>
            </div>
            <div className="detail-content">
              {selectedFavorite.queryData.pronunciation && (
                <div className="detail-pronunciation">
                  /{selectedFavorite.queryData.pronunciation}/
                </div>
              )}
              {selectedFavorite.queryData.partOfSpeech && (
                <div className="detail-part-of-speech">
                  {selectedFavorite.queryData.partOfSpeech}
                </div>
              )}
              <div className="detail-definition">
                <h3>释义</h3>
                <div 
                  dangerouslySetInnerHTML={{ __html: selectedFavorite.queryData.definition }}
                />
              </div>
              {selectedFavorite.queryData.examples && selectedFavorite.queryData.examples.length > 0 && (
                <div className="detail-examples">
                  <h3>例句</h3>
                  {selectedFavorite.queryData.examples.map((example, index) => (
                    <div key={index} className="detail-example">
                      <div className="example-sentence">{example.sentence}</div>
                      {example.translation && (
                        <div className="example-translation">{example.translation}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {selectedFavorite.notes && (
                <div className="detail-notes">
                  <h3>笔记</h3>
                  <p>{selectedFavorite.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}