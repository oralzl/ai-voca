import type { 
  WordQueryRequest, 
  WordQueryResponse, 
  WordExplanation,
  AiHubMixMessage
} from '@ai-voca/shared';
import { 
  createAiMessages, 
  formatWord, 
  parseWordExplanationXml, 
  isValidXml,
  createAiHubMixClientFromEnv,
  AiHubMixClient
} from '@ai-voca/shared';

export class WordService {
  private readonly aiClient: AiHubMixClient;
  
  constructor() {
    this.aiClient = createAiHubMixClientFromEnv();
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
        request.includeExample !== false
      );
      
      // 调用AI API
      const aiResponse = await this.aiClient.chatCompletion(messages, {
        temperature: 0.1, // 降低温度以获得更一致的结果
        maxTokens: 2000 // 增加token限制以支持更完整的XML响应
      });
      
      const rawAiResponse = aiResponse.choices[0].message.content;
      const explanation = this.parseAiResponse(formattedWord, rawAiResponse);
      
      return {
        success: true,
        data: explanation,
        rawResponse: rawAiResponse, // 保存原始响应用于调试
        timestamp
      };
      
    } catch (error: any) {
      console.error('Word query failed:', error);
      
      return {
        success: false,
        error: error.message || '查询失败',
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
          text: parsed.text,
          lemmatizationExplanation: parsed.lemmatizationExplanation,
          pronunciation: parsed.pronunciation,
          partOfSpeech: parsed.partOfSpeech,
          definition: parsed.definition || content,
          simpleExplanation: parsed.simpleExplanation,
          synonyms: parsed.synonyms,
          antonyms: parsed.antonyms,
          etymology: parsed.etymology,
          memoryTips: parsed.memoryTips
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
        simpleExplanation: undefined,
        example: undefined,
        synonyms: undefined,
        antonyms: undefined,
        etymology: undefined,
        memoryTips: undefined
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