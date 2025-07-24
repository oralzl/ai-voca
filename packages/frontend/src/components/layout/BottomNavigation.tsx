import React from 'react';
import { Search, Star, User } from 'lucide-react';
import { cn } from "@/lib/utils";

const navigation = [{
  name: '单词查询',
  key: 'search' as const,
  icon: Search
}, {
  name: '我的收藏',
  key: 'favorites' as const,
  icon: Star
}, {
  name: '我的',
  key: 'profile' as const,
  icon: User
}];

interface BottomNavigationProps {
  className?: string;
  currentPage: 'search' | 'favorites' | 'profile';
  onPageChange: (page: 'search' | 'favorites' | 'profile') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  className, 
  currentPage, 
  onPageChange 
}) => {
  const isActive = (key: 'search' | 'favorites' | 'profile') => currentPage === key;

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t",
      className
    )}>
      <div className="flex items-center justify-around px-4 py-2">
        {navigation.map(item => {
          const Icon = item.icon;
          const active = isActive(item.key);
          
          return (
            <button
              key={item.name}
              onClick={() => onPageChange(item.key)}
              className={cn(
                "flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all",
                "min-w-0 flex-1 text-center",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-full transition-all",
                active && "bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  active && "text-white"
                )} />
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors truncate",
                active && "text-primary"
              )}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}; 