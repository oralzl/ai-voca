/**
 * @fileoverview 单词查询结果展示组件
 * @module WordResult
 * @description 展示AI返回的单词释义、例句、同义词、反义词、词源和记忆技巧等信息
 */

import { useState } from 'react';
import { WordQueryResponse, formatTimestamp } from '@ai-voca/shared';
import { useFavorites } from '../hooks/useFavorites';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

import { 
  Star, 
  Volume2, 
  RotateCcw, 
  Copy, 
  FileText,
  Languages,
  BookOpen,
  Lightbulb,
  Clock,
  ChevronDown,
  Code,
  Loader2,
  Info,
  X,
  AlertCircle
} from 'lucide-react';

interface WordResultProps {
  result: WordQueryResponse;
  onClear: () => void;
  onRetry: () => void;
  loading?: boolean;
  originalQuery?: string; // 用户的原始查询词
}

export function WordResult({ result, onClear, onRetry, loading = false, originalQuery }: WordResultProps) {
  const { toggleFavorite } = useFavorites();
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showLemmatizationModal, setShowLemmatizationModal] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<'uk' | 'us' | null>(null);
  const [audioError, setAudioError] = useState<{ uk?: boolean; us?: boolean }>({});

  const handleToggleFavorite = async () => {
    if (!result.data?.text) return;
    
    console.log('收藏操作开始，数据预览:', {
      word: result.data.text,
      originalQuery: originalQuery || result.data.word,
      hasQueryData: !!result.data,
      hasRawResponse: !!result.rawResponse,
      rawResponseLength: result.rawResponse?.length || 0,
      rawResponsePreview: result.rawResponse ? result.rawResponse.substring(0, 100) + '...' : null
    });
    
    setFavoriteLoading(true);
    try {
      await toggleFavorite(
        result.data.text,           // lemma后的标准单词
        originalQuery || result.data.word,  // 原始查询词
        result.data,                // 完整的单词数据
        result.rawResponse          // AI原始响应内容
      );
      // 更新本地状态
      result.isFavorited = !result.isFavorited;
    } catch (error) {
      console.error('收藏操作失败:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!result.data) return;
    const text = `${result.data.word} - ${result.data.definition}`;
    navigator.clipboard.writeText(text);
  };

  const playPronunciation = async (word: string, accent: 'uk' | 'us') => {
    const audioUrl = `https://api.dictionaryapi.dev/media/pronunciations/en/${word}-${accent}.mp3`;
    
    setPlayingAudio(accent);
    setAudioError(prev => ({ ...prev, [accent]: false }));
    
    try {
      const audio = new Audio(audioUrl);
      
      audio.addEventListener('ended', () => {
        setPlayingAudio(null);
      });
      
      audio.addEventListener('error', () => {
        console.warn(`音频文件不存在: ${audioUrl}`);
        setAudioError(prev => ({ ...prev, [accent]: true }));
        setPlayingAudio(null);
      });
      
      await audio.play();
    } catch (error) {
      console.error('播放音频失败:', error);
      setAudioError(prev => ({ ...prev, [accent]: true }));
      setPlayingAudio(null);
    }
  };
  
  if (!result.success || !result.data) {
    return (
      <Card className="shadow-medium border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <h3 className="text-destructive font-semibold mb-2">查询失败</h3>
          <p className="text-muted-foreground mb-4">{result.error || '未知错误'}</p>
          <Button onClick={onClear} variant="outline">
            重新查询
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { data } = result;

  return (
    <Card className="shadow-medium border-0 animate-slide-up">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-xl sm:text-2xl font-bold break-words">
                  {data.word}
                </CardTitle>
                {/* 词形还原说明图标 */}
                {data.lemmatizationExplanation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowLemmatizationModal(true)}
                    title="查看词形还原说明"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 mt-2">
              {data.pronunciation && (
                <>
                  {typeof data.pronunciation === 'string' ? (
                    // 旧格式：单个音标
                    <span className="text-muted-foreground font-mono text-sm break-all">
                      /{data.pronunciation}/
                    </span>
                  ) : (
                    // 新格式：英式和美式音标
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      {data.pronunciation.uk && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs px-1 py-0">英</Badge>
                          <span className="text-muted-foreground font-mono text-sm">
                            /{data.pronunciation.uk}/
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => playPronunciation(data.text || data.word, 'uk')}
                            disabled={playingAudio === 'uk' || audioError.uk}
                          >
                            {playingAudio === 'uk' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : audioError.uk ? (
                              <AlertCircle className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}
                      {data.pronunciation.us && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs px-1 py-0">美</Badge>
                          <span className="text-muted-foreground font-mono text-sm">
                            /{data.pronunciation.us}/
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => playPronunciation(data.text || data.word, 'us')}
                            disabled={playingAudio === 'us' || audioError.us}
                          >
                            {playingAudio === 'us' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : audioError.us ? (
                              <AlertCircle className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
            <Button 
              variant={result.isFavorited ? "default" : "outline"} 
              size="sm" 
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className="text-xs"
            >
              {favoriteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {result.isFavorited ? (
                    <Star className="w-4 h-4 sm:mr-2 fill-current" />
                  ) : (
                    <Star className="w-4 h-4 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">
                    {result.isFavorited ? '已收藏' : '收藏'}
                  </span>
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={onRetry} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 释义 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">释义</h3>
          </div>
          <div 
            className="text-lg leading-relaxed bg-muted/50 p-4 rounded-lg"
            dangerouslySetInnerHTML={{ __html: data.definition }}
          />
          {/* 简单解释合并显示 */}
          {data.simpleExplanation && (
            <div 
              className="text-lg leading-relaxed bg-muted/50 p-4 rounded-lg"
              dangerouslySetInnerHTML={{ __html: data.simpleExplanation }}
            />
          )}
        </div>

        <Separator />

        {/* 例句 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Languages className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">例句</h3>
          </div>
          
          {(data.examples && data.examples.length > 0) ? (
            <div className="space-y-4">
              {data.examples.map((example, index) => (
                <div key={index} className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <p className="font-medium">{example.sentence}</p>
                  {example.translation && (
                    <p className="text-muted-foreground">{example.translation}</p>
                  )}
                </div>
              ))}
            </div>
          ) : data.example && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="font-medium">{data.example}</p>
            </div>
          )}
        </div>

        {/* 同义词和反义词 */}
        {((data.synonyms && data.synonyms.length > 0) || (data.antonyms && data.antonyms.length > 0)) && (
          <>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 同义词 */}
              {(data.synonyms && data.synonyms.length > 0) && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600 dark:text-green-400">同义词</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.synonyms.map((synonym, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/20"
                      >
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 反义词 */}
              {(data.antonyms && data.antonyms.length > 0) && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600 dark:text-red-400">反义词</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.antonyms.map((antonym, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/20"
                      >
                        {antonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* 词源 */}
        {data.etymology && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-orange-500" />
                <h4 className="font-semibold">词源</h4>
              </div>
              <p className="text-muted-foreground bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                {data.etymology}
              </p>
            </div>
          </>
        )}

        {/* 记忆技巧 */}
        {data.memoryTips && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-orange-500" />
                <h4 className="font-semibold">记忆技巧</h4>
              </div>
              <div 
                className="text-muted-foreground bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800"
                dangerouslySetInnerHTML={{ __html: data.memoryTips }}
              />
            </div>
          </>
        )}

        {/* 原始响应 */}
        {result.rawResponse && (
          <>
            <Separator />
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-0">
                  <Code className="w-4 h-4" />
                  <span>查看原始响应</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">{result.rawResponse}</pre>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigator.clipboard.writeText(result.rawResponse!)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  复制到剪贴板
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* 底部操作和时间戳 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>查询时间: {formatTimestamp(result.timestamp)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleCopyResult}>
              <Copy className="w-4 h-4 mr-2" />
              复制结果
            </Button>
            <Button variant="outline" size="sm" onClick={onClear}>
              清空结果
            </Button>
          </div>
        </div>
      </CardContent>

      {/* 词形还原说明弹窗 */}
      {showLemmatizationModal && data.lemmatizationExplanation && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLemmatizationModal(false)}
        >
          <div 
            className="bg-background rounded-lg shadow-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">词形还原说明</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLemmatizationModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <p className="text-sm text-foreground leading-relaxed">
                {data.lemmatizationExplanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}