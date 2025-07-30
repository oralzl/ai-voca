/**
 * @fileoverview 部署测试端点 - 用于验证预览环境是否使用最新代码
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.status(200).json({
    success: true,
    message: 'Deployment test - Latest version',
    version: '2025-01-30-15:20',
    deployment: {
      timestamp: new Date().toISOString(),
      branch: 'test/preview-environment-setup',
      commitHash: '1eb6651',
      features: [
        'Fixed module-level env checks in query.ts',
        'Added version logging',
        'Force rebuild with v3 tag'
      ]
    },
    environment: {
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      hasSupabaseVars: {
        url: !!process.env.SUPABASE_URL,
        serviceKey: !!process.env.SUPABASE_SERVICE_KEY,
        anonKey: !!process.env.SUPABASE_ANON_KEY
      }
    }
  });
}