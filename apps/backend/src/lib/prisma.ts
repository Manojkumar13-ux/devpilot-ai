import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const poolSize = parseInt(process.env.PRISMA_POOL_SIZE || '15', 10);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.LOG_LEVEL === 'debug'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
