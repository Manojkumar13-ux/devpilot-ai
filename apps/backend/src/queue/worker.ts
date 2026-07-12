import IORedis from 'ioredis';
import { Worker, Job } from 'bullmq';
import { redisConnection, redisHealthConfig } from './redis.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { SandboxService } from '../services/sandbox.service.js';
import { generateSubmitRunner } from '../services/runner.js';
import { generateAiReview, AiReviewError } from '../services/ai-review.service.js';

const sandboxService = new SandboxService();

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

        const { files, command } = generateSubmitRunner(language, code, runnerTestCases);
        const result = await sandboxService.dockerRunWithRunner(files, command);

        if (result.error) {
          const errorType = result.errorType || 'runtime_error';
          const status = errorType === 'timeout_error' ? 'TIMEOUT' : 'FAILED';
          await prisma.submission.update({
            where: { id: submissionId },
            data: { status, errorType, errorMessage: result.error, completedAt: new Date() },
          });
          return { status, errorType, error: result.error };
        }

        const testResults = result.results || [];
        let status = 'ACCEPTED';
        for (const tr of testResults) {
          if (!tr.pass && tr.pass !== undefined) { status = 'WRONG_ANSWER'; break; }
        }

        let totalRuntime = 0;
        let maxMemory = 0;
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

        if (status === 'ACCEPTED') {
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
            .catch(async (err) => {
              const msg = err instanceof AiReviewError ? err.message : 'AI review failed';
              await prisma.aIReview.upsert({
                where: { submissionId },
                create: {
                  submissionId, timeComplexity: '', spaceComplexity: '',
                  readabilityScore: 0, edgeCaseScore: 0, namingScore: 0,
                  suggestedImprovement: '', errorType: 'ai_review_error', errorMessage: msg,
                },
                update: { errorType: 'ai_review_error', errorMessage: msg },
              });
            });
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
