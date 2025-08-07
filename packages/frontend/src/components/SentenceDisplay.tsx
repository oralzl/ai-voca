/**
 * @fileoverview 句子展示组件
 * @module SentenceDisplay
 * @description 显示生成的句子，支持目标词高亮和新词汇提示
 */

import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  Info,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Languages
} from 'lucide-react';
import type { 
  GeneratedItem,
  NewTerm,
  CEFRLevel 
} from '@ai-voca/shared';

interface SentenceDisplayProps {
  /** 生成的句子数据 */
  item: GeneratedItem;
  /** 是否显示新词汇提示 */
  showNewTerms?: boolean;
  /** 是否可展开详细信息 */
  expandable?: boolean;
  /** 自定义样式类 */
  className?: string;
}


/**
 * 显示文本组件（不再高亮目标词）
 */
function HighlightedText({ text, className = '' }: { text: string; className?: string }) {
  // 直接显示文本，不再高亮任何内容
  return <span className={className}>{text}</span>;
}

/**
 * 新词汇提示组件
 */
function NewTermsTooltip({ newTerms }: { newTerms: NewTerm[] }) {
  if (newTerms.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            <Info className="w-3 h-3 mr-1" />
            {newTerms.length} 个新词
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2">
            <div className="font-semibold text-sm">新词汇提示</div>
            {newTerms.map((term, index) => (
              <div key={index} className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{term.surface}</span>
                  <Badge variant="secondary" className="text-xs">
                    {term.cefr}
                  </Badge>
                </div>
                <div className="text-muted-foreground">{term.gloss}</div>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * 难度等级显示组件
 */
function DifficultyBadge({ level }: { level: CEFRLevel }) {
  const getLevelColor = (level: CEFRLevel) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'B1':
      case 'B2':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'C1':
      case 'C2':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={`text-xs ${getLevelColor(level)}`}
    >
      {level}
    </Badge>
  );
}

/**
 * 句子展示组件
 */
export function SentenceDisplay({ 
  item, 
  showNewTerms = true, 
  expandable = false,
  className = ''
}: SentenceDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const hasNewTerms = item.self_eval.new_terms && item.self_eval.new_terms.length > 0;

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4 space-y-3">
        {/* 句子内容 */}
        <div className="space-y-3">
          <div className="text-lg leading-relaxed">
            <HighlightedText
              text={item.text}
              className="text-foreground"
            />
          </div>
          
          {/* 中文翻译 */}
          {showTranslation && item.translation && (
            <div className="pt-3 border-t border-border/50">
              <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Languages className="w-4 h-4" />
                <span>中文翻译</span>
              </div>
              <div className="text-base text-foreground leading-relaxed">
                {item.translation}
              </div>
            </div>
          )}
          
          {/* 目标词列表 */}
          <div className="flex flex-wrap gap-1">
            {item.targets.map((target, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {target.word}
              </Badge>
            ))}
          </div>
        </div>

        {/* 底部信息栏 */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            {/* 难度等级 */}
            <DifficultyBadge level={item.self_eval.predicted_cefr} />
            
            {/* 新词汇数量 */}
            {item.self_eval.estimated_new_terms_count > 0 && (
              <Badge variant="outline" className="text-xs">
                +{item.self_eval.estimated_new_terms_count} 新词
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 翻译按钮 */}
            {item.translation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranslation(!showTranslation)}
                className="h-6 px-2 text-xs"
              >
                <Languages className="w-3 h-3 mr-1" />
                {showTranslation ? '隐藏翻译' : '显示翻译'}
              </Button>
            )}
            
            {/* 新词汇提示 */}
            {showNewTerms && hasNewTerms && (
              <NewTermsTooltip newTerms={item.self_eval.new_terms!} />
            )}
            
            {/* 展开/收起按钮 */}
            {expandable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 px-2"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* 展开的详细信息 */}
        {expandable && isExpanded && (
          <div className="pt-3 border-t border-border/50 space-y-3">
            {/* 生成理由 */}
            {item.self_eval.reason && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  生成理由
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {item.self_eval.reason}
                </p>
              </div>
            )}
            
            {/* 新词汇详细列表 */}
            {hasNewTerms && (
              <div className="space-y-2">
                <div className="text-sm font-medium">新词汇详情</div>
                <div className="space-y-2 pl-4">
                  {item.self_eval.new_terms!.map((term, index) => (
                    <div key={index} className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{term.surface}</span>
                        <DifficultyBadge level={term.cefr} />
                      </div>
                      <div className="text-muted-foreground text-xs pl-2">
                        {term.gloss}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SentenceDisplay; 