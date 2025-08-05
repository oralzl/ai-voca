/**
 * @fileoverview 复习主界面组件
 * @module ReviewPage
 * @description 复习系统的主界面，管理复习流程、状态和用户交互
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ReviewPageProps {
  onBack: () => void;
}

export function ReviewPage({ onBack }: ReviewPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // TODO: 实现复习流程
    setLoading(false);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold">需要登录</h2>
              <p className="text-muted-foreground">请先登录以使用复习功能</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold">准备复习</h2>
              <p className="text-muted-foreground">正在加载复习内容...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold">复习出错</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </Button>
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold">词汇复习</h1>
          </div>
          
          <div className="w-20"></div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">复习功能开发中</h2>
          <p className="text-muted-foreground">
            复习系统正在开发中，敬请期待！
          </p>
          <Button onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回主页
          </Button>
        </div>
      </div>
    </div>
  );
} 