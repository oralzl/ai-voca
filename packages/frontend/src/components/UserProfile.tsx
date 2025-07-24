import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen,
  LogOut,
  Settings,
  HelpCircle
} from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">请先登录以查看个人信息</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 获取用户名首字母作为头像
  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      {/* 用户信息卡片 */}
      <Card className="shadow-medium border-0 animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-primary" />
            <span>个人信息</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 头像和基本信息 */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-primary to-primary/80 text-white text-xl font-semibold">
                {getUserInitials(user.email || '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-semibold">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </h3>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  加入时间: {new Date(user.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学习统计 */}
      <Card className="shadow-medium border-0 animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>学习统计</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">查询次数</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-accent-warm">0</div>
              <div className="text-sm text-muted-foreground">收藏单词</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能菜单 */}
      <Card className="shadow-medium border-0 animate-slide-up">
        <CardContent className="p-0">
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-12 px-6"
              disabled
            >
              <Settings className="w-4 h-4 mr-3" />
              <span>设置</span>
            </Button>
            
            <Separator />
            
            <Button 
              variant="ghost" 
              className="w-full justify-start h-12 px-6"
              disabled
            >
              <HelpCircle className="w-4 h-4 mr-3" />
              <span>帮助与反馈</span>
            </Button>
            
            <Separator />
            
            <Button 
              variant="ghost" 
              className="w-full justify-start h-12 px-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-3" />
              <span>退出登录</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 版本信息 */}
      <div className="text-center text-sm text-muted-foreground">
        <p>AI-Voca-2 版本 1.0.0</p>
        <p className="mt-1">智能词汇学习助手</p>
      </div>
    </div>
  );
}; 