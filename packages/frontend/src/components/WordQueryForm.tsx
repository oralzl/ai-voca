import { useState, FormEvent } from 'react';
import { isValidWord } from '@ai-voca/shared';
import './WordQueryForm.css';

interface WordQueryFormProps {
  onQuery: (word: string, includeExample: boolean) => void;
  loading: boolean;
  onClear: () => void;
}

export function WordQueryForm({ onQuery, loading, onClear }: WordQueryFormProps) {
  const [word, setWord] = useState('');
  const [includeExample, setIncludeExample] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!word.trim()) {
      setError('请输入要查询的单词');
      return;
    }
    
    if (!isValidWord(word)) {
      setError('请输入有效的单词（仅支持字母、数字、连字符和空格）');
      return;
    }
    
    setError('');
    onQuery(word.trim(), includeExample);
  };

  const handleClear = () => {
    setWord('');
    setError('');
    onClear();
  };

  return (
    <form className="word-query-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="word-input">输入单词：</label>
        <input
          id="word-input"
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="请输入要查询的单词..."
          className="word-input"
          disabled={loading}
        />
      </div>
      
      <div className="form-options">
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeExample}
              onChange={(e) => setIncludeExample(e.target.checked)}
              disabled={loading}
            />
            <span className="checkbox-text">包含例句</span>
          </label>
        </div>
      </div>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      <div className="form-actions">
        <button
          type="submit"
          className="query-button"
          disabled={loading || !word.trim()}
        >
          {loading ? '查询中...' : '查询单词'}
        </button>
        
        <button
          type="button"
          className="clear-button"
          onClick={handleClear}
          disabled={loading}
        >
          清空
        </button>
      </div>
    </form>
  );
}