/**
 * @fileoverview 单词查询结果展示组件
 * @module WordResult
 * @description 展示AI返回的单词释义、例句、同义词、反义词、词源和记忆技巧等信息
 */

import { useState } from 'react';
import { WordQueryResponse, formatTimestamp } from '@ai-voca/shared';
import './WordResult.css';

interface WordResultProps {
  result: WordQueryResponse;
  onClear: () => void;
  onRetry: () => void;
  loading?: boolean;
}

export function WordResult({ result, onClear, onRetry, loading = false }: WordResultProps) {
  const [showRawResponse, setShowRawResponse] = useState(false);
  
  if (!result.success || !result.data) {
    return (
      <div className="word-result error">
        <h3>查询失败</h3>
        <p>{result.error || '未知错误'}</p>
        <button onClick={onClear} className="clear-button">
          重新查询
        </button>
      </div>
    );
  }

  const { data } = result;

  return (
    <div className="word-result">
      <div className="result-header">
        <h2 className="word-title">{data.word}</h2>
        {data.lemmatizationExplanation && (
          <div className="lemmatization-explanation">
            <span className="lemma-label">词形还原:</span>
            <span className="lemma-text">{data.lemmatizationExplanation}</span>
          </div>
        )}
        {data.pronunciation && (
          <span className="pronunciation">/{data.pronunciation}/</span>
        )}
        {data.partOfSpeech && (
          <span className="part-of-speech">{data.partOfSpeech}</span>
        )}
      </div>
      
      <div className="result-content">
        <div className="definition-section">
          <h3>释义</h3>
          <div 
            className="definition-text"
            dangerouslySetInnerHTML={{ __html: data.definition }}
          />
        </div>
        
        {data.simpleExplanation && (
          <div className="simple-explanation-section">
            <h3>简单解释</h3>
            <div 
              className="simple-explanation-text"
              dangerouslySetInnerHTML={{ __html: data.simpleExplanation }}
            />
          </div>
        )}
        
        {(data.examples && data.examples.length > 0) ? (
          <div className="examples-section">
            <h3>例句</h3>
            <div className="examples-list">
              {data.examples.map((example, index) => (
                <div key={index} className="example-item">
                  <div className="example-sentence">{example.sentence}</div>
                  {example.translation && (
                    <div className="example-translation">{example.translation}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : data.example && (
          <div className="example-section">
            <h3>例句</h3>
            <div className="example-text">
              {data.example}
            </div>
          </div>
        )}
        
        {(data.synonyms && data.synonyms.length > 0) && (
          <div className="synonyms-section">
            <h3>同义词</h3>
            <div className="synonyms-list">
              {data.synonyms.map((synonym, index) => (
                <span key={index} className="synonym-item">
                  {synonym}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {(data.antonyms && data.antonyms.length > 0) && (
          <div className="antonyms-section">
            <h3>反义词</h3>
            <div className="antonyms-list">
              {data.antonyms.map((antonym, index) => (
                <span key={index} className="antonym-item">
                  {antonym}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {data.etymology && (
          <div className="etymology-section">
            <h3>词源</h3>
            <div className="etymology-text">
              {data.etymology}
            </div>
          </div>
        )}
        
        {data.memoryTips && (
          <div className="memory-tips-section">
            <h3>记忆技巧</h3>
            <div 
              className="memory-tips-text"
              dangerouslySetInnerHTML={{ __html: data.memoryTips }}
            />
          </div>
        )}
      </div>
      
      <div className="result-footer">
        <div className="timestamp">
          查询时间: {formatTimestamp(result.timestamp)}
        </div>
        <div className="footer-buttons">
          {result.inputParams && (
            <button 
              onClick={onRetry}
              disabled={loading}
              className="retry-button"
            >
              {loading ? '重试中...' : '重试'}
            </button>
          )}
          {result.rawResponse && (
            <button 
              onClick={() => setShowRawResponse(!showRawResponse)} 
              className="raw-response-button"
            >
              {showRawResponse ? '隐藏原始响应' : '查看原始响应'}
            </button>
          )}
          <button onClick={onClear} className="clear-button">
            清空结果
          </button>
        </div>
      </div>
      
      {showRawResponse && result.rawResponse && (
        <div className="raw-response-section">
          <h3>AI原始响应</h3>
          <div className="raw-response-content">
            <pre>{result.rawResponse}</pre>
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(result.rawResponse!)}
            className="copy-button"
          >
            复制到剪贴板
          </button>
        </div>
      )}
    </div>
  );
}