import axios from 'axios';
import type { WordQueryRequest, WordQueryResponse } from '@ai-voca/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params
    });
    return config;
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
   * 获取API状态
   */
  async getApiStatus(): Promise<any> {
    const response = await apiClient.get('/health');
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