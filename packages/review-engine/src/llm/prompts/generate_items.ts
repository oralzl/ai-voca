/**
 * @fileoverview 提示词构建器实现
 * @description LLM 提示词的构建和模板管理
 * @author thiskee
 * 
 * 任务 3.2 实现提示词构建器
 * 实现提示词的构建和模板变量替换
 * 
 * 提示词构建器负责构建发送给 LLM 的提示词
 * 包括模板变量替换、难度描述、语言设置等功能
 */

import { z } from 'zod';

// 提示词参数 - 更新为符合需求的参数结构
export const PromptParams = z.object({
  targets: z.array(z.string()).min(1).max(8),
  profile: z.object({
    level_cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    difficulty_bias: z.number().min(-1.5).max(1.5).default(0),
    allow_incidental: z.boolean().default(true),
    unknown_budget: z.number().min(0).max(3).default(2),
    style: z.enum(['neutral', 'news', 'dialog', 'academic']).default('neutral'),
  }),
  constraints: z.object({
    sentence_length_range: z.tuple([z.number().min(12), z.number().max(22)]).default([12, 22]),
    max_targets_per_sentence: z.number().min(1).max(8).default(4),
  }),
});

export type PromptParams = z.infer<typeof PromptParams>;

// 提示词模板
export const PromptTemplate = z.object({
  system: z.string(),
  developer: z.string(),
  user: z.string(),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
  })).optional(),
});

export type PromptTemplate = z.infer<typeof PromptTemplate>;

/**
 * 构建生成项目的提示词
 * 实现完整的模板变量替换逻辑
 */
export function buildPrompt(params: PromptParams): string {
  const {
    targets,
    profile,
    constraints,
  } = params;

  // 获取基础模板
  const template = getDefaultPromptTemplate();
  
  // 构建完整的提示词
  let prompt = template.system + '\n\n' + template.developer + '\n\n' + template.user;
  
  // 执行模板变量替换
  prompt = replaceTemplateVariables(prompt, {
    targets,
    profile,
    constraints,
  });
  
  return prompt;
}

/**
 * 模板变量替换函数
 * 支持复杂的变量替换逻辑
 */
function replaceTemplateVariables(
  template: string,
  params: {
    targets: string[];
    profile: PromptParams['profile'];
    constraints: PromptParams['constraints'];
  }
): string {
  let result = template;
  
  // 基础变量替换
  const replacements = {
    '{{targets | json}}': JSON.stringify(params.targets),
    '{{profile | json}}': JSON.stringify(params.profile),
    '{{constraints | json}}': JSON.stringify(params.constraints),
    '{{profile.level_cefr}}': params.profile.level_cefr,
    '{{profile.difficulty_bias}}': params.profile.difficulty_bias.toString(),
    '{{profile.allow_incidental}}': params.profile.allow_incidental.toString(),
    '{{profile.unknown_budget}}': params.profile.unknown_budget.toString(),
    '{{profile.style}}': params.profile.style,
    '{{constraints.sentence_length_range.0}}': params.constraints.sentence_length_range[0].toString(),
    '{{constraints.sentence_length_range.1}}': params.constraints.sentence_length_range[1].toString(),
    '{{constraints.max_targets_per_sentence}}': params.constraints.max_targets_per_sentence.toString(),
  };
  
  // 执行替换
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }
  
  return result;
}

/**
 * 获取默认提示词模板
 * 基于需求文档中的完整模板
 */
