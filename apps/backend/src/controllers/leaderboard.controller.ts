import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { logger } from '../lib/logger.js';
import { cacheWrap } from '../lib/cache.js';

const CACHE_TTL = 60;

export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const cacheKey = `leaderboard:${page}:${limit}`;

    const result = await cacheWrap(cacheKey, async () => {
      const rows: Array<{
        id: string; username: string; problems_solved: bigint; total_submissions: bigint;
        accepted_count: bigint; streak: number; avg_ai_score: number; avg_interview_score: number;
      }> = await prisma.$queryRaw`
        SELECT id, username, problems_solved, total_submissions, accepted_count, streak, avg_ai_score, avg_interview_score FROM (
          SELECT u.id, u.username,
            COALESCE(COUNT(DISTINCT CASE WHEN s.status = 'ACCEPTED' THEN s."problemId" END), 0)::bigint as problems_solved,
            COUNT(s.id)::bigint as total_submissions,
            COALESCE(COUNT(CASE WHEN s.status = 'ACCEPTED' THEN 1 END), 0)::bigint as accepted_count,
            COALESCE(p.streak, 0) as streak,
            COALESCE((SELECT AVG((r."readabilityScore" + r."edgeCaseScore" + r."namingScore") / 3.0) FROM "AIReview" r JOIN "Submission" ss ON ss.id = r."submissionId" WHERE ss."userId" = u.id AND ss.status = 'ACCEPTED'), 0) as avg_ai_score,
            COALESCE((SELECT AVG(i.score) FROM "InterviewFollowup" i JOIN "Submission" ss ON ss.id = i."submissionId" WHERE ss."userId" = u.id AND ss.status = 'ACCEPTED'), 0) as avg_interview_score
          FROM "User" u
          LEFT JOIN "Submission" s ON s."userId" = u.id
          LEFT JOIN "Profile" p ON p."userId" = u.id
          GROUP BY u.id, u.username, p.streak
        ) ranked
        ORDER BY problems_solved DESC, accepted_count::float / NULLIF(total_submissions, 0) DESC NULLS LAST, avg_ai_score DESC, streak DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const totalResult: Array<{ count: bigint }> = await prisma.$queryRaw`
        SELECT COUNT(*)::bigint as count FROM "User"
      `;
      const total = Number(totalResult[0]?.count || 0);

      const data = rows.map((r, i) => ({
        rank: offset + i + 1,
        userId: r.id,
        username: r.username,
        problemsSolved: Number(r.problems_solved),
        acceptanceRate: r.total_submissions > 0
          ? Math.round((Number(r.accepted_count) / Number(r.total_submissions)) * 100) : 0,
        avgAiScore: Math.round(r.avg_ai_score * 10) / 10,
        avgInterviewScore: Math.round(r.avg_interview_score * 10) / 10,
        streak: r.streak,
      }));

      return {
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }, CACHE_TTL);

    res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Leaderboard error');
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
