//这里包含输入与输出的 Zod 校验；

//generateItemsOutputSchema 结构简化，去掉 alternatives；

//附带类型导出与示例校验代码。


// /packages/review-engine/llm/schemas.ts
import { z } from "zod";

/* ---------- Common Types ---------- */

export const CEFRSchema = z.enum(["A1","A2","B1","B2","C1","C2"]);
export type CEFR = z.infer<typeof CEFRSchema>;

export const StyleSchema = z.enum(["neutral","news","dialog","academic"]);
export type Style = z.infer<typeof StyleSchema>;

/* ---------- Inputs from backend to LLM ---------- */

export const GenerateItemsInputSchema = z.object({
  targets: z.array(z.string().min(1)).min(1).max(8), // 建议一次不超过 8 个目标词
  profile: z.object({
    level_cefr: CEFRSchema,
    allow_incidental: z.boolean().default(true),
    unknown_budget: z.number().int().min(0).max(4).default(2),
    style: StyleSchema.default("neutral"),
    difficulty_bias: z.number().min(-1.5).max(1.5).default(0)
  }),
  constraints: z.object({
    sentence_length_range: z.tuple([z.number().int().min(3), z.number().int().min(3)]), // [min,max]
    max_targets_per_sentence: z.number().int().min(1).max(4).default(2)
  })
});
export type GenerateItemsInput = z.infer<typeof GenerateItemsInputSchema>;

/* ---------- LLM Outputs ---------- */

export const TargetSpanSchema = z.object({
  word: z.string().min(1),
  begin: z.number().int().min(0),
  end: z.number().int().min(0)
}).refine(v => v.end >= v.begin, { message: "end must be >= begin" });

export const NewTermSchema = z.object({
  surface: z.string().min(1),
  cefr: CEFRSchema,
  gloss: z.string().min(1).max(120) // 简短释义
});

export const SelfEvalSchema = z.object({
  predicted_cefr: CEFRSchema,
  estimated_new_terms_count: z.number().int().min(0).max(10),
  new_terms: z.array(NewTermSchema).default([]),
  reason: z.string().min(1).max(200).optional()
});

export const GeneratedItemSchema = z.object({
  sid: z.string().min(1),
  text: z.string().min(1),
  targets: z.array(TargetSpanSchema).min(1),
  self_eval: SelfEvalSchema
});

export const GenerateItemsOutputSchema = z.object({
  items: z.array(GeneratedItemSchema).min(1).max(3) // 一次生成 1~3 条
});
export type GenerateItemsOutput = z.infer<typeof GenerateItemsOutputSchema>;

/* ---------- Runtime helpers (optional) ---------- */

// 校验 LLM 原始字符串输出 -> 对象
export function parseGenerateItemsJSON(raw: string): GenerateItemsOutput {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    throw new Error("LLM output is not valid JSON");
  }
  return GenerateItemsOutputSchema.parse(obj);
}

/* ---------- Small invariants to check after schema ---------- */

/**
 * 业务侧的基础校验：
 * - 所有 targets 都必须在 text 中出现（通过 targets[].word 与 text 包含性先粗检）
 * - targets[].word 不应在一个句子中出现多次（如果业务需要）
 * - self_eval.estimated_new_terms_count <= profile.unknown_budget （不满足则触发兜底）
 */
export function basicBusinessChecks(
  output: GenerateItemsOutput,
  expectedTargets: string[],
  unknownBudget: number
) {
  const text = output.items.map(i => i.text).join(" ");
  // 1) 目标词粗检（大小写无关）
  const lower = text.toLowerCase();
  const missing = expectedTargets.filter(t => !lower.includes(t.toLowerCase()));
  if (missing.length) {
    throw new Error(`Missing targets in text: ${missing.join(", ")}`);
  }
  // 2) 预算检查（基于模型自评）
  const overBudget = output.items.some(i =>
    (i.self_eval?.estimated_new_terms_count ?? 0) > unknownBudget
  );
  return { missing, overBudget };
}
