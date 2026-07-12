import { Router, IRouter } from 'express';
import os from 'os';
import { spawn } from 'child_process';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma.js';
import { redisHealthConfig, getSubmissionQueue } from '../queue/index.js';
import { logger } from '../lib/logger.js';
import { Request, Response } from 'express';

const router: IRouter = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, { status: string; latency: number; details?: unknown }>;
  system: {
    platform: string;
    cpu: { cores: number; loadAvg: number[] };
    memory: { total: number; free: number; usagePercent: number };
    node: string;
    pid: number;
  };
}

async function checkPostgres(): Promise<{ status: string; latency: number; details?: unknown }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', latency: Date.now() - start };
  } catch (err) {
    return { status: 'disconnected', latency: Date.now() - start, details: String(err) };
  }
}

async function checkRedis(): Promise<{ status: string; latency: number; details?: unknown }> {
  const start = Date.now();
  const client = new IORedis(redisHealthConfig);
  client.on('error', () => {});
  try {
    const pong = await client.ping();
    return { status: pong === 'PONG' ? 'connected' : 'error', latency: Date.now() - start };
  } catch (err) {
    return { status: 'disconnected', latency: Date.now() - start, details: String(err) };
  } finally {
    client.disconnect();
  }
}

async function checkQueue(): Promise<{ status: string; latency: number; details?: unknown }> {
  const start = Date.now();
  try {
    const q = getSubmissionQueue();
    if (!q) return { status: 'unreachable', latency: Date.now() - start, details: 'Queue not initialized (Redis unavailable)' };
    const counts = await q.getJobCounts();
    return { status: 'reachable', latency: Date.now() - start, details: counts };
  } catch (err) {
    return { status: 'unreachable', latency: Date.now() - start, details: String(err) };
  }
}

async function checkDocker(): Promise<{ status: string; latency: number; details?: unknown }> {
  const start = Date.now();
  try {
    const containers = await spawnDocker(['info', '--format', '{{.Containers}}']);
    const totalContainers = parseInt(containers.trim(), 10) || 0;
    const psOutput = await spawnDocker(['ps', '--format', '{{.Names}}']);
    const runningContainers = psOutput.trim() ? psOutput.trim().split('\n').length : 0;
    return {
      status: 'reachable',
      latency: Date.now() - start,
      details: { totalContainers, runningContainers },
    };
  } catch (err) {
    return { status: 'unreachable', latency: Date.now() - start, details: String(err) };
  }
}

function spawnDocker(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('docker', args);
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

function buildSystemMetrics() {
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  return {
    platform: os.platform(),
    cpu: { cores: os.cpus().length, loadAvg: os.loadavg() },
    memory: {
      total: totalMem,
      free: freeMem,
      usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
      process: { rss: mem.rss, heapTotal: mem.heapTotal, heapUsed: mem.heapUsed, external: mem.external },
    },
    node: process.version,
    pid: process.pid,
  };
}

async function buildHealth(): Promise<HealthStatus> {
  const [pg, redis, queue, docker] = await Promise.all([
    checkPostgres(),
    checkRedis(),
    checkQueue(),
    checkDocker(),
  ]);

  const allChecks = { postgres: pg, redis, queue, docker };
  const degraded = Object.values(allChecks).some(c => c.status !== 'connected' && c.status !== 'reachable');
  const unhealthy = Object.values(allChecks).every(c => c.status !== 'connected' && c.status !== 'reachable');

  return {
    status: unhealthy ? 'unhealthy' : degraded ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.1.0',
    checks: allChecks,
    system: buildSystemMetrics(),
  };
}

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await buildHealth();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    logger.error({ err }, 'Health check failed');
    res.status(503).json({ status: 'unhealthy', error: String(err) });
  }
});

router.get('/ready', async (_req: Request, res: Response) => {
  try {
    const [pg, redis] = await Promise.all([checkPostgres(), checkRedis()]);
    const ready = pg.status === 'connected' && redis.status === 'connected';
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks: { postgres: pg, redis },
    });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: String(err) });
  }
});

router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
  });
});

export default router;
