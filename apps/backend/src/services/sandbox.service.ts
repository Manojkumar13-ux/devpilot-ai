import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { logger } from '../lib/logger.js';

export class SandboxService {
    private sandboxImageName = 'devpilot-sandbox:v3';
    private sandboxDir = path.join(process.cwd(), 'infrastructure', 'docker', 'sandbox');
    private dockerCmd: string;

    constructor() {
        this.dockerCmd = SandboxService.resolveDocker();
    }

    private static resolveDocker(): string {
        const envPath = process.env.DOCKER_PATH;
        if (envPath && fs.existsSync(envPath)) return envPath;
        // Common Windows Docker installation paths
        const candidates = [
            'docker',
            'docker.exe',
            'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe',
            'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker',
            '/usr/bin/docker',
            '/usr/local/bin/docker',
        ];
        for (const cmd of candidates) {
            try {
                execSync(`"${cmd}" version`, { stdio: 'pipe', timeout: 5000 });
                return cmd;
            } catch { continue; }
        }
        return 'docker';
    }

    async ensureSandboxImage(): Promise<void> {
        await this.dockerSpawn(['version', '--format', '{{.Server.Version}}']);

        try {
            await this.dockerSpawn(['image', 'inspect', this.sandboxImageName]);
            return;
        } catch {
            logger.info('Building sandbox image (this may take a few minutes)...');
            const stdout = await this.dockerSpawn([
                'build', '-t', this.sandboxImageName,
                '-f', 'Dockerfile.sandbox',
                this.sandboxDir,
            ]);
            const lines = stdout.split('\n').filter(l =>
                l.includes('Step') || l.includes('Successfully') || l.includes('ERROR')
            );
            for (const line of lines) {
                logger.info(`  ${line.trim()}`);
            }
        }
    }

