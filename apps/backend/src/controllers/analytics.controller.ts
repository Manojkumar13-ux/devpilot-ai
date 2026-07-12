import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { logger } from '../lib/logger.js';

const FAILED_STATUSES = new Set(['WRONG_ANSWER', 'FAILED', 'TIMEOUT']);
const PENDING_STATUSES = new Set(['PENDING', 'PROCESSING']);

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const submissions = await prisma.submission.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      include: {
        problem: {
          select: { id: true, title: true, difficulty: true, category: true },
        },
      },
    });

    const total = submissions.length;
    const accepted = submissions.filter((s) => s.status === 'ACCEPTED');
    const failed = submissions.filter((s) => FAILED_STATUSES.has(s.status));
    const pending = submissions.filter((s) => PENDING_STATUSES.has(s.status));

    const solvedMap = new Map<string, typeof submissions[0]>();
    for (const s of accepted) {
      if (!solvedMap.has(s.problemId)) solvedMap.set(s.problemId, s);
    }
    const solved = solvedMap.size;

    const difficultyBreakdown: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
    for (const s of solvedMap.values()) {
      const d = s.problem?.difficulty || 'Easy';
      if (d in difficultyBreakdown) difficultyBreakdown[d]++;
    }

    const langCount: Record<string, number> = {};
    for (const s of submissions) {
      langCount[s.language] = (langCount[s.language] || 0) + 1;
    }
    const languageUsage = Object.entries(langCount).map(([language, count]) => ({ language, count }));

    const topicMap = new Map<string, { attempts: number; accepted: number }>();
    for (const s of submissions) {
      const cat = s.problem?.category || 'Uncategorized';
      const e = topicMap.get(cat) || { attempts: 0, accepted: 0 };
      e.attempts++;
      if (s.status === 'ACCEPTED') e.accepted++;
      topicMap.set(cat, e);
    }
    const topicBreakdown = Array.from(topicMap.entries())
      .map(([topic, st]) => ({
        topic, attempts: st.attempts, accepted: st.accepted,
        successRate: st.attempts > 0 ? Math.round((st.accepted / st.attempts) * 100) : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts);

    const dailyMap = new Map<string, { total: number; accepted: number }>();
    for (const s of submissions) {
      const day = s.createdAt.toISOString().slice(0, 10);
      const e = dailyMap.get(day) || { total: 0, accepted: 0 };
      e.total++;
      if (s.status === 'ACCEPTED') e.accepted++;
      dailyMap.set(day, e);
    }
    const dailyStats = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, st]) => ({ date, total: st.total, accepted: st.accepted }));

    const contributionData = [];
    const earliest = submissions.length > 0 ? submissions[0].createdAt : new Date();
    const startDate = new Date(Math.max(earliest.getTime(), Date.now() - 364 * 86400000));
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().slice(0, 10);
      const e = dailyMap.get(dayStr);
      contributionData.push({ date: dayStr, count: e ? e.accepted : 0 });
    }

    const weekMap = new Map<string, number>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      weekMap.set(d.toLocaleDateString('en-US', { weekday: 'short' }), 0);
    }
    const dayMs = 86400000;
    for (const s of accepted) {
      const diff = Math.floor((now.getTime() - s.createdAt.getTime()) / dayMs);
      if (diff >= 0 && diff < 7) {
        const key = s.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
        weekMap.set(key, (weekMap.get(key) || 0) + 1);
      }
    }
    const weeklyStats = Array.from(weekMap.entries()).map(([day, solvedCount]) => ({ day, solved: solvedCount }));

    const acceptanceRate = total > 0 ? Math.round((accepted.length / total) * 100) : 0;
    const avgRuntime = accepted.length > 0
      ? Math.round(accepted.reduce((s, c) => s + (c.runtime ?? 0), 0) / accepted.length) : 0;
    const bestRuntime = accepted.length > 0
      ? Math.min(...accepted.map((c) => c.runtime ?? Infinity)) : 0;

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      if (dailyMap.has(dayStr)) {
        streak++;
      } else {
        break;
      }
    }

    const aiReviews = await prisma.aIReview.findMany({
      where: { submission: { userId: req.userId }, errorType: null, readabilityScore: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: { readabilityScore: true, edgeCaseScore: true, namingScore: true, createdAt: true },
    });
    const aiScoreTrend = aiReviews.map((r) => ({
      date: r.createdAt.toISOString().slice(0, 10),
      readability: r.readabilityScore ?? 0,
      edgeCases: r.edgeCaseScore ?? 0,
      naming: r.namingScore ?? 0,
      average: Math.round(((r.readabilityScore ?? 0) + (r.edgeCaseScore ?? 0) + (r.namingScore ?? 0)) / 3),
    }));

    const interviews = await prisma.interviewFollowup.findMany({
      where: { submission: { userId: req.userId }, score: { not: null } },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: { score: true, createdAt: true },
    });
    const interviewScoreTrend = interviews.map((r) => ({
      date: r.createdAt.toISOString().slice(0, 10),
      score: r.score ?? 0,
    }));

    const recentSubmissions = await prisma.submission.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { problem: { select: { title: true } } },
    });
    const recentActivity = recentSubmissions.map((s) => ({
      id: s.id,
      problem: s.problem?.title ?? 'Unknown',
      status: s.status,
      language: s.language,
      createdAt: s.createdAt.toISOString(),
    }));

    res.json({
      total, accepted: accepted.length, failed: failed.length, pending: pending.length,
      solved, acceptanceRate, avgRuntime, bestRuntime, streak,
      difficultyBreakdown, languageUsage, dailyStats, contributionData, weeklyStats,
      topicBreakdown, aiScoreTrend, interviewScoreTrend, recentActivity,
    });
  } catch (error) {
    logger.error({ err: error }, 'Analytics error');
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
