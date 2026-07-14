import { PrismaClient } from '@prisma/client';

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForDb(prisma: PrismaClient, retries = 5, delay = 3000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      if (i < retries - 1) {
        console.log(`DB not ready, retrying in ${delay}ms (${i + 1}/${retries})...`);
        await sleep(delay);
      }
    }
  }
  return false;
}

async function setup() {
  const prisma = new PrismaClient();

  const ready = await waitForDb(prisma);
  if (!ready) {
    console.warn('DB unreachable after retries — skipping table creation, server will start anyway');
    await prisma.$disconnect();
    return;
  }

  console.log('DB reachable, creating tables...');

  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "_prisma_migrations"`);

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Profile" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
    bio TEXT,
    location TEXT,
    company TEXT,
    github TEXT,
    linkedin TEXT,
    website TEXT,
    country TEXT,
    xp INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    badges JSON NOT NULL DEFAULT '[]',
    skills JSON NOT NULL DEFAULT '[]',
    settings JSON NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Problem" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    difficulty TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    constraints TEXT NOT NULL,
    examples JSON NOT NULL DEFAULT '[]',
    "starterCode" JSON NOT NULL DEFAULT '{}',
    tags JSON NOT NULL DEFAULT '[]',
    companies JSON NOT NULL DEFAULT '[]',
    hints JSON NOT NULL DEFAULT '[]',
    editorial TEXT,
    complexity JSON,
    "acceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "submissionCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "TestCase" (
    id TEXT PRIMARY KEY,
    input TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "problemId" TEXT NOT NULL REFERENCES "Problem"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Submission" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "problemId" TEXT NOT NULL REFERENCES "Problem"(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    status TEXT NOT NULL,
    "testResults" JSON NOT NULL DEFAULT '[]',
    runtime DOUBLE PRECISION NOT NULL DEFAULT 0,
    memory DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorType" TEXT,
    "compileWarnings" TEXT,
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AIReview" (
    id TEXT PRIMARY KEY,
    "submissionId" TEXT NOT NULL UNIQUE REFERENCES "Submission"(id) ON DELETE CASCADE,
    "timeComplexity" TEXT,
    "spaceComplexity" TEXT,
    "readabilityScore" DOUBLE PRECISION,
    "edgeCaseScore" DOUBLE PRECISION,
    "namingScore" DOUBLE PRECISION,
    "suggestedImprovement" TEXT,
    "errorType" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "InterviewFollowup" (
    id TEXT PRIMARY KEY,
    "submissionId" TEXT NOT NULL UNIQUE REFERENCES "Submission"(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    evaluation TEXT,
    verdict TEXT,
    score DOUBLE PRECISION,
    strengths TEXT,
    weaknesses TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('All tables created');
  await prisma.$disconnect();
}

setup().catch(e => {
  console.error('Setup failed:', e);
});
