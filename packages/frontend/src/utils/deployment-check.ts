/**
 * 检查当前部署环境是否支持 API 功能
 */
export async function checkApiAvailability(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    // 检查是否返回了 JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('API endpoints not available in current deployment');
      return false;
    }
    
    return response.ok;
  } catch (error) {
    console.error('API availability check failed:', error);
    return false;
  }
}

/**
 * 获取推荐的部署 URL
 */
export function getRecommendedDeploymentUrl(): string {
  return 'https://ai-voca-frontend.vercel.app';
}

/**
 * 显示部署限制提示
 */
export function showDeploymentLimitationMessage(): void {
  const message = `
    当前部署环境不支持完整的 API 功能。
    请访问 ${getRecommendedDeploymentUrl()} 以获得完整体验。
  `;
  console.warn(message);
}