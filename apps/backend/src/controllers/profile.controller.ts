import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { logger } from '../lib/logger.js';

function getPreviousDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const [profile, submissions, acceptedCount] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: req.userId },
        include: {
          user: {
            select: { id: true, username: true, email: true, createdAt: true },
          },
        },
      }),
      prisma.submission.findMany({
        where: { userId: req.userId },
        select: { status: true, problemId: true, createdAt: true },
      }),
      prisma.submission.count({
        where: { userId: req.userId, status: 'ACCEPTED' },
      }),
    ]);

    const total = submissions.length;
    const uniqueSolved = new Set(submissions.filter((s) => s.status === 'ACCEPTED').map((s) => s.problemId)).size;
    const acceptanceRate = total > 0 ? Math.round((acceptedCount / total) * 100) : 0;

    const acceptedDates = submissions
      .filter((s) => s.status === 'ACCEPTED' && s.createdAt)
      .map((s) => s.createdAt!.toISOString().slice(0, 10));
    const uniqueDays = [...new Set(acceptedDates)].sort().reverse();
    let streak = 0;
    if (uniqueDays.length > 0) {
      const mostRecent = uniqueDays[0];
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = getPreviousDate(today);
      if (mostRecent === today || mostRecent === yesterday) {
        streak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const prev = getPreviousDate(uniqueDays[i - 1]);
          if (uniqueDays[i] === prev) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    const badges: Array<{ id: string; label: string; icon: string; description: string }> = [];
    if (uniqueSolved >= 1) badges.push({ id: 'first_solve', label: 'First Solve', icon: '🌟', description: 'Solved your first problem' });
    if (uniqueSolved >= 5) badges.push({ id: 'problem_cruncher_5', label: 'Problem Cruncher', icon: '⚡', description: 'Solved 5 problems' });
    if (uniqueSolved >= 15) badges.push({ id: 'problem_cruncher_15', label: 'Code Machine', icon: '🔥', description: 'Solved 15 problems' });
    if (uniqueSolved >= 30) badges.push({ id: 'problem_cruncher_30', label: 'Coding Legend', icon: '🏆', description: 'Solved 30 problems' });
    if (streak >= 3) badges.push({ id: 'streak_3', label: '3-Day Streak', icon: '📅', description: 'Maintained a 3-day streak' });
    if (streak >= 7) badges.push({ id: 'streak_7', label: 'Week Warrior', icon: '📆', description: 'Maintained a 7-day streak' });
    if (streak >= 30) badges.push({ id: 'streak_30', label: 'Monthly Master', icon: '🗓️', description: 'Maintained a 30-day streak' });
    if (acceptanceRate >= 80) badges.push({ id: 'accuracy_80', label: 'Sharpshooter', icon: '🎯', description: '80%+ acceptance rate' });
    if (total >= 50) badges.push({ id: 'volume_50', label: 'Dedicated', icon: '💪', description: '50 total submissions' });

    res.json({
      user: {
        id: profile?.user?.id ?? req.userId,
        username: profile?.user?.username ?? '',
        email: profile?.user?.email ?? '',
        createdAt: profile?.user?.createdAt ?? new Date(),
      },
      bio: profile?.bio ?? '',
      location: profile?.location ?? '',
      company: profile?.company ?? '',
      github: profile?.github ?? '',
      linkedin: profile?.linkedin ?? '',
      website: profile?.website ?? '',
      country: profile?.country ?? '',
      skills: (profile?.skills as Array<{ name: string; proficiency: string }> | null) ?? [],
      xp: profile?.xp ?? 0,
      stats: { problemsSolved: uniqueSolved, acceptanceRate, streak, totalSubmissions: total },
      badges,
    });
  } catch (error) {
    logger.error({ err: error }, 'Get profile error');
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { bio, location, company, github, linkedin, website, country, skills } = req.body;

    const existingProfile = await prisma.profile.findUnique({ where: { userId: req.userId } });

    let profile;
    if (existingProfile) {
      profile = await prisma.profile.update({
        where: { userId: req.userId },
        data: {
          bio: bio !== undefined ? bio : existingProfile.bio,
          location: location !== undefined ? location : existingProfile.location,
          company: company !== undefined ? company : existingProfile.company,
          github: github !== undefined ? github : existingProfile.github,
          linkedin: linkedin !== undefined ? linkedin : existingProfile.linkedin,
          website: website !== undefined ? website : existingProfile.website,
          country: country !== undefined ? country : existingProfile.country,
          skills: skills !== undefined ? skills : existingProfile.skills,
        },
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          userId: req.userId, bio: bio || '', location: location || '',
          company: company || '', github: github || '', linkedin: linkedin || '',
          website: website || '', country: country || '', skills: skills || [],
        },
      });
    }

    res.json(profile);
  } catch (error) {
    logger.error({ err: error }, 'Update profile error');
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updateStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { xpIncrement } = req.body;

    const profile = await prisma.profile.update({
      where: { userId: req.userId },
      data: { xp: { increment: xpIncrement || 0 } },
    });

    res.json(profile);
  } catch (error) {
    logger.error({ err: error }, 'Update stats error');
    res.status(500).json({ error: 'Failed to update stats' });
  }
};

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const [submissions, acceptedSubmissions, profile] = await Promise.all([
      prisma.submission.count({ where: { userId: req.userId } }),
      prisma.submission.count({ where: { userId: req.userId, status: 'ACCEPTED' } }),
      prisma.profile.findUnique({
        where: { userId: req.userId },
        select: { xp: true, streak: true },
      }),
    ]);

    const solvedProblems = await prisma.submission.findMany({
      where: { userId: req.userId, status: 'ACCEPTED' },
      select: { problemId: true },
      distinct: ['problemId'],
    });

    res.json({
      totalSubmissions: submissions,
      acceptedSubmissions,
      problemsSolved: solvedProblems.length,
      xp: profile?.xp || 0,
      streak: profile?.streak || 0,
      successRate: submissions > 0 ? (acceptedSubmissions / submissions) * 100 : 0,
    });
  } catch (error) {
    logger.error({ err: error }, 'Get stats error');
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
