import React from 'react';
import { WordExplanation, WordExample, formatTimestamp } from '@ai-voca/shared';
import './WordResult.css';

interface WordResultProps {
  result: {
    success: boolean;
    data?: WordExplanation;
    error?: string;
    timestamp: number;
  };
  onClear: () => void;
}

export function WordResult({ result, onClear }: WordResultProps) {
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
          <div className="definition-text">
            {data.definition}
          </div>
        </div>
        
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
      </div>
      
      <div className="result-footer">
        <div className="timestamp">
          查询时间: {formatTimestamp(result.timestamp)}
        </div>
        <button onClick={onClear} className="clear-button">
          清空结果
        </button>
      </div>
    </div>
  );
}