import { AiReviewError } from './ai-review.service.js';

interface InterviewEvaluation {
  verdict: string;
  scores: {
    correctness: number;
    clarity: number;
    depth: number;
    communication: number;
  };
  strengths: string;
  weaknesses: string;
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

async function callLlm(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey && !isLocalEndpoint(baseUrl)) {
    throw new AiReviewError(
      'AI interview is not configured. Set OPENAI_API_KEY in .env, or set OPENAI_BASE_URL to a local endpoint (e.g. http://localhost:11434/v1 for Ollama).',
    );
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new AiReviewError(`AI interview service returned HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json() as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new AiReviewError('AI interview returned an empty response');

  const jsonStart = content.indexOf('{');
  const jsonEnd = content.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) throw new AiReviewError('AI interview response did not contain valid JSON');

  return content.slice(jsonStart, jsonEnd + 1);
}

export async function generateInterviewQuestion(
  code: string,
  language: string,
  problemTitle: string,
  problemCategory: string,
): Promise<string> {
  const systemPrompt =
    'You are a senior engineering interviewer. Generate ONE concise follow-up question about the candidate\'s submitted code.\n'
    + 'Return ONLY a valid JSON object with NO markdown, NO code blocks, NO extra text. The JSON must be exactly:\n'
    + '{\n'
    + '  "question": "your question here"\n'
    + '}\n'
    + 'The question must be grounded in the actual code, not generic. Keep it to 1-3 sentences. Do not ask about the problem statement — ask about WHY they coded it this way.';

  const userPrompt =
    `Problem: ${problemTitle}\nCategory: ${problemCategory}\nLanguage: ${language}\n\nSubmitted Code:\n\`\`\`${language}\n${code}\n\`\`\``;

  try {
    const json = await callLlm(systemPrompt, userPrompt);
    const parsed = JSON.parse(json);
    if (!parsed.question || typeof parsed.question !== 'string') {
      throw new AiReviewError('AI interview returned a malformed question');
    }
    return parsed.question;
  } catch {
    return 'What tradeoff did you consider when choosing this approach?';
  }
}

export async function evaluateInterviewAnswer(
  code: string,
  language: string,
  problemTitle: string,
  question: string,
  answer: string,
): Promise<InterviewEvaluation> {
  const systemPrompt =
    'You are a senior engineering interviewer evaluating a candidate\'s answer to a follow-up question about their submitted code.\n'
    + 'Return ONLY a valid JSON object with NO markdown, NO code blocks, NO extra text. The JSON must have exactly this structure:\n'
    + '{\n'
    + '  "verdict": "clear_tradeoff_reasoning",\n'
    + '  "scores": { "correctness": 8, "clarity": 7, "depth": 6, "communication": 9 },\n'
    + '  "strengths": "specific strengths here",\n'
    + '  "weaknesses": "specific weaknesses here"\n'
    + '}\n'
    + 'verdict must be one of "clear_tradeoff_reasoning", "vague_missing_key_detail", or "incorrect_understanding".\n'
    + 'All scores must be numbers between 0 and 10.\n'
    + 'Base your evaluation on the question asked, the candidate\'s answer, and the code they submitted.\n'
    + 'Be specific — reference actual parts of the answer and code.';

  const userPrompt =
    `Problem: ${problemTitle}\nLanguage: ${language}\n\nSubmitted Code:\n\`\`\`${language}\n${code}\n\`\`\`\n\n`
    + `Question Asked:\n${question}\n\nCandidate's Answer:\n${answer}`;

  const json = await callLlm(systemPrompt, userPrompt);
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new AiReviewError('AI interview evaluation returned malformed JSON');
  }

  const validVerdicts = ['clear_tradeoff_reasoning', 'vague_missing_key_detail', 'incorrect_understanding'];
  const verdict = validVerdicts.includes(parsed.verdict) ? parsed.verdict : 'vague_missing_key_detail';

  const dims = ['correctness', 'clarity', 'depth', 'communication'];
  const scores: any = {};
  for (const dim of dims) {
    const val = Number(parsed.scores?.[dim]);
    scores[dim] = isNaN(val) || val < 0 || val > 10 ? 6 : val;
  }

  return {
    verdict,
    scores,
    strengths: typeof parsed.strengths === 'string' ? parsed.strengths : 'The candidate provided an answer to the question.',
    weaknesses: typeof parsed.weaknesses === 'string' ? parsed.weaknesses : 'Consider providing more specific technical details.',
  };
}