    private dockerSpawn(args: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = spawn(this.dockerCmd, args);
            let stdout = '';
            let stderr = '';
            proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
            proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
            proc.on('close', (code: number | null) => {
                if (code === 0) resolve(stdout);
                else reject(new Error(stderr.trim() || `docker exited with code ${code}`));
            });
            proc.on('error', reject);
        });
    }

    async dockerRunWithRunner(
        files: Record<string, string>,
        command: string,
        timeout = 30000
    ): Promise<{ output: string; error?: string; errorType?: string; memory?: number; compileWarnings?: string; results?: any[] }> {
        try {
            await this.ensureSandboxImage();
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                return { output: '', error: 'Docker is not installed or not accessible. Install Docker Desktop and ensure it is running, or set JUDGE0_API_URL / PISTON_API_URL to use a remote execution service.', errorType: 'runtime_error', results: [] };
            }
            return { output: '', error: err.message || 'Docker sandbox failed to initialize', errorType: 'runtime_error', results: [] };
        }

        // Write runner files into the container using base64-inline Node.js commands.
        // This bypasses the baked-in runner.js entirely and avoids bind mount issues on Windows.
        const writeCmds: string[] = [];
        for (const [name, content] of Object.entries(files)) {
            const b64 = Buffer.from(content).toString('base64');
            writeCmds.push(`node -e "require('fs').writeFileSync('/tmp/${name}',Buffer.from('${b64}','base64'))"`);
        }
        // Chain: write all files, then execute the runner command
        const shellCmd = writeCmds.join(' && ') + ' && ' + command;

        return new Promise((resolve) => {
            const docker = spawn(this.dockerCmd, [
                'run', '-i', '--rm',
                '--entrypoint', 'sh',
                '--network', 'none',
                '--memory=256m',
                '--memory-swap=256m',
                '--cpus=0.5',
                '--read-only',
                '--tmpfs', '/tmp:size=64m,exec,nosuid',
                '--pids-limit', '512',
                this.sandboxImageName,
                '-c', shellCmd
            ]);

            let outputData = '';
            let errorData = '';

            docker.stdout.on('data', (data: Buffer) => { outputData += data.toString(); });
            docker.stderr.on('data', (data: Buffer) => { errorData += data.toString(); });

            let settled = false;

            docker.on('close', (exitCode: number | null) => {
                if (settled) return;
                settled = true;

                try {
                    if (exitCode !== 0) {
                        const rawErr = errorData || outputData;
                        let parsed: any;
                        try { parsed = JSON.parse(rawErr); } catch { parsed = {}; }
                        resolve({
                            output: '',
                            error: parsed.error || rawErr || 'Execution failed',
                            errorType: parsed.errorType || 'runtime_error',
                            results: []
                        });
                        return;
                    }

                    try {
                        const success = JSON.parse(outputData);
                        if (success.results) {
                            const allPassed = success.results.every((r: any) => r.pass);
                            const errorList = success.results.filter((r: any) => r.errorType || r.error);
                            const firstError = errorList[0];
                            resolve({
                                output: outputData,
                                results: success.results,
                                error: allPassed ? undefined : (firstError?.error || 'Some tests failed'),
                                errorType: firstError?.errorType || (allPassed ? undefined : 'runtime_error'),
                            });
                        } else {
                            resolve({ output: outputData, results: [] });
                        }
                    } catch {
                        resolve({ output: outputData, results: [] });
                    }
                } catch {
                    resolve({ output: '', error: 'Execution failed to parse.', errorType: 'runtime_error' });
                }
            });

            docker.on('error', () => {
                if (settled) return;
                settled = true;
                resolve({ output: '', error: 'Failed to launch Docker container.', errorType: 'runtime_error' });
            });

            docker.stdin.end();

            setTimeout(() => {
                if (settled) return;
                settled = true;
                try { docker.kill('SIGKILL'); } catch {}
                resolve({ output: '', error: 'Time limit exceeded', errorType: 'timeout_error' });
            }, timeout);
        });
    }

    async dockerRun(
        language: string,
        code: string,
        inputOrTestCases: string | any[] = []
    ): Promise<{ output: string; error?: string; errorType?: string; memory?: number; compileWarnings?: string; results?: any[] }> {
        await this.ensureSandboxImage();

        let testCases: any[] = [];
        if (typeof inputOrTestCases === 'string') {
            testCases = [{ input: inputOrTestCases, expected: '' }];
        } else if (Array.isArray(inputOrTestCases)) {
            testCases = inputOrTestCases.map((tc: any) => ({
                input: tc.input || '',
                expected: tc.expected || tc.expectedOutput || ''
            }));
            if (testCases.length === 0) {
                testCases = [{ input: '', expected: '' }];
            }
        } else {
            testCases = [{ input: '', expected: '' }];
        }

        return new Promise((resolve) => {
            const payload = JSON.stringify({ code, language, testCases });

            const docker = spawn('docker', [
                'run', '-i', '--rm',
                '--network', 'none',
                '--memory=256m',
                '--memory-swap=256m',
                '--cpus=0.5',
                '--read-only',
                '--tmpfs', '/tmp:size=64m,exec,nosuid',
                '--pids-limit', '512',
                this.sandboxImageName
            ]);

            let outputData = '';
            let errorData = '';

            docker.stdout.on('data', (data: Buffer) => {
                outputData += data.toString();
            });

            docker.stderr.on('data', (data: Buffer) => {
                errorData += data.toString();
            });

            let settled = false;

            docker.on('close', (exitCode: number | null) => {
                if (settled) return;
                settled = true;

                try {
                    const rawOutput = errorData || outputData;
                    let parsed: any;
                    try {
                        parsed = JSON.parse(rawOutput);
                    } catch {
                        parsed = {};
                    }

                    if (exitCode !== 0 && parsed.error) {
                        const errorType = parsed.errorType || 'runtime_error';
                        resolve({
                            output: '',
                            error: parsed.error,
                            errorType,
                            results: parsed.results || []
                        });
                        return;
                    }

                    try {
                        const success = JSON.parse(outputData);
                        if (success.results) {
                            const allPassed = success.results.every((r: any) => r.passed);
                            const errorList = success.results.filter((r: any) => r.errorType);
                            const firstError = errorList[0];
                            resolve({
                                output: outputData,
                                results: success.results,
                                error: allPassed ? undefined : (firstError?.error || 'Some tests failed'),
                                errorType: firstError?.errorType || 'runtime_error',
                            });
                        } else {
                            resolve({ output: outputData, results: [] });
                        }
                    } catch {
                        resolve({ output: outputData, results: [] });
                    }
                } catch {
                    resolve({ output: '', error: 'Execution failed to parse.', errorType: 'runtime_error' });
                }
            });

            docker.on('error', () => {
                if (settled) return;
                settled = true;
                resolve({ output: '', error: 'Failed to launch Docker container.', errorType: 'runtime_error' });
            });

            docker.stdin.write(payload);
            docker.stdin.end();

            setTimeout(() => {
                if (settled) return;
                settled = true;
                try { docker.kill('SIGKILL'); } catch {}
                resolve({
                    output: '',
                    error: 'Time limit exceeded',
                    errorType: 'timeout_error'
                });
            }, 30000);
        });
    }
}
