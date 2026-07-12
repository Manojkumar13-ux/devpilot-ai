import { Queue } from 'bullmq';
import { redisConnection, redisHealthConfig } from './redis.js';

export { redisConnection, redisHealthConfig };

let queue: Queue | null = null;
let queueFailed = false;

function getQueue(): Queue | null {
  if (queueFailed) return null;
  if (!queue) {
    try {
      queue = new Queue('submission-queue', {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 100 },
        },
      });
    } catch (err) {
      queueFailed = true;
      return null;
    }
  }
  return queue;
}

export function getSubmissionQueue(): Queue | null {
  return getQueue();
}

export interface AddSubmissionJobData {
  submissionId: string;
  userId: string;
  code: string;
  language: string;
  problemId: string;
  testCases: Array<{
    input: string;
    expected: string;
    isHidden: boolean;
  }>;
  isSubmit: boolean;
}

export const addSubmissionJob = async (data: AddSubmissionJobData): Promise<boolean> => {
  const q = getQueue();
  if (!q) return false;
  await q.add('submission', data, { priority: data.isSubmit ? 1 : 2 });
  return true;
};
