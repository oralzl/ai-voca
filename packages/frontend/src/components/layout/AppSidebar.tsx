import React, { useState } from 'react';
import { Brain, Search, Star, BookOpen, LogIn } from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/components/Auth/UserProfile';
import { AuthModal } from '@/components/Auth/AuthModal';

// 根据环境决定是否显示调试功能
const getNavigation = () => {
  const baseNavigation: Array<{
    name: string;
    key: 'search' | 'quick_fav' | 'favorites' | 'review';
    icon: React.ComponentType<{ className?: string }>;
  }> = [{
    name: '单词查询',
    key: 'search',
    icon: Search
  }, {
    name: '一键收藏',
    key: 'quick_fav',
    icon: Star
  }, {
    name: '我的收藏',
    key: 'favorites',
    icon: Star
  }, {
    name: '复习',
    key: 'review',
    icon: BookOpen
  }];
  
  // 已移除调试功能入口
  
  return baseNavigation;
};

interface AppSidebarProps {
  className?: string;
  currentPage: 'search' | 'quick_fav' | 'favorites' | 'review' | 'profile';
  onPageChange: (page: 'search' | 'quick_fav' | 'favorites' | 'review' | 'profile') => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ 
  className, 
  currentPage, 
  onPageChange 
}) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const isActive = (key: 'search' | 'quick_fav' | 'favorites' | 'review' | 'profile') => currentPage === key;

  return (
    <>
      <Sidebar className={cn("border-r bg-card/50 backdrop-blur-sm", className)}>
        <SidebarContent>
          {/* Brand */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center space-x-3 hover-lift cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">AI-Voca-2</h1>
                <p className="text-xs text-muted-foreground">智能词汇助手</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <SidebarGroup className="px-6 py-6">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {getNavigation().map(item => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        className={cn(
                          "w-full justify-start space-x-4 px-6 py-5 rounded-lg transition-all text-base",
                          isActive(item.key) 
                            ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => onPageChange(item.key)}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="font-semibold">{item.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* User Profile */}
          <div className="mt-auto p-4 border-t border-border/50">
            {user ? (
              <div className="space-y-2">
                <UserProfile onClick={() => onPageChange('profile')} />
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                variant="ghost"
                className="w-full justify-start space-x-4 px-6 py-5 rounded-lg hover:bg-muted/50 text-base"
              >
                <LogIn className="w-6 h-6" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">登录/注册</span>
                  <span className="text-sm text-muted-foreground">体验完整功能</span>
                </div>
              </Button>
            )}
          </div>
        </SidebarContent>
      </Sidebar>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}; 