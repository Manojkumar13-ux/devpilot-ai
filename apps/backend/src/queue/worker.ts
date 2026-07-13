import IORedis from 'ioredis';
import { Worker, Job } from 'bullmq';
import { redisConnection, redisHealthConfig } from './redis.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { Judge0Service } from '../services/judge0.service.js';
import { generateSubmitRunner } from '../services/runner.js';
import { generateAiReview, AiReviewError } from '../services/ai-review.service.js';

const executionService = new Judge0Service();

async function checkRedis(): Promise<boolean> {
  const client = new IORedis(redisHealthConfig);
  client.on('error', () => {});
  try {
    await client.ping();
    return true;
  } catch {
    return false;
  } finally {
    client.disconnect();
  }
}

export const createWorker = async (): Promise<Worker | null> => {
  const available = await checkRedis();
  if (!available) {
    logger.warn('Redis unavailable — BullMQ worker will not start. Submission processing is disabled. To enable, start Redis and set REDIS_HOST/REDIS_PORT.');
    return null;
  }

  try {
    const worker = new Worker(
      'submission-queue',
      async (job: Job) => {
        const { submissionId, code, language, testCases } = job.data;

        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'PROCESSING' },
        });

        const runnerTestCases = (testCases || []).map((tc: any) => ({
          input: tc.input || '',
          expectedOutput: tc.expected || tc.expectedOutput || '',
        }));

        const { files } = generateSubmitRunner(language, code, runnerTestCases);
        const result = await executionService.execute(files, language);

        if (result.error) {
          const errorType = result.errorType || 'runtime_error';
          const status = errorType === 'timeout_error' ? 'TIMEOUT' : 'FAILED';
          const memory = result.memory || 0;
          await prisma.submission.update({
            where: { id: submissionId },
            data: { status, errorType, errorMessage: result.error, memory, completedAt: new Date() },
          });
          return { status, errorType, error: result.error };
        }

        // Store compiler warnings if present (e.g., Java "Note:" messages)
        if (result.compileWarnings) {
          await prisma.submission.update({
            where: { id: submissionId },
            data: { compileWarnings: result.compileWarnings },
          });
        }

        const testResults = result.results || [];
        let status = 'ACCEPTED';
        for (const tr of testResults) {
          if (!tr.pass && tr.pass !== undefined) { status = 'WRONG_ANSWER'; break; }
        }

        let totalRuntime = 0;
        let maxMemory = result.memory || 0;
        for (const tr of testResults) {
          totalRuntime += tr.runtime || 0;
          if ((tr.memory || 0) > maxMemory) maxMemory = tr.memory;
        }

        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status,
            testResults: testResults as any,
            runtime: testResults.length > 0 ? totalRuntime / testResults.length : 0,
            memory: maxMemory,
            completedAt: new Date(),
          },
        });

        if (status === 'ACCEPTED' && process.env.OPENAI_API_KEY) {
          const problem = await prisma.problem.findUnique({
            where: { id: job.data.problemId },
            select: { title: true },
          });
          generateAiReview(code, language, problem?.title || 'Unknown')
            .then(async (review) => {
              await prisma.aIReview.upsert({
                where: { submissionId },
                create: { submissionId, ...review },
                update: review,
              });
            })
            .catch(() => {});
        }

        return { status, testResults };
      },
      { connection: redisConnection, concurrency: 5 },
    );

    worker.on('completed', (job: Job) => {
      logger.info(`Job ${job.id} completed`);
    });

    worker.on('failed', (job: Job | undefined, error: Error) => {
      if (job) {
        const { submissionId } = job.data;
        logger.error({ err: error }, `Job ${job.id} (submission ${submissionId}) failed`);
        prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'FAILED', errorType: 'runtime_error', errorMessage: error.message, completedAt: new Date() },
        }).catch(() => {});
      }
    });

    return worker;
  } catch (err) {
    logger.warn({ err }, 'BullMQ worker could not be created');
    return null;
  }
};
