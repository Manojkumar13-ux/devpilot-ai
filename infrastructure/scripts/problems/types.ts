export interface SeedProblem {
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  description: string;
  constraints: string;
  examples: { input: string; output: string; explanation?: string }[];
  starterCode: Record<string, string>;
  tags: string[];
  companies: string[];
  hints: string[];
  editorial: string;
  complexity: { time: string; space: string };
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
}

export function pyFn(sig: string, body: string): string {
  return `def ${sig}:\n${body}`;
}

export function javaCls(method: string): string {
  return `class Solution {\n    ${method}\n}`;
}

export function cppCls(method: string): string {
  return `class Solution {\npublic:\n    ${method}\n};`;
}

export function cFn(sig: string, body: string): string {
  return `${sig} {\n${body}\n}`;
}

export function jsFn(sig: string, body: string): string {
  return `function ${sig} {\n${body}\n}`;
}

export function goFn(sig: string, body: string): string {
  return `func ${sig} {\n${body}\n}`;
}

export function rustFn(sig: string, body: string): string {
  return `fn ${sig} {\n${body}\n}`;
}
