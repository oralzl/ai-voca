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
  ChevronUp
} from 'lucide-react';
import type { 
  GeneratedItem, 
  TargetPosition, 
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

interface HighlightedTextProps {
  text: string;
  targets: TargetPosition[];
  className?: string;
}

/**
 * 高亮显示目标词的文本组件
 */
function HighlightedText({ text, targets, className = '' }: HighlightedTextProps) {
  if (targets.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // 按位置排序目标词
  const sortedTargets = [...targets].sort((a, b) => a.begin - b.begin);
  
  const parts: JSX.Element[] = [];
  let lastIndex = 0;

  sortedTargets.forEach((target, index) => {
    // 添加目标词前的文本
    if (target.begin > lastIndex) {
      parts.push(
        <span key={`text-${index}`} className={className}>
          {text.slice(lastIndex, target.begin)}
        </span>
      );
    }

    // 添加高亮的目标词
    parts.push(
      <span
        key={`target-${index}`}
        className={`${className} bg-yellow-200 dark:bg-yellow-800/30 font-semibold px-1 rounded`}
        title={`目标词: ${target.word}`}
      >
        {text.slice(target.begin, target.end)}
      </span>
    );

    lastIndex = target.end;
  });

  // 添加剩余的文本
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end" className={className}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
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
  const hasNewTerms = item.self_eval.new_terms && item.self_eval.new_terms.length > 0;

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4 space-y-3">
        {/* 句子内容 */}
        <div className="space-y-2">
          <div className="text-lg leading-relaxed">
            <HighlightedText
              text={item.text}
              targets={item.targets}
              className="text-foreground"
            />
          </div>
          
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