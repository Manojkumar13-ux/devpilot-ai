import { logger } from '../lib/logger.js';

interface PistonFile {
  name: string;
  content: string;
}

interface PistonRequest {
  language: string;
  version: string;
  files: PistonFile[];
  stdin?: string;
  args?: string[];
  run_timeout?: number;
  compile_timeout?: number;
}

interface PistonResult {
  ran: boolean;
  output: string;
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
}

const LANG_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  python: { language: 'python', version: '3.10.0' },
  java: { language: 'java', version: '17.0.7' },
  cpp: { language: 'c++', version: '10.2.0' },
  c: { language: 'c', version: '10.2.0' },
  go: { language: 'go', version: '1.20.4' },
  rust: { language: 'rust', version: '1.68.2' },
};

const PISTON_API = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute';

export class PistonService {
  async execute(
    files: Record<string, string>,
    language: string,
  ): Promise<{ results: any[]; error?: string; errorType?: string }> {
    const langInfo = LANG_MAP[language];
    if (!langInfo) {
      return { results: [], error: `Unsupported language: ${language}`, errorType: 'runtime_error' };
    }

    const adaptedFiles = this.adaptFiles(files, language);

    const body: PistonRequest = {
      language: langInfo.language,
      version: langInfo.version,
      files: adaptedFiles,
      args: [],
      run_timeout: 10000,
      compile_timeout: 30000,
    };

    try {
      const res = await fetch(PISTON_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        logger.error({ status: res.status, body: text }, 'Piston API error');
        return { results: [], error: `Execution service error (HTTP ${res.status})`, errorType: 'runtime_error' };
      }

      const result = await res.json() as PistonResult;

      if (!result.ran) {
        const errMsg = result.stderr || result.output || 'Execution failed';
        logger.error({ stderr: result.stderr, output: result.output }, 'Piston execution failed');
        return { results: [], error: errMsg, errorType: 'runtime_error' };
      }

      if (result.code !== 0) {
        return { results: [], error: result.stderr || result.output, errorType: 'runtime_error' };
      }

      try {
        const parsed = JSON.parse(result.stdout);
        return { results: parsed.results || [] };
      } catch {
        logger.warn({ stdout: result.stdout }, 'Failed to parse Piston output as JSON');
        return { results: [], error: 'Failed to parse execution output', errorType: 'runtime_error' };
      }
    } catch (err: any) {
      logger.error({ err }, 'Piston request failed');
      return { results: [], error: err.message || 'Execution service unreachable', errorType: 'runtime_error' };
    }
  }

  private adaptFiles(files: Record<string, string>, language: string): PistonFile[] {
    const testCasesJson = files['testcases.json'];
    const adapted: PistonFile[] = [];

    if (testCasesJson) {
      switch (language) {
        case 'java':
          adapted.push(...this.adaptJava(files, testCasesJson));
          break;
        case 'cpp':
          adapted.push(...this.adaptCpp(files, testCasesJson));
          break;
        case 'c':
          adapted.push(...this.adaptC(files, testCasesJson));
          break;
        case 'go':
          adapted.push(...this.adaptGo(files, testCasesJson));
          break;
        case 'rust':
          adapted.push(...this.adaptRust(files, testCasesJson));
          break;
        default:
          for (const [name, content] of Object.entries(files)) {
            if (name !== 'testcases.json') {
              adapted.push({ name, content });
            }
          }
      }
    } else {
      for (const [name, content] of Object.entries(files)) {
        adapted.push({ name, content });
      }
    }

    return adapted;
  }

  private adaptJava(files: Record<string, string>, testCasesJson: string): PistonFile[] {
    const adapted: PistonFile[] = [];
    const escaped = testCasesJson.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const inlined = `String content = "${escaped}";`;
    for (const [name, content] of Object.entries(files)) {
      if (name === 'testcases.json') continue;
      const updated = content.replace(
        /String\s+content\s*=\s*new\s+String\s*\([^)]*\)\s*;/,
        inlined
      );
      adapted.push({ name, content: updated });
    }
    return adapted;
  }

  private adaptCpp(files: Record<string, string>, testCasesJson: string): PistonFile[] {
    const adapted: PistonFile[] = [];
    for (const [name, content] of Object.entries(files)) {
      if (name === 'testcases.json') continue;
      const updated = content.replace(
        /string\s+content\s*=\s*readFile\s*\([^)]*\)\s*;/,
        `string content = R"JSON(${testCasesJson})JSON";`
      );
      adapted.push({ name, content: updated });
    }
    return adapted;
  }

  private adaptC(files: Record<string, string>, testCasesJson: string): PistonFile[] {
    const adapted: PistonFile[] = [];
    const escaped = testCasesJson.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    for (const [name, content] of Object.entries(files)) {
      if (name === 'testcases.json') continue;
      const lines = content.split('\n');
      let inFileRead = false;
      const result: string[] = [];
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
      adapted.push({ name, content: result.join('\n') });
    }
    return adapted;
  }

  private adaptGo(files: Record<string, string>, testCasesJson: string): PistonFile[] {
    const adapted: PistonFile[] = [];
    for (const [name, content] of Object.entries(files)) {
      if (name === 'testcases.json') continue;
      const lines = content.split('\n');
      const result: string[] = [];
      let skipUntilVar = false;
      for (const line of lines) {
        if (/data\s*,\s*err\s*:=\s*os\.ReadFile/.test(line)) {
          result.push(`  data := []byte(\`${testCasesJson}\`)`);
          result.push(`  var err error`);
          skipUntilVar = true;
          continue;
        }
        if (skipUntilVar) {
          if (/\s+var\s+testCases/.test(line) || /\s+testCases\s*:=\s*\[/.test(line)) {
            skipUntilVar = false;
            result.push(line);
          }
          continue;
        }
        result.push(line);
      }
      adapted.push({ name, content: result.join('\n') });
    }
    return adapted;
  }

  private adaptRust(files: Record<string, string>, testCasesJson: string): PistonFile[] {
    const adapted: PistonFile[] = [];
    for (const [name, content] of Object.entries(files)) {
      if (name === 'testcases.json') continue;
      const updated = content.replace(
        /let\s+\w+\s*=\s*fs::read_to_string\s*\([^)]*\)/,
        `let content = "${testCasesJson.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}".to_string()`
      );
      adapted.push({ name, content: updated });
    }
    return adapted;
  }
}
