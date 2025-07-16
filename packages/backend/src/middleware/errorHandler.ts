import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  
  // 默认错误信息
  let statusCode = error.statusCode || 500;
  let message = error.message || '服务器内部错误';
  let code = error.code || 'INTERNAL_ERROR';
  
  // 处理特定错误类型
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '请求参数验证失败';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '未授权访问';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = '无效的数据格式';
    code = 'INVALID_FORMAT';
  }
  
  // 生产环境下隐藏错误堆栈
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(isDevelopment && { stack: error.stack })
    },
    timestamp: Date.now()
  });
}