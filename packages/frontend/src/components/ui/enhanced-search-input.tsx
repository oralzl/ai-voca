import React, { useState, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  onSearch?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
  compact?: boolean; // 新增compact属性
}

export const EnhancedSearchInput: React.FC<EnhancedSearchInputProps> = ({
  value,
  onChange,
  onKeyPress,
  onSearch,
  placeholder = "输入英文单词...",
  disabled = false,
  loading = false,
  compact = false, // 默认为false，保持原有大尺寸
  className
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleContainerClick = () => {
    if (inputRef.current && !disabled && !loading) {
      inputRef.current.focus();
    }
  };

  const maxLength = 50;
  const charCount = value.length;
  const defaultDots = 6;
  const displayDots = Math.max(defaultDots, charCount);

  // Generate dots for counter
  const generateDots = () => {
    const dots = [];
    const activeCount = Math.min(charCount, displayDots);
    
    for (let i = 0; i < displayDots; i++) {
      dots.push(
        <div
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-300",
            i < activeCount 
              ? "bg-primary shadow-glow scale-110" 
              : "bg-border/30"
          )}
        />
      );
    }
    return dots;
  };

  return (
    <div className={cn("relative group w-full", className)}>
      {/* Main Input Container */}
      <div 
        className={cn(
          "relative border-2 transition-all duration-500 bg-card/50 backdrop-blur-sm cursor-text",
          "rounded-2xl overflow-hidden w-full",
          isFocused 
            ? "border-primary shadow-[0_0_40px_-12px_hsl(var(--primary))]" 
            : "border-border/20 hover:border-border/40",
          (disabled || loading) && "cursor-not-allowed opacity-50"
        )}
        onClick={handleContainerClick}
      >
        {/* Animated background glow */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5",
          "opacity-0 transition-opacity duration-500 pointer-events-none",
          isFocused && "opacity-100"
        )} />
        
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyPress={onKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || loading}
          maxLength={maxLength}
          className={cn(
            "w-full px-4 bg-transparent font-medium text-center",
            "placeholder:text-muted-foreground/60",
            "focus:outline-none transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            compact ? "h-12 text-lg" : "h-20 text-2xl", // compact模式使用较小尺寸
            isFocused && "text-foreground placeholder:text-muted-foreground/40"
          )}
          style={{
            textAlign: 'center',
            letterSpacing: '0.05em'
          }}
          autoComplete="off"
        />
        
        {/* Search Button */}
        {onSearch && (
          <button
            onClick={onSearch}
            disabled={disabled || loading}
            className={cn(
              "absolute right-4 top-1/2 transform -translate-y-1/2",
              "flex items-center justify-center w-8 h-8",
              "transition-all duration-150",
              !(disabled || loading) && "hover:scale-110 active:scale-95",
              (disabled || loading) ? "cursor-not-allowed" : ""
            )}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <Search 
                className="w-6 h-6 text-primary"
                strokeWidth={2.5}
              />
            )}
          </button>
        )}
        
        {/* Scanning line effect */}
        <div className={cn(
          "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent pointer-events-none",
          "transition-all duration-1000 ease-in-out",
          isFocused ? "w-full opacity-100" : "w-0 opacity-0"
        )} />
        
        {/* Character Counter with Dots */}
        <div className={cn(
          "absolute left-1/2 transform -translate-x-1/2 flex justify-center items-center space-x-1 min-h-[12px]",
          compact ? "bottom-1" : "bottom-2" // compact模式下调整位置
        )}>
          <div className="flex space-x-1">
            {generateDots()}
          </div>
        </div>
      </div>
    </div>
  );
}; 