/**
 * @fileoverview API客户端封装
 * @module api
 * @description 封装所有API请求，包括认证、请求和响应拦截器、错误处理
 */

import axios from 'axios';
import type { WordQueryRequest, WordQueryResponse } from '@ai-voca/shared';
import { supabase } from '../lib/supabase';

// 在Vercel部署环境中，API Routes使用相对路径
// 本地开发时使用localhost:3000，生产/预览环境使用当前域名
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// 调试信息 - 临时添加
console.log('🔍 API Configuration Debug:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  all_env_vars: import.meta.env
});

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // 获取当前用户的session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        data: config.data,
        params: config.params,
        hasAuth: !!session?.access_token
      });
      
      return config;
    } catch (error) {
      console.error('Error adding auth token:', error);
      return config;
    }
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // 处理网络错误
    if (!error.response) {
      error.message = '网络连接失败，请检查网络设置';
    }
    
    return Promise.reject(error);
  }
);

export const wordApi = {
  /**
   * 查询单词解释
   */
  async queryWord(request: WordQueryRequest): Promise<WordQueryResponse> {
    const response = await apiClient.post<WordQueryResponse>('/api/words/query', request);
    return response.data;
  },

  /**
   * 获取用户统计信息
   */
  async getUserStats(): Promise<any> {
    const response = await apiClient.get('/api/user/stats');
    return response.data;
  },

  /**
   * 获取API状态
   */
  async getApiStatus(): Promise<any> {
    const response = await apiClient.get('/api/health');
    return response.data;
  },

  /**
   * 获取API文档
   */
  async getApiDocs(): Promise<any> {
    const response = await apiClient.get('/api/words');
    return response.data;
  }
};

export default apiClient;