export function getDefaultPromptTemplate(): PromptTemplate {
  return {
    system: `# SYSTEM
You are an English sentence generator for vocabulary review. 
You must produce short, natural English text that includes ALL target words. 
You must control difficulty by CEFR level and limit the number of potentially new terms.
Return STRICT JSON ONLY that matches the provided schema. DO NOT include any extra commentary.`,
    
    developer: `# DEVELOPER
Goals:
- Include every target word once (or at most once) in contextually correct usage.
- Overall difficulty ~= {{profile.level_cefr}} (consider {{profile.difficulty_bias}} as a soft signal).
- Allow incidental learning ONLY if {{profile.allow_incidental}} is true, with at most {{profile.unknown_budget}} potentially-new terms.
- Respect style: {{profile.style}}.
- Respect length: total tokens between {{constraints.sentence_length_range.0}} and {{constraints.sentence_length_range.1}}; ≤ {{constraints.max_targets_per_sentence}} targets per sentence.
- Avoid sensitive topics: politics, explicit sexual content, hate, self-harm, illegal acts, personal data.

Definitions:
- "Potentially-new terms" = words that are likely above {{profile.level_cefr}}. You will self-estimate them and list them in new_terms[] with a brief gloss.
- Token boundaries: split on whitespace and punctuation. Use simple, human-intuitive tokenization.
- For each target occurrence, return its token span [begin, end] (inclusive indices) in the final \`text\`. If uncertain, keep begin=end at the main head token.

Output Contract:
- Return JSON with:
  {
    "items": [
      {
        "sid": "string",
        "text": "string",
        "targets": [{"word":"string","begin":number,"end":number}, ...],
        "self_eval": {
          "predicted_cefr": "A1|A2|B1|B2|C1|C2",
          "estimated_new_terms_count": number,
          "new_terms": [{"surface":"string","cefr":"A1|A2|B1|B2|C1|C2","gloss":"short plain-English meaning"}],
          "reason": "short justification"
        }
      }
    ]
  }

Hard Requirements:
- Include ALL targets: {{targets | json}}.
- Use each target in a natural, common sense; avoid obscure idioms or rare collocations.
- Keep overall style: {{profile.style}}.
- Keep length within {{constraints.sentence_length_range.0}}..{{constraints.sentence_length_range.1}} tokens.
- Focus on generating high-quality, natural sentences that meet the requirements.

Examples for style (not to copy verbatim):
- neutral: everyday neutral tone, clear and concise.
- news: informative, objective.
- dialog: simple two-person exchange, clearly marked turns.
- academic: formal but plain; avoid heavy jargon.`,
    
    user: `# USER
Targets: {{targets | json}}

Profile:
{{profile | json}}

Constraints:
{{constraints | json}}

Return STRICT JSON ONLY.`,
    
    examples: [
      {
        input: 'Targets: ["happy", "success"]\nProfile: {"level_cefr": "B1", "difficulty_bias": 0, "allow_incidental": true, "unknown_budget": 2, "style": "neutral"}\nConstraints: {"sentence_length_range": [12, 22], "max_targets_per_sentence": 4}',
        output: `{
  "items": [
    {
      "sid": "s1",
      "text": "I feel happy when I achieve success in my work.",
      "targets": [
        {"word": "happy", "begin": 2, "end": 2},
        {"word": "success", "begin": 6, "end": 6}
      ],
      "self_eval": {
        "predicted_cefr": "B1",
        "estimated_new_terms_count": 1,
        "new_terms": [
          {"surface": "achieve", "cefr": "B1", "gloss": "to succeed in doing something"}
        ],
        "reason": "Natural sentence with both targets, appropriate B1 level"
      }
    }
  ]
}`,
      },
    ],
  };
}

/**
 * 验证提示词参数
 */
export function validatePromptParams(params: unknown): PromptParams {
  return PromptParams.parse(params);
}

/**
 * 创建提示词参数
 */
export function createPromptParams(
  targets: string[],
  profile: Partial<PromptParams['profile']> = {},
  constraints: Partial<PromptParams['constraints']> = {}
): PromptParams {
  // 验证目标词数组不为空
  if (targets.length === 0) {
    throw new Error('目标词数组不能为空');
  }
  
  return {
    targets,
    profile: {
      level_cefr: 'B1',
      difficulty_bias: 0,
      allow_incidental: true,
      unknown_budget: 2,
      style: 'neutral',
      ...profile,
    },
    constraints: {
      sentence_length_range: [12, 22],
      max_targets_per_sentence: 4,
      ...constraints,
    },
  };
}

/**
 * 获取提示词模板的哈希值
 * 用于追踪提示词版本
 */
export function getPromptHash(template: PromptTemplate): string {
  const content = JSON.stringify(template);
  // 简单的哈希函数，实际项目中可以使用更复杂的哈希算法
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
} 