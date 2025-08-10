import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { wordApi } from '@/utils/api';
import { FavoriteWord, WordExplanation } from '@ai-voca/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Star, Loader2, Calendar, Eye } from 'lucide-react';

export function QuickFavoritePage() {
  const { favorites, loading, error, getFavoritesList, toggleFavorite, checkFavorite } = useFavorites();

  const [word, setWord] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const pageSize = 20;

  const loadRecent = useCallback(async () => {
    try {
      await getFavoritesList(1, pageSize);
    } catch (e) {
      // 已在hook中处理错误
    }
  }, [getFavoritesList]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleSubmit = useCallback(async () => {
    const input = word.trim();
    if (!input) return;
    setSubmitting(true);
    setSubmitError(null);
    setLastAdded(null);

    try {
      const response = await wordApi.queryWord({ word: input, includeExample: true });
      if (!response.success || !response.data) {
        throw new Error(response.error || '查询失败');
      }

      const data: WordExplanation = response.data;
      const lemma = (data.text || input).toLowerCase().trim();

      const check = await checkFavorite(lemma);
      if (check.isFavorited) {
        // 已收藏：直接刷新最近列表，清空输入
        setWord('');
        setLastAdded(lemma);
        await loadRecent();
        setSubmitting(false);
        return;
      }

      const added = await toggleFavorite(lemma, input, data, response.rawResponse);
      if (!added) {
        throw new Error('收藏失败');
      }

      setWord('');
      setLastAdded(lemma);
      await loadRecent();
    } catch (e: any) {
      setSubmitError(e.message || '操作失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }, [word, checkFavorite, toggleFavorite, loadRecent]);

  const RecentItem = ({ item }: { item: FavoriteWord }) => (
    <Card className="hover:bg-muted/40 transition-colors border-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg text-primary">{item.word}</h3>
              {item.originalQuery && item.originalQuery !== item.word && (
                <span className="text-sm text-muted-foreground italic">({item.originalQuery})</span>
              )}
              <Badge variant="outline" className="px-2 py-0.5">
                <Star className="w-3 h-3 mr-1" /> 已收藏
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {item.queryData.definition.length > 120
                ? `${item.queryData.definition.substring(0, 120)}...`
                : item.queryData.definition}
            </p>
            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(item.createdAt)}</span>
              </span>
              {lastAdded === item.word && (
                <span className="text-primary">刚刚添加</span>
              )}
            </div>
          </div>
          {/* 预留详情入口（可跳转到结果页），当前只展示 */}
          <div className="opacity-60">
            <Eye className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 p-4 pb-20 md:pb-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-2 pb-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gradient">一键收藏</h1>
            <p className="text-muted-foreground">粘贴单词后会自动完成“查询→收藏”，并在下方展示最近收藏</p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <Star className="w-3 h-3 mr-1" /> 最近 {Math.min(favorites.length, pageSize)} 条
          </Badge>
        </div>

        {/* Input */}
        <Card className="border-0 shadow-none bg-card/50 backdrop-blur">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="粘贴你要收藏的英文单词..."
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>
              <Button onClick={handleSubmit} disabled={!word.trim() || submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 处理中
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" /> 一键收藏
                  </>
                )}
              </Button>
            </div>
            {submitError && (
              <div className="text-sm text-destructive">{submitError}</div>
            )}
            <div className="text-xs text-muted-foreground">提示：不支持批量，一次只处理一个单词</div>
          </CardContent>
        </Card>

        {/* Recent */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">最近收藏</h2>
          {loading && favorites.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : error ? (
            <Card className="p-6 border-dashed text-center">
              <div className="text-destructive">加载失败：{error}</div>
            </Card>
          ) : favorites.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <CardDescription>还没有收藏记录，先在上方粘贴一个单词试试</CardDescription>
            </Card>
          ) : (
            <div className="space-y-2">
              {favorites.slice(0, pageSize).map((f) => (
                <RecentItem key={f.id} item={f} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickFavoritePage;


