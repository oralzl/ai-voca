import axios from 'axios';
import type { 
  WordQueryRequest, 
  WordQueryResponse, 
  WordExplanation,
  AiHubMixRequest,
  AiHubMixResponse
} from '@ai-voca/shared';
import { createAiMessages, formatWord, parseWordExplanationXml, isValidXml } from '@ai-voca/shared';

export class WordService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  
  constructor() {
    this.apiUrl = process.env.AIHUBMIX_API_URL || 'https://aihubmix.com/v1/chat/completions';
    this.apiKey = process.env.AIHUBMIX_API_KEY || '';
    this.model = process.env.AIHUBMIX_MODEL || 'gemini-2.0-flash';
    
    if (!this.apiKey) {
      throw new Error('AIHUBMIX_API_KEY is required');
    }
  }
  
  /**
   * 查询单词解释
   * @param request 查询请求
   * @returns 单词解释结果
   */
  async queryWord(request: WordQueryRequest): Promise<WordQueryResponse> {
    const timestamp = Date.now();
    
    try {
      // 格式化单词
      const formattedWord = formatWord(request.word);
      
      // 构建AI消息
      const messages = createAiMessages(
        formattedWord,
        request.language || 'zh',
        request.includeExample !== false
      );
      
      // 构建API请求
      const aiRequest: AiHubMixRequest = {
        model: this.model,
        messages,
        temperature: 0.1, // 降低温度以获得更一致的结果
        max_tokens: 2000 // 增加token限制以支持更完整的XML响应
      };
      
      // 调用AI API
      console.log('发送AI请求:', {
        url: this.apiUrl,
        model: this.model,
        messageCount: messages.length
      });
      
      const response = await axios.post<AiHubMixResponse>(
        this.apiUrl,
        aiRequest,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30秒超时
        }
      );
      
      // 解析AI响应
      const aiResponse = response.data;
      if (!aiResponse.choices || aiResponse.choices.length === 0) {
        throw new Error('AI API返回空响应');
      }
      
      const explanation = this.parseAiResponse(formattedWord, aiResponse.choices[0].message.content);
      
      return {
        success: true,
        data: explanation,
        timestamp
      };
      
    } catch (error: any) {
      console.error('Word query failed:', error);
      
      let errorMessage = '查询失败';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'API密钥无效';
        } else if (error.response?.status === 429) {
          errorMessage = 'API调用频率超限';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = '请求超时';
        } else {
          errorMessage = `API错误: ${error.response?.data?.error?.message || error.message}`;
        }
      } else {
        errorMessage = error.message || '未知错误';
      }
      
      return {
        success: false,
        error: errorMessage,
        timestamp
      };
    }
  }
  
  /**
   * 解析AI响应为结构化数据
   * @param word 查询的单词
   * @param content AI响应内容
   * @returns 结构化的单词解释
   */
  private parseAiResponse(word: string, content: string): WordExplanation {
    try {
      // 首先尝试XML解析
      if (isValidXml(content)) {
        console.log('使用XML解析模式');
        const parsed = parseWordExplanationXml(content);
        
        const explanation: WordExplanation = {
          word: parsed.word || word,
          pronunciation: parsed.pronunciation,
          partOfSpeech: parsed.partOfSpeech,
          definition: parsed.definition || content,
          synonyms: parsed.synonyms,
          antonyms: parsed.antonyms,
          etymology: parsed.etymology
        };
        
        // 处理例句数据
        if (parsed.examples && parsed.examples.length > 0) {
          explanation.examples = parsed.examples;
          // 为向后兼容性，设置第一个例句作为example
          explanation.example = parsed.examples[0].sentence;
        }
        
        return explanation;
      }
      
      // 如果XML解析失败，降级到原有的文本解析
      console.log('XML解析失败，使用文本解析模式');
      return this.parseTextResponse(word, content);
      
    } catch (error) {
      console.error('AI响应解析失败:', error);
      
      // 最后的降级处理
      return {
        word,
        definition: content,
        pronunciation: undefined,
        partOfSpeech: undefined,
        example: undefined,
        synonyms: undefined,
        antonyms: undefined,
        etymology: undefined
      };
    }
  }

  /**
   * 文本解析（降级模式）
   * @param word 查询的单词
   * @param content AI响应内容
   * @returns 结构化的单词解释
   */
  private parseTextResponse(word: string, content: string): WordExplanation {
    const lines = content.split('\n').filter(line => line.trim());
    
    const explanation: WordExplanation = {
      word,
      definition: content // 默认使用完整内容作为定义
    };
    
    // 尝试提取结构化信息
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.includes('音标') || trimmed.includes('pronunciation')) {
        const match = trimmed.match(/[/\\[](.*?)[/\\]]/);
        if (match) {
          explanation.pronunciation = match[1];
        }
      } else if (trimmed.includes('词性') || trimmed.includes('part of speech')) {
        const parts = trimmed.split(/[:：]/);
        if (parts.length > 1) {
          explanation.partOfSpeech = parts[1].trim();
        }
      } else if (trimmed.includes('例句') || trimmed.includes('example')) {
        const parts = trimmed.split(/[:：]/);
        if (parts.length > 1) {
          explanation.example = parts[1].trim();
        }
      }
    }
    
    return explanation;
  }
}