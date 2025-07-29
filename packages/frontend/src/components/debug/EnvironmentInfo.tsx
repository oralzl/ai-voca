/**
 * @fileoverview 环境信息显示组件 - 用于测试和调试
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronDown, ChevronUp, Database, Globe, Key, Server } from 'lucide-react';

interface EnvironmentInfoProps {
  className?: string;
}

export function EnvironmentInfo({ className }: EnvironmentInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取环境信息
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '未配置';
  const isPreviewEnvironment = supabaseUrl.includes('ogdqwsminccyayybqrrd') || 
                              window.location.hostname !== 'ai-voca-frontend.vercel.app';
  
  // 安全地显示URL前缀
  const urlPrefix = supabaseUrl.startsWith('https://') 
    ? supabaseUrl.substring(8, 20) + '...' 
    : supabaseUrl;

  const environmentType = isPreviewEnvironment ? '测试环境' : '生产环境';
  const environmentColor = isPreviewEnvironment ? 'bg-yellow-500' : 'bg-green-500';
  
  // 检查关键环境变量
  const envVars = {
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL ? '✅ 已配置' : '❌ 未配置',
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 已配置' : '❌ 未配置',
  };

  return (
    <Card className={`${className} border-dashed`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Server className="w-4 h-4" />
            环境信息测试
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* 基本环境信息 */}
        <div className="flex items-center gap-2">
          <Badge className={`${environmentColor} text-white`}>
            {environmentType}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {isPreviewEnvironment ? '🧪 预览环境正在使用测试数据库' : '🌐 生产环境'}
          </span>
        </div>

        {/* 数据库信息 */}
        <div className="flex items-center gap-2 text-sm">
          <Database className="w-4 h-4 text-blue-500" />
          <span className="font-medium">数据库:</span>
          <code className="bg-muted px-2 py-1 rounded text-xs">{urlPrefix}</code>
        </div>

        {/* 域名信息 */}
        <div className="flex items-center gap-2 text-sm">
          <Globe className="w-4 h-4 text-green-500" />
          <span className="font-medium">域名:</span>
          <code className="bg-muted px-2 py-1 rounded text-xs">{window.location.hostname}</code>
        </div>

        {/* 展开的详细信息 */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t border-dashed">
            <div className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-500" />
              环境变量状态
            </div>
            
            <div className="grid gap-2">
              {Object.entries(envVars).map(([key, status]) => (
                <div key={key} className="flex justify-between items-center text-xs">
                  <code className="bg-muted px-2 py-1 rounded">{key}</code>
                  <span>{status}</span>
                </div>
              ))}
            </div>

            {isPreviewEnvironment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <div className="text-sm font-medium text-yellow-800 mb-1">
                  🧪 预览环境测试提示
                </div>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• 此环境使用独立的测试数据库</li>
                  <li>• 可以安全测试所有功能</li>
                  <li>• 不会影响生产用户数据</li>
                  <li>• 测试完成后会自动清理</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}