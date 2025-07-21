/**
 * @fileoverview 收藏功能Mock API客户端 (用于开发测试)
 * @module mockFavoritesApi
 * @description 模拟收藏API调用，用于在没有后端API的情况下测试前端功能
 */

import { 
  FavoriteToggleRequest,
  FavoriteToggleResponse,
  FavoriteCheckResponse,
  FavoriteListResponse,
  FavoriteWord,
  WordExplanation 
} from '@ai-voca/shared';

// 模拟的本地存储
let mockFavorites: FavoriteWord[] = [];
let nextId = 1;

// 从localStorage加载数据
function loadMockData() {
  try {
    const saved = localStorage.getItem('mock_favorites');
    if (saved) {
      mockFavorites = JSON.parse(saved);
      nextId = Math.max(...mockFavorites.map(f => parseInt(f.id)), 0) + 1;
    }
  } catch (e) {
    console.error('加载mock数据失败:', e);
  }
}

// 保存到localStorage
function saveMockData() {
  try {
    localStorage.setItem('mock_favorites', JSON.stringify(mockFavorites));
  } catch (e) {
    console.error('保存mock数据失败:', e);
  }
}

// 初始化
loadMockData();

export class MockFavoritesApiClient {
  private delay(ms: number = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(request: FavoriteToggleRequest): Promise<FavoriteToggleResponse> {
    await this.delay(300); // 模拟网络延迟

    console.log('Mock toggleFavorite:', request);

    const word = request.word.toLowerCase().trim();
    const existingIndex = mockFavorites.findIndex(f => f.word === word);

    if (existingIndex >= 0) {
      // 已收藏，执行取消收藏
      mockFavorites.splice(existingIndex, 1);
      saveMockData();

      return {
        success: true,
        data: {
          isFavorited: false
        }
      };
    } else {
      // 未收藏，执行添加收藏
      if (!request.queryData) {
        return {
          success: false,
          error: '添加收藏时需要提供单词数据'
        };
      }

      const newFavorite: FavoriteWord = {
        id: nextId.toString(),
        word,
        originalQuery: request.originalQuery || word,
        queryData: request.queryData,
        notes: request.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockFavorites.unshift(newFavorite); // 添加到开头
      nextId++;
      saveMockData();

      return {
        success: true,
        data: {
          isFavorited: true,
          favorite: newFavorite
        }
      };
    }
  }

  /**
   * 检查收藏状态
   */
  async checkFavorite(word: string): Promise<FavoriteCheckResponse> {
    await this.delay(100); // 更短的延迟

    console.log('Mock checkFavorite:', word);

    const normalizedWord = word.toLowerCase().trim();
    const favorite = mockFavorites.find(f => f.word === normalizedWord);

    if (favorite) {
      return {
        success: true,
        data: {
          isFavorited: true,
          favoriteData: favorite.queryData,
          favorite
        }
      };
    } else {
      return {
        success: true,
        data: {
          isFavorited: false
        }
      };
    }
  }

  /**
   * 获取收藏列表
   */
  async getFavoritesList(
    page: number = 1, 
    pageSize: number = 20, 
    search?: string
  ): Promise<FavoriteListResponse> {
    await this.delay(400);

    console.log('Mock getFavoritesList:', { page, pageSize, search });

    let filteredFavorites = [...mockFavorites];

    // 搜索过滤
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filteredFavorites = filteredFavorites.filter(f =>
        f.word.includes(searchTerm) ||
        (f.originalQuery && f.originalQuery.toLowerCase().includes(searchTerm))
      );
    }

    // 分页
    const total = filteredFavorites.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedFavorites = filteredFavorites.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        favorites: pagedFavorites,
        total,
        page,
        pageSize
      }
    };
  }
}

// 导出单例实例
export const mockFavoritesApi = new MockFavoritesApiClient();