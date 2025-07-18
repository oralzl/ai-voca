import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { WordService } from '../services/WordService';
import { isValidWord } from '@ai-voca/shared';
import type { WordQueryRequest, WordQueryResponse } from '@ai-voca/shared';

// 确保环境变量被加载
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

const router = express.Router();
const wordService = new WordService();

/**
 * GET /api/words/query
 * 查询单词解释
 */
router.get('/query', async (req, res) => {
  try {
    const { word, includeExample = 'true' } = req.query;
    
    // 验证参数
    if (!word || typeof word !== 'string') {
      return res.status(400).json({
        success: false,
        error: '单词参数是必需的',
        timestamp: Date.now()
      } as WordQueryResponse);
    }
    
    if (!isValidWord(word)) {
      return res.status(400).json({
        success: false,
        error: '无效的单词格式',
        timestamp: Date.now()
      } as WordQueryResponse);
    }
    
    // 构建查询请求
    const queryRequest: WordQueryRequest = {
      word: word.trim(),
      includeExample: includeExample === 'true'
    };
    
    // 调用服务获取单词解释
    const result = await wordService.queryWord(queryRequest);
    
    res.json(result);
    
  } catch (error) {
    console.error('Word query error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      timestamp: Date.now()
    } as WordQueryResponse);
  }
});

/**
 * POST /api/words/query
 * 查询单词解释（POST方式）
 */
router.post('/query', async (req, res) => {
  try {
    const { word, includeExample = true } = req.body;
    
    // 验证参数
    if (!word || typeof word !== 'string') {
      return res.status(400).json({
        success: false,
        error: '单词参数是必需的',
        timestamp: Date.now()
      } as WordQueryResponse);
    }
    
    if (!isValidWord(word)) {
      return res.status(400).json({
        success: false,
        error: '无效的单词格式',
        timestamp: Date.now()
      } as WordQueryResponse);
    }
    
    // 构建查询请求
    const queryRequest: WordQueryRequest = {
      word: word.trim(),
      includeExample: Boolean(includeExample)
    };
    
    // 调用服务获取单词解释
    const result = await wordService.queryWord(queryRequest);
    
    res.json(result);
    
  } catch (error) {
    console.error('Word query error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      timestamp: Date.now()
    } as WordQueryResponse);
  }
});

/**
 * GET /api/words
 * API文档和使用说明
 */
router.get('/', (req, res) => {
  res.json({
    name: 'AI单词查询API',
    version: '1.0.0',
    endpoints: {
      'GET /api/words/query': {
        description: '查询单词解释',
        parameters: {
          word: 'string (required) - 要查询的单词',
          includeExample: 'boolean (optional) - 是否包含例句，默认为 true'
        },
        example: '/api/words/query?word=hello&includeExample=true'
      },
      'POST /api/words/query': {
        description: '查询单词解释（POST方式）',
        body: {
          word: 'string (required) - 要查询的单词',
          includeExample: 'boolean (optional) - 是否包含例句，默认为 true'
        }
      }
    }
  });
});

export { router as wordRouter };