import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { BottomNavigation } from './BottomNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: 'search' | 'favorites' | 'review' | 'profile';
  onPageChange: (page: 'search' | 'favorites' | 'review' | 'profile') => void;
  hideBottomNavigation?: boolean; // 新增属性，用于控制底部导航显示
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  currentPage, 
  onPageChange,
  hideBottomNavigation = false // 默认显示底部导航
}) => {
  return (
    <SidebarProvider>
      <div className="h-screen bg-gradient-to-br from-background via-background to-muted/10 flex w-full overflow-hidden">
        {/* Desktop Sidebar */}
        <AppSidebar 
          className="hidden md:flex" 
          currentPage={currentPage}
          onPageChange={onPageChange}
        />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        {!hideBottomNavigation && (
          <BottomNavigation 
            className="md:hidden" 
            currentPage={currentPage}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </SidebarProvider>
  );
}; 