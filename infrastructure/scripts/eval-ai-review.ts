/**
 * eval-ai-review.ts
 *
 * Standalone evaluation script for the AI code review pipeline.
 *
 * 1. Fetches 25 accepted submissions from the database
 * 2. Runs each through TWO prompts:
 *    (a) "structured" — Phase 4 rubric (Big O, readability 1-10, edge cases, naming, improvement)
 *    (b) "unstructured" — naive "review this code" with no JSON schema
 * 3. Reports valid-JSON rate, latency, token count, and estimated cost
 *
 * Run: pnpm tsx infrastructure/scripts/eval-ai-review.ts
 * Requires: OPENAI_API_KEY in apps/backend/.env (loaded automatically by Prisma)
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

// ─── Load .env manually since tsx doesn't auto-load ───
function loadEnv() {
  const envPath = resolve(process.cwd(), "apps", "backend", ".env");
  if (!existsSync(envPath)) {
    console.warn("⚠  No .env found at", envPath, "— falling back to process.env");
    return;
  }
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}
loadEnv();

const prisma = new PrismaClient();

// ─── Types ───

interface EvalSample {
  id: string;
  problemTitle: string;
  problemDescription: string;
  language: string;
  code: string;
  testResults: { pass: boolean; expected: string; actual: string }[];
  passedCount: number;
  totalCount: number;
}

interface EvalResult {
  sampleId: string;
  problemTitle: string;
  language: string;
  promptType: "structured" | "unstructured";
  validJson: boolean;
  latencyMs: number;
  inputChars: number;
  outputChars: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
  validationErrors?: string[];
}

// ─── Prompts ───

function buildStructuredPrompt(s: EvalSample): string {
  return `You are an expert code reviewer. Analyze the following ${s.language} solution for the problem "${s.problemTitle}".

Problem Description:
${s.problemDescription}

Solution Code (${s.language}):
\`\`\`${s.language}
${s.code}
\`\`\`

Test Results: ${s.passedCount}/${s.totalCount} tests passed.

Evaluate the code based on these criteria:
1. Time Complexity: What is the Big O time complexity?
2. Space Complexity: What is the Big O space complexity?
3. Readability (1-10): How readable is the code? Consider naming, structure, comments.
4. Edge Cases (1-10): How well does the code handle edge cases?
5. Naming (1-10): How clear and descriptive are the variable and function names?
6. Suggested Improvement: Provide one specific, actionable suggestion to improve the code.

Respond with ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "readabilityScore": <1-10>,
  "edgeCaseScore": <1-10>,
  "namingScore": <1-10>,
  "suggestedImprovement": "..."
}`;
}

function buildNaivePrompt(s: EvalSample): string {
  return `Review this ${s.language} code for the problem "${s.problemTitle}".

Problem: ${s.problemDescription}

Code:
\`\`\`${s.language}
${s.code}
\`\`\`

Test results: ${s.passedCount}/${s.totalCount} passed.

Tell me what you think about the code quality.`;
}

// ─── OpenAI call ───

async function callOpenAI(
  prompt: string,
  systemMessage: string
): Promise<{
  content: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4-turbo-preview";
  const start = performance.now();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
    }),
  });

  const latencyMs = Math.round(performance.now() - start);
  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(`OpenAI error ${response.status}: ${data.error?.message || "unknown"}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response");

  return {
    content,
    latencyMs,
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
  };
}

// ─── JSON extraction & validation ───

function extractJson(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const jsonMatch = trimmed.match(/```(?:json)?\s*\n?({[\s\S]*?})\n?\s*```/);
  if (jsonMatch) return jsonMatch[1];
  const braceMatch = trimmed.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return null;
}

const STRUCTURED_KEYS = [
  "timeComplexity",
  "spaceComplexity",
  "readabilityScore",
  "edgeCaseScore",
  "namingScore",
  "suggestedImprovement",
];

function validateStructuredJson(data: unknown): string[] {
  const errors: string[] = [];
  if (typeof data !== "object" || data === null) {
    errors.push("Not a JSON object");
    return errors;
  }
  const d = data as Record<string, unknown>;
  for (const key of STRUCTURED_KEYS) {
    if (d[key] === undefined || d[key] === null) {
      errors.push(`Missing field: ${key}`);
    }
  }
  if (typeof d.timeComplexity !== "string" && d.timeComplexity !== undefined) errors.push("timeComplexity must be string");
  if (typeof d.spaceComplexity !== "string" && d.spaceComplexity !== undefined) errors.push("spaceComplexity must be string");
  if (typeof d.readabilityScore !== "number" && d.readabilityScore !== undefined) errors.push("readabilityScore must be number");
  if (typeof d.edgeCaseScore !== "number" && d.edgeCaseScore !== undefined) errors.push("edgeCaseScore must be number");
  if (typeof d.namingScore !== "number" && d.namingScore !== undefined) errors.push("namingScore must be number");
  if (typeof d.suggestedImprovement !== "string" && d.suggestedImprovement !== undefined) errors.push("suggestedImprovement must be string");
  return errors;
}

function validateUnstructuredJson(data: unknown): string[] {
  // Unstructured prompt doesn't enforce schema — just check it's valid JSON
  return [];
}

// ─── Main ───

async function main() {
  console.log("\n" + "=".repeat(72));
  console.log("  AI Code Review — Evaluation Suite");
  console.log("=".repeat(72) + "\n");

  // 1. Fetch samples
  console.log("  Fetching completed submissions from database...");
  const submissions = await prisma.submission.findMany({
    where: { status: "completed" },
    include: { problem: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  if (submissions.length === 0) {
    console.error("  ✖ No completed submissions found. Run seed.ts and submit some solutions first.");
    await prisma.$disconnect();
    process.exit(1);
  }

  const samples: EvalSample[] = submissions.map((s) => {
    const results = (s.testResults as any[]) || [];
    return {
      id: s.id,
      problemTitle: s.problem.title,
      problemDescription: s.problem.description,
      language: s.language,
      code: s.code,
      testResults: results.map((r) => ({ pass: r.pass, expected: r.expected, actual: r.actual })),
      passedCount: results.filter((r) => r.pass).length,
      totalCount: results.length,
    };
  });

  console.log(`  ✓ Loaded ${samples.length} submissions\n`);

  // 2. Run evaluation
  const results: EvalResult[] = [];
  const structuredResults: EvalResult[] = [];
  const unstructuredResults: EvalResult[] = [];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    console.log(`  [${i + 1}/${samples.length}] ${s.problemTitle} (${s.language})`);

    // Structured prompt
    const structuredPrompt = buildStructuredPrompt(s);
    try {
      const resp = await callOpenAI(structuredPrompt, "You are an expert code reviewer. Always respond with valid JSON only.");
      const json = extractJson(resp.content);
      let validJson = false;
      let validationErrors: string[] = [];
      if (json) {
        try {
          const parsed = JSON.parse(json);
          validationErrors = validateStructuredJson(parsed);
          validJson = validationErrors.length === 0;
        } catch {
          validationErrors = ["JSON parse error"];
        }
      } else {
        validationErrors = ["Could not extract JSON object"];
      }

      const r: EvalResult = {
        sampleId: s.id,
        problemTitle: s.problemTitle,
        language: s.language,
        promptType: "structured",
        validJson,
        latencyMs: resp.latencyMs,
        inputChars: structuredPrompt.length,
        outputChars: resp.content.length,
        inputTokens: resp.inputTokens,
        outputTokens: resp.outputTokens,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      };
      results.push(r);
      structuredResults.push(r);
      console.log(`    ✓ structured ${validJson ? "✓" : "✖"} ${resp.latencyMs}ms`);
    } catch (e: any) {
      const r: EvalResult = {
        sampleId: s.id,
        problemTitle: s.problemTitle,
        language: s.language,
        promptType: "structured",
        validJson: false,
        latencyMs: 0,
        inputChars: structuredPrompt.length,
        outputChars: 0,
        error: e.message,
      };
      results.push(r);
      structuredResults.push(r);
      console.log(`    ✖ structured ERROR: ${e.message.slice(0, 80)}`);
    }

    // Unstructured prompt (naive)
    const naivePrompt = buildNaivePrompt(s);
    try {
      const resp = await callOpenAI(naivePrompt, "You are a helpful code reviewer. Give your honest opinion.");
      const json = extractJson(resp.content);
      const validJson = json !== null;
      const validationErrors = validJson ? validateUnstructuredJson(JSON.parse(json!)) : [];

      const r: EvalResult = {
        sampleId: s.id,
        problemTitle: s.problemTitle,
        language: s.language,
        promptType: "unstructured",
        validJson,
        latencyMs: resp.latencyMs,
        inputChars: naivePrompt.length,
        outputChars: resp.content.length,
        inputTokens: resp.inputTokens,
        outputTokens: resp.outputTokens,
      };
      results.push(r);
      unstructuredResults.push(r);
      console.log(`    ✓ naive       ${validJson ? "✓" : "○"} ${resp.latencyMs}ms`);
    } catch (e: any) {
      const r: EvalResult = {
        sampleId: s.id,
        problemTitle: s.problemTitle,
        language: s.language,
        promptType: "unstructured",
        validJson: false,
        latencyMs: 0,
        inputChars: naivePrompt.length,
        outputChars: 0,
        error: e.message,
      };
      results.push(r);
      unstructuredResults.push(r);
      console.log(`    ✖ naive       ERROR: ${e.message.slice(0, 80)}`);
    }
  }

  // 3. Compute summary
  console.log("\n" + "=".repeat(72));
  console.log("  RESULTS");
  console.log("=".repeat(72) + "\n");

  function summarize(label: string, subset: EvalResult[]) {
    const validCount = subset.filter((r) => r.validJson).length;
    const validRate = ((validCount / subset.length) * 100).toFixed(1);
    const avgLatency = Math.round(subset.reduce((s, r) => s + r.latencyMs, 0) / subset.length);
    const avgInputChars = Math.round(subset.reduce((s, r) => s + r.inputChars, 0) / subset.length);
    const avgOutputChars = Math.round(subset.reduce((s, r) => s + r.outputChars, 0) / subset.length);
    const avgInputTokens = Math.round(
      subset.reduce((s, r) => s + (r.inputTokens ?? Math.round(r.inputChars / 4)), 0) / subset.length
    );
    const avgOutputTokens = Math.round(
      subset.reduce((s, r) => s + (r.outputTokens ?? Math.round(r.outputChars / 4)), 0) / subset.length
    );

    // Cost estimate: gpt-4-turbo $0.01/1K input, $0.03/1K output
    const costPerReview =
      (avgInputTokens / 1000) * 0.01 +
      (avgOutputTokens / 1000) * 0.03;
    const costPer1k = costPerReview * 1000;

    const errors = subset.filter((r) => r.error).length;
    const schemaErrors = subset.filter((r) => r.validationErrors && r.validationErrors.length > 0).length;

    console.log(`  ┌─ ${label}`);
    console.log(`  │  Samples:         ${subset.length}`);
    console.log(`  │  Valid JSON:      ${validCount}/${subset.length} (${validRate}%)`);
    if (errors > 0) console.log(`  │  API errors:      ${errors}`);
    if (schemaErrors > 0) console.log(`  │  Schema errors:   ${schemaErrors}`);
    console.log(`  │  Avg latency:     ${avgLatency}ms`);
    console.log(`  │  Avg input:       ${avgInputChars} chars / ~${avgInputTokens} tokens`);
    console.log(`  │  Avg output:      ${avgOutputChars} chars / ~${avgOutputTokens} tokens`);
    console.log(`  │  Cost / review:   $${costPerReview.toFixed(4)}`);
    console.log(`  │  Cost / 1K revs:  $${costPer1k.toFixed(2)}`);
    console.log(`  └─\n`);
  }

  summarize("STRUCTURED (Phase 4 rubric)", structuredResults);
  summarize("UNSTRUCTURED (naive prompt)", unstructuredResults);

  // Combined
  const allValid = results.filter((r) => r.validJson).length;
  console.log(`  Combined valid-JSON rate: ${allValid}/${results.length} (${((allValid / results.length) * 100).toFixed(1)}%)\n`);

  // 4. Document failure cases
  const failures = results.filter((r) => !r.validJson || r.validationErrors || r.error);
  if (failures.length > 0) {
    console.log("  ┌─ FAILURE CASES");
    console.log("  │");
    for (const f of failures.slice(0, 5)) {
      console.log(`  │  [${f.promptType}] ${f.problemTitle} (${f.language})`);
      if (f.error) console.log(`  │    Error: ${f.error.slice(0, 100)}`);
      if (f.validationErrors && f.validationErrors.length > 0) {
        for (const ve of f.validationErrors.slice(0, 3)) {
          console.log(`  │    Validation: ${ve}`);
        }
      }
      console.log(`  │    Latency: ${f.latencyMs}ms | Output: ${f.outputChars} chars`);
      console.log(`  │`);
    }
    console.log("  └─\n");
  }

  await prisma.$disconnect();
  console.log("  Done.\n");
}

main().catch((e) => {
  console.error("Fatal:", e);
  prisma.$disconnect().catch(() => {});
  process.exit(1);
});
