import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { logger } from '../lib/logger.js';

export const getProblems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const difficulty = req.query.difficulty as string;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const where: any = { isPublished: true };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          category: true,
          description: true,
          tags: true,
          companies: true,
          acceptanceRate: true,
          submissionCount: true,
          createdAt: true,
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.problem.count({ where }),
    ]);

    res.json({
      data: problems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Get problems error');
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
};

export const getProblemBySlug = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: {
        testCases: {
          where: { isHidden: false },
          select: {
            id: true,
            input: true,
            expectedOutput: true,
          },
        },
      },
    });

    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    res.json(problem);
  } catch (error) {
    logger.error({ err: error }, 'Get problem error');
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
};

export const getProblemById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: {
          where: { isHidden: false },
          select: {
            id: true,
            input: true,
            expectedOutput: true,
          },
        },
      },
    });

    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    res.json(problem);
  } catch (error) {
    logger.error({ err: error }, 'Get problem error');
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
};

export const getProblemStarterCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { language } = req.query;

    const problem = await prisma.problem.findUnique({
      where: { id },
      select: {
        starterCode: true,
      },
    });

    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    if (language && typeof language === 'string') {
      const code = problem.starterCode?.[language as keyof typeof problem.starterCode] || '';
      res.json({ language, code });
    } else {
      res.json(problem.starterCode);
    }
  } catch (error) {
    logger.error({ err: error }, 'Get starter code error');
    res.status(500).json({ error: 'Failed to fetch starter code' });
  }
};
