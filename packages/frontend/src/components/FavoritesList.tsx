/**
 * @fileoverview 收藏列表页面组件
 * @module FavoritesList
 * @description 展示用户收藏的单词列表，支持搜索、分页和删除操作
 */

import { useState, useEffect, useCallback } from 'react';
import { FavoriteWord } from '@ai-voca/shared';
import { useFavorites } from '../hooks/useFavorites';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search, Star, BookOpen, Trash2, Eye, Calendar, 
  Filter, Grid3X3, List, Loader2, ArrowLeft, ArrowRight,
  Code, ChevronDown, Copy
} from 'lucide-react';

interface FavoritesListProps {
  onWordClick?: (favorite: FavoriteWord) => void;
}

export function FavoritesList({ onWordClick }: FavoritesListProps = {}) {
  const { favorites, loading, error, getFavoritesList, toggleFavorite } = useFavorites();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFavorite, setSelectedFavorite] = useState<FavoriteWord | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 调试收藏数据
  useEffect(() => {
    if (favorites.length > 0) {
      console.log('收藏列表数据:', favorites.map(f => ({
        word: f.word,
        hasRawResponse: !!f.rawResponse,
        rawResponseLength: f.rawResponse?.length || 0
      })));
    }
  }, [favorites]);

  const pageSize = 20;

  // 加载收藏列表
  const loadFavorites = useCallback(async (page = 1, search = '') => {
    try {
      const result = await getFavoritesList(page, pageSize, search);
      if (result.success && result.data) {
        console.log('收藏列表加载成功，rawResponse数据检查:', result.data.favorites.map(fav => ({
          word: fav.word,
          hasRawResponse: !!fav.rawResponse,
          rawResponseLength: fav.rawResponse?.length || 0
        })));
        setTotalPages(Math.ceil(result.data.total / pageSize));
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('加载收藏列表失败:', error);
    }
  }, [getFavoritesList]);

  // 初始加载
  useEffect(() => {
    loadFavorites(1, searchTerm);
  }, [loadFavorites, searchTerm]);



  // 页码切换
  const handlePageChange = (page: number) => {
    loadFavorites(page, searchTerm);
  };

  // 取消收藏
  const handleRemoveFavorite = async (favorite: FavoriteWord) => {
    try {
      await toggleFavorite(favorite.word);
      // 重新加载当前页
      loadFavorites(currentPage, searchTerm);
      // 如果当前显示的就是被删除的项目，清空显示
      if (selectedFavorite?.id === favorite.id) {
        setSelectedFavorite(null);
      }
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 过滤收藏列表（用于搜索）
  const filteredFavorites = favorites.filter(favorite =>
    favorite.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    favorite.queryData.definition.includes(searchTerm)
  );

  // 收藏卡片组件（网格模式）
  const FavoriteCard = ({ favorite }: { favorite: FavoriteWord }) => (
    <Card 
      className="hover-lift hover-glow transition-all duration-300 border-0 shadow-soft cursor-pointer" 
      onClick={() => onWordClick?.(favorite)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl font-bold text-primary">
              {favorite.word}
            </CardTitle>
            {favorite.originalQuery && favorite.originalQuery !== favorite.word && (
              <span className="text-sm text-muted-foreground italic">
                ({favorite.originalQuery})
              </span>
            )}
            {favorite.queryData.partOfSpeech && (
              <Badge variant="secondary" className="text-xs">
                {favorite.queryData.partOfSpeech}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                console.log('点击查看详情，收藏数据:', {
                  word: favorite.word,
                  hasRawResponse: !!favorite.rawResponse,
                  rawResponseLength: favorite.rawResponse?.length || 0,
                  rawResponseType: typeof favorite.rawResponse,
                  rawResponsePreview: favorite.rawResponse?.substring(0, 100),
                  fullFavorite: favorite
                });
                setSelectedFavorite(favorite);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFavorite(favorite);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-base leading-relaxed">
          {favorite.queryData.definition.length > 100
            ? `${favorite.queryData.definition.substring(0, 100)}...`
            : favorite.queryData.definition
          }
        </CardDescription>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(favorite.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <BookOpen className="w-3 h-3" />
            <span>
              {favorite.queryData.examples ? favorite.queryData.examples.length : 0} 个例句
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 收藏列表项组件（列表模式）
  const FavoriteListItem = ({ favorite }: { favorite: FavoriteWord }) => (
    <Card 
      className="hover:bg-muted/50 transition-colors border-0 cursor-pointer" 
      onClick={() => onWordClick?.(favorite)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-lg text-primary">{favorite.word}</h3>
              {favorite.originalQuery && favorite.originalQuery !== favorite.word && (
                <span className="text-sm text-muted-foreground italic">
                  ({favorite.originalQuery})
                </span>
              )}
              {favorite.queryData.partOfSpeech && (
                <Badge variant="secondary" className="text-xs">
                  {favorite.queryData.partOfSpeech}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {favorite.queryData.definition.length > 150
                ? `${favorite.queryData.definition.substring(0, 150)}...`
                : favorite.queryData.definition
              }
            </p>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(favorite.createdAt)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3" />
                <span>
                  {favorite.queryData.examples ? favorite.queryData.examples.length : 0} 个例句
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                console.log('列表模式 - 点击查看详情，收藏数据:', {
                  word: favorite.word,
                  hasRawResponse: !!favorite.rawResponse,
                  rawResponseLength: favorite.rawResponse?.length || 0,
                  rawResponseType: typeof favorite.rawResponse,
                  rawResponsePreview: favorite.rawResponse?.substring(0, 100),
                  fullFavorite: favorite
                });
                setSelectedFavorite(favorite);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFavorite(favorite);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 加载状态
  if (loading && favorites.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 p-6">
        <div className="flex items-center justify-center p-20">
          <div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-primary/20 rounded-full animate-pulse mx-auto"></div>
            </div>
            <p className="text-muted-foreground">
              加载收藏列表中...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 p-6">
        <div className="text-center p-20">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-destructive">加载失败</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => loadFavorites(1, searchTerm)} variant="outline">
                重试
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-8 pb-4">
      {/* Header */}
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between pt-2 pb-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gradient">我的收藏</h1>
            <p className="text-muted-foreground">
              管理你收藏的单词，建立个人词汇库
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="px-4 py-2">
              <Star className="w-3 h-3 mr-1" />
              {favorites.length} 个单词
            </Badge>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜索收藏的单词..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          找到 {filteredFavorites.length} 个匹配的单词
        </div>
      )}

      {/* Favorites Grid/List */}
      {filteredFavorites.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-3"
        }>
          {filteredFavorites.map((favorite) => 
            viewMode === 'grid' ? (
              <FavoriteCard key={favorite.id} favorite={favorite} />
            ) : (
              <FavoriteListItem key={favorite.id} favorite={favorite} />
            )
          )}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? '没有找到匹配的单词' : '还没有收藏任何单词'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? '尝试使用不同的关键词搜索' 
                  : '开始查询单词并收藏到这里，建立你的个人词汇库'
                }
              </p>
              {!searchTerm && (
                <Button className="bg-gradient-primary text-white">
                  <Search className="w-4 h-4 mr-2" />
                  开始查询单词
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              上一页
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={currentPage === page ? "bg-gradient-primary text-white" : ""}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              下一页
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* 详情面板 */}
      {selectedFavorite && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFavorite(null)}
        >
          <Card 
            className="max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b sticky top-0 bg-background">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{selectedFavorite.word}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFavorite(null)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {selectedFavorite.queryData.pronunciation && (
                <div className="text-lg text-destructive italic">
                  /{selectedFavorite.queryData.pronunciation}/
                </div>
              )}
              {selectedFavorite.queryData.partOfSpeech && (
                <Badge variant="secondary">
                  {selectedFavorite.queryData.partOfSpeech}
                </Badge>
              )}
              <div>
                <h3 className="text-lg font-semibold mb-3">释义</h3>
                <div 
                  className="text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedFavorite.queryData.definition }}
                />
              </div>
              {selectedFavorite.queryData.examples && selectedFavorite.queryData.examples.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">例句</h3>
                  <div className="space-y-4">
                    {selectedFavorite.queryData.examples.map((example, index) => (
                      <Card key={index} className="p-4 bg-muted/30">
                        <div className="space-y-2">
                          <div className="font-medium">{example.sentence}</div>
                          {example.translation && (
                            <div className="text-muted-foreground italic">{example.translation}</div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {selectedFavorite.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">笔记</h3>
                  <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <p>{selectedFavorite.notes}</p>
                  </Card>
                </div>
              )}
              {/* 原始响应 */}
              {(() => {
                console.log('检查原始响应条件:', {
                  hasRawResponse: !!selectedFavorite.rawResponse,
                  rawResponseLength: selectedFavorite.rawResponse?.length || 0,
                  rawResponseType: typeof selectedFavorite.rawResponse,
                  rawResponsePreview: selectedFavorite.rawResponse?.substring(0, 100)
                });
                return !!selectedFavorite.rawResponse;
              })() && (
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
                        <pre className="text-sm whitespace-pre-wrap">{selectedFavorite.rawResponse}</pre>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => navigator.clipboard.writeText(selectedFavorite.rawResponse!)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        复制到剪贴板
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}