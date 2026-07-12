import { logger } from '../lib/logger.js';

export class AiReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiReviewError';
  }
}

export interface AiReviewResult {
  timeComplexity: string;
  spaceComplexity: string;
  readabilityScore: number;
  edgeCaseScore: number;
  namingScore: number;
  suggestedImprovement: string;
}

export interface LlmCallMetrics {
  model: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  'gpt-4o': { inputPer1M: 2.50, outputPer1M: 10.00 },
  'gpt-4o-2024-08-06': { inputPer1M: 2.50, outputPer1M: 10.00 },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.60 },
  'gpt-4o-mini-2024-07-18': { inputPer1M: 0.15, outputPer1M: 0.60 },
  'gpt-4-turbo': { inputPer1M: 10.00, outputPer1M: 30.00 },
  'gpt-3.5-turbo': { inputPer1M: 0.50, outputPer1M: 1.50 },
  'claude-3-haiku-20240307': { inputPer1M: 0.25, outputPer1M: 1.25 },
  'claude-3-sonnet-20240229': { inputPer1M: 3.00, outputPer1M: 15.00 },
  'claude-3-opus-20240229': { inputPer1M: 15.00, outputPer1M: 75.00 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model] || { inputPer1M: 0.15, outputPer1M: 0.60 };
  return (promptTokens / 1_000_000) * pricing.inputPer1M
       + (completionTokens / 1_000_000) * pricing.outputPer1M;
}

function isLocalEndpoint(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '0.0.0.0';
  } catch {
    return false;
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

function clampScore(v: unknown, fallback: number): number {
  const n = Number(v);
  return isNaN(n) || n < 0 || n > 10 ? fallback : n;
}

function sanitizeJson(raw: unknown): AiReviewResult {
  if (!raw || typeof raw !== 'object') {
    throw new AiReviewError('AI review returned an invalid response format');
  }
  const o = raw as Record<string, unknown>;

  return {
    timeComplexity: typeof o.timeComplexity === 'string' ? o.timeComplexity : 'Unknown',
    spaceComplexity: typeof o.spaceComplexity === 'string' ? o.spaceComplexity : 'Unknown',
    readabilityScore: clampScore(o.readabilityScore, 7),
    edgeCaseScore: clampScore(o.edgeCaseScore, 7),
    namingScore: clampScore(o.namingScore, 7),
    suggestedImprovement: typeof o.suggestedImprovement === 'string' ? o.suggestedImprovement : 'No specific suggestion provided.',
  };
}

export async function callLlm(
  prompt: string,
  systemPrompt: string,
  retry: boolean,
): Promise<{ result: AiReviewResult; metrics: LlmCallMetrics }> {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey && !isLocalEndpoint(baseUrl)) {
    throw new AiReviewError(
      'AI review is not configured. Set OPENAI_API_KEY in .env, or set OPENAI_BASE_URL to a local endpoint (e.g. http://localhost:11434/v1 for Ollama).',
    );
  }

  const startTime = Date.now();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: retry ? 0.1 : 0.3,
      max_tokens: 1500,
    }),
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new AiReviewError(
      `AI review service returned HTTP ${response.status}: ${body.slice(0, 200)}`,
    );
  }

  const data = await response.json() as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new AiReviewError('AI review returned an empty response');
  }

  const usage = data?.usage;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? (promptTokens + completionTokens);
  const estimatedCostUsd = estimateCost(model, promptTokens, completionTokens);

  const metrics: LlmCallMetrics = { model, latencyMs, promptTokens, completionTokens, totalTokens, estimatedCostUsd };

  logger.info({ metrics }, 'LLM call completed');

  const jsonStart = content.indexOf('{');
  const jsonEnd = content.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new AiReviewError('AI review response did not contain valid JSON');
  }

  const jsonStr = content.slice(jsonStart, jsonEnd + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new AiReviewError('AI review returned malformed JSON');
  }

  return { result: sanitizeJson(parsed), metrics };
}

export async function generateAiReview(
  code: string,
  language: string,
  problemTitle: string,
): Promise<AiReviewResult> {
  const systemPrompt =
    'You are an expert code reviewer. Analyze the provided solution and return ONLY a valid JSON object with NO markdown, NO code blocks, NO extra text. The JSON must have exactly these 6 fields:\n'
    + '{\n'
    + '  "timeComplexity": "O(n)",\n'
    + '  "spaceComplexity": "O(n)",\n'
    + '  "readabilityScore": 8,\n'
    + '  "edgeCaseScore": 7,\n'
    + '  "namingScore": 9,\n'
    + '  "suggestedImprovement": "your suggestion here"\n'
    + '}\n'
    + 'All score fields must be numbers between 0 and 10. All complexity fields must be strings. suggestedImprovement must be a string.';

  const prompt = `Language: ${language}\nProblem: ${problemTitle}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;

  try {
    const { result } = await callLlm(prompt, systemPrompt, false);
    return result;
  } catch (err) {
    if (err instanceof AiReviewError && err.message.includes('JSON')) {
      const { result } = await callLlm(prompt, systemPrompt + '\nIMPORTANT: You MUST return valid JSON. Double-check your syntax.', true);
      return result;
    }
    throw err;
  }
}

/* ---------- Naive unstructured review prompt (for evaluation) ---------- */

export interface NaiveReviewResult {
  raw: string;
  validJson: boolean;
  parsed: Record<string, unknown> | null;
  metrics: LlmCallMetrics;
}

export async function generateNaiveReview(
  code: string,
  language: string,
  problemTitle: string,
): Promise<NaiveReviewResult> {
  const systemPrompt =
    'You are an experienced code reviewer. Review the following code submission. '
    + 'Discuss its time and space complexity, code readability, edge case handling, naming conventions, '
    + 'and suggest specific improvements. Write in natural paragraphs — no specific format required.';

  const prompt = `Problem: ${problemTitle}\nLanguage: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const apiKey = process.env.OPENAI_API_KEY;

  const startTime = Date.now();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new AiReviewError(`Naive review returned HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json() as any;
  const content = data?.choices?.[0]?.message?.content || '';

  const usage = data?.usage;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? (promptTokens + completionTokens);
  const estimatedCostUsd = estimateCost(model, promptTokens, completionTokens);

  const metrics: LlmCallMetrics = { model, latencyMs, promptTokens, completionTokens, totalTokens, estimatedCostUsd };

  logger.info({ metrics }, 'Naive LLM call completed');

  let validJson = false;
  let parsed: Record<string, unknown> | null = null;
  try {
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
      validJson = true;
    }
  } catch {
    validJson = false;
  }

  return { raw: content, validJson, parsed, metrics };
}
