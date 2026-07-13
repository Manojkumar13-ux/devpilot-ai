import { logger } from '../lib/logger.js';

interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
}

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string;
  memory: number;
}

const LANG_IDS: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  go: 60,
  rust: 73,
};

const JUDGE0_API = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';

export class Judge0Service {
  async execute(
    files: Record<string, string>,
    language: string,
  ): Promise<{ results: any[]; error?: string; errorType?: string; memory?: number }> {
    const langId = LANG_IDS[language];
    if (!langId) {
      return { results: [], error: `Unsupported language: ${language}`, errorType: 'runtime_error' };
    }

    try {
      const sourceCode = this.buildSource(files, language);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${JUDGE0_API}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: sourceCode, language_id: langId, stdin: '' } satisfies Judge0Submission),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        logger.error({ status: res.status, body: text }, 'Judge0 API error');
        return { results: [], error: `Execution service error (HTTP ${res.status})`, errorType: 'runtime_error' };
      }

      const result = await res.json() as Judge0Response;

      if (result.status.id !== 3) {
        const statusId = result.status.id;
        const compileOut = result.compile_output || '';
        const stdErr = result.stderr || '';
        let errorType = 'runtime_error';

        if (statusId === 5) {
          errorType = 'timeout_error';
        } else if (statusId === 6) {
          errorType = 'compilation_error';
        } else if (statusId === 10 || statusId === 11) {
          errorType = 'internal_error';
        }

        const errMsg = compileOut || stdErr || `Execution failed (status: ${result.status.description})`;
        return { results: [], error: errMsg, errorType };
      }

      try {
        const parsed = JSON.parse(result.stdout || '{}');
        return { results: parsed.results || [], memory: result.memory || 0 };
      } catch {
        logger.warn({ stdout: result.stdout }, 'Failed to parse Judge0 output as JSON');
        return { results: [], error: 'Failed to parse execution output', errorType: 'runtime_error' };
      }
    } catch (err: any) {
      logger.error({ err }, 'Judge0 request failed');
      const msg = err.name === 'AbortError' ? 'Execution timed out after 30s' : err.message || 'Execution service unreachable';
      return { results: [], error: msg, errorType: err.name === 'AbortError' ? 'timeout_error' : 'runtime_error' };
    }
  }

  private buildSource(files: Record<string, string>, language: string): string {
    const testCasesJson = files['testcases.json'];

    switch (language) {
      case 'javascript':
      case 'typescript':
        return this.buildSingleFile(files, 'runner.js', testCasesJson);
      case 'python':
        return this.buildSingleFile(files, 'runner.py', testCasesJson);
      case 'java':
        return this.buildJava(files, testCasesJson);
      case 'cpp':
        return this.buildSingleFile(files, 'runner.cpp', testCasesJson);
      case 'c':
        return this.buildSingleFile(files, 'runner.c', testCasesJson);
      case 'go':
        return this.buildGo(files, testCasesJson);
      case 'rust':
        return this.buildSingleFile(files, 'runner.rs', testCasesJson);
      default:
        return Object.values(files).join('\n');
    }
  }

  private buildSingleFile(files: Record<string, string>, mainFile: string, testCasesJson?: string): string {
    let source = files[mainFile] || '';
    if (testCasesJson && source) {
      source = this.inlineTestCases(source, languageForInlining(mainFile), testCasesJson);
    }
    return source || Object.values(files).join('\n');
  }

  private inlineTestCases(source: string, language: string, json: string): string {
    switch (language) {
      case 'cpp':
        return source.replace(
          /string\s+content\s*=\s*readFile\s*\([^)]*\)\s*;/,
          `string content = R"JSON(${json})JSON";`
        );
      case 'c':
        return this.inlineTestCasesC(source, json);
      case 'go':
        return source.replace(
          /data\s*,\s*err\s*:=\s*os\.ReadFile\s*\([^)]*\)/,
          'data := []byte(`' + json + '`)\nvar err error'
        );
      case 'rust':
        return source.replace(
          /let\s+\w+\s*=\s*fs::read_to_string\s*\([^;]*\)\.unwrap_or_default\(\)/,
          `let content = "${json.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}".to_string()`
        );
      case 'java':
        return source.replace(
          /String\s+content\s*=\s*new\s+String\s*\([^;]*\)\s*;/,
          `String content = "${json.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}";`
        );
      default:
        return source;
    }
  }

  private inlineTestCasesC(source: string, json: string): string {
    const escaped = json.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const lines = source.split('\n');
    const result: string[] = [];
    let inFileRead = false;
    for (const line of lines) {
      if (/FILE\s*\*\s*\w+\s*=\s*fopen\s*\(/.test(line)) {
        result.push(`  const char* jsonContent = "${escaped}";`);
        result.push(`  char* buf = strdup(jsonContent);`);
        result.push(`  size_t len = strlen(buf);`);
        inFileRead = true;
        continue;
      }
      if (inFileRead) {
        if (/fclose\s*\(/.test(line)) {
          inFileRead = false;
          continue;
        }
        if (!/^\s*(size_t\s+len|fread|fclose|char\s*\*\s*buf)/.test(line)) {
          result.push(line);
        }
        continue;
      }
      result.push(line);
    }
    return result.join('\n');
  }

  private buildJava(files: Record<string, string>, testCasesJson?: string): string {
    // Strip 'public' from any user-defined class to avoid conflict with public Main
    let solutionCode = (files['Solution.java'] || '');
    solutionCode = solutionCode.replace(/\bpublic\s+class\s+(\w+)/g, 'class $1');
    const runnerCode = files['Runner.java'] || '';
    const imports = `import java.util.*;\nimport java.io.*;\nimport java.nio.file.*;\nimport java.lang.reflect.*;`;
    const modifiedRunner = runnerCode
      .replace(/^import\s+.*;$/gm, '')
      .replace('public class Runner', 'public class Main')
      .trim();
    const merged = `${imports}\n\n${solutionCode}\n\n${modifiedRunner}`;
    if (testCasesJson) {
      return this.inlineTestCases(merged, 'java', testCasesJson);
    }
    return merged;
  }

  private buildGo(files: Record<string, string>, testCasesJson?: string): string {
    const parts: string[] = [];
    const seenImports = new Set<string>();
    for (const [name, content] of Object.entries(files)) {
      if (name === 'testcases.json') continue;
      const lines = content.split('\n');
      const filtered: string[] = [];
      for (const line of lines) {
        if (/^package\s+main/.test(line)) continue;
        if (/^import\s*\(/.test(line)) {
          let inImport = true;
          filtered.push(line);
          continue;
        }
        if (/^\s+"[^"]+"/.test(line) || /^\s+\.\s+"[^"]+"/.test(line)) {
          const trimmed = line.trim();
          if (seenImports.has(trimmed)) continue;
          seenImports.add(trimmed);
          filtered.push(line);
          continue;
        }
        if (/^\s*\)/.test(line) && line.includes('import')) continue;
        filtered.push(line);
      }
      parts.push(filtered.join('\n'));
    }
    const merged = `package main\n\n${parts.join('\n')}`;
    if (testCasesJson) {
      return this.inlineTestCases(merged, 'go', testCasesJson);
    }
    return merged;
  }
}

function languageForInlining(filename: string): string {
  if (filename.endsWith('.cpp')) return 'cpp';
  if (filename.endsWith('.c')) return 'c';
  if (filename.endsWith('.rs')) return 'rust';
  if (filename.endsWith('.go')) return 'go';
  if (filename.endsWith('.java')) return 'java';
  return '';
}
