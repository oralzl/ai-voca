/**
 * @fileoverview 收藏功能API客户端
 * @module favoritesApi
 * @description 提供收藏相关的API调用功能
 */

import { 
  FavoriteToggleRequest,
  FavoriteToggleResponse,
  FavoriteCheckResponse,
  FavoriteListResponse,
  WordExplanation 
} from '@ai-voca/shared';
import { supabase } from '../lib/supabase';

export class FavoritesApiClient {
  private async getAuthToken(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      throw new Error('请先登录');
    }
    
    return session.access_token;
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(request: FavoriteToggleRequest): Promise<FavoriteToggleResponse> {
    const token = await this.getAuthToken();
    
    const response = await fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    const result: FavoriteToggleResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '操作失败');
    }
    
    return result;
  }

  /**
   * 检查收藏状态
   */
  async checkFavorite(word: string): Promise<FavoriteCheckResponse> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`/api/favorites/check?word=${encodeURIComponent(word)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: FavoriteCheckResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '检查收藏状态失败');
    }
    
    return result;
  }

  /**
   * 获取收藏列表
   */
  async getFavoritesList(
    page: number = 1, 
    pageSize: number = 20, 
    search?: string
  ): Promise<FavoriteListResponse> {
    const token = await this.getAuthToken();
    
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    });

    if (search && search.trim()) {
      params.set('search', search.trim());
    }

    const response = await fetch(`/api/favorites/list?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: FavoriteListResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '获取收藏列表失败');
    }
    
    return result;
  }
}

// 导出单例实例
export const favoritesApi = new FavoritesApiClient();