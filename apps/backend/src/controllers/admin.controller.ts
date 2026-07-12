import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalProblems, totalSubmissions, totalReviews] = await Promise.all([
      prisma.user.count(),
      prisma.problem.count(),
      prisma.submission.count(),
      prisma.aIReview.count(),
    ]);
    res.json({ totalUsers, totalProblems, totalSubmissions, totalReviews });
  } catch { res.status(500).json({ error: 'Failed to fetch stats' }); }
};

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true, role: true, createdAt: true, _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: users.map(u => ({ ...u, submissionCount: u._count.submissions, _count: undefined })) });
  } catch { res.status(500).json({ error: 'Failed to fetch users' }); }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) { res.status(400).json({ error: 'Invalid role' }); return; }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, username: true, email: true, role: true },
    });
    res.json(user);
  } catch { res.status(500).json({ error: 'Failed to update user role' }); }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete user' }); }
};

export const listAdminProblems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problems = await prisma.problem.findMany({
      include: { _count: { select: { testCases: true, submissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: problems.map(p => ({ ...p, testCaseCount: p._count.testCases, submissionCount: p._count.submissions, _count: undefined })) });
  } catch { res.status(500).json({ error: 'Failed to fetch problems' }); }
};

export const createProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, slug, difficulty, category, description, constraints, examples, tags, hints, starterCode, editorial, complexity } = req.body;
    if (!title || !slug || !difficulty || !category || !description) { res.status(400).json({ error: 'Missing required fields' }); return; }

    const problem = await prisma.problem.create({
      data: { title, slug, difficulty, category, description, constraints: constraints || '', examples: examples || [], tags: tags || [], hints: hints || [], starterCode: starterCode || {}, editorial: editorial || null, complexity: complexity || null },
    });
    res.status(201).json(problem);
  } catch (error: any) {
    if (error?.code === 'P2002') { res.status(409).json({ error: 'A problem with this slug already exists' }); return; }
    res.status(500).json({ error: 'Failed to create problem' });
  }
};

export const updateProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, slug, difficulty, category, description, constraints, examples, tags, hints, starterCode, editorial, complexity } = req.body;
    const problem = await prisma.problem.update({
      where: { id: req.params.id },
      data: { ...(title !== undefined && { title }), ...(slug !== undefined && { slug }), ...(difficulty !== undefined && { difficulty }), ...(category !== undefined && { category }), ...(description !== undefined && { description }), ...(constraints !== undefined && { constraints }), ...(examples !== undefined && { examples }), ...(tags !== undefined && { tags }), ...(hints !== undefined && { hints }), ...(starterCode !== undefined && { starterCode }), ...(editorial !== undefined && { editorial }), ...(complexity !== undefined && { complexity }) },
    });
    res.json(problem);
  } catch { res.status(500).json({ error: 'Failed to update problem' }); }
};

export const updateProblemStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isPublished } = req.body;
    const problem = await prisma.problem.update({
      where: { id: req.params.id },
      data: { isPublished: !!isPublished },
    });
    res.json(problem);
  } catch { res.status(500).json({ error: 'Failed to update problem status' }); }
};

export const deleteProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.problem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Problem deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete problem' }); }
};

export const updateTestCases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testCases } = req.body;
    if (!Array.isArray(testCases)) { res.status(400).json({ error: 'testCases must be an array' }); return; }

    await prisma.testCase.deleteMany({ where: { problemId: req.params.id } });

    const created = await prisma.testCase.createMany({
      data: testCases.map((tc: { input: string; expectedOutput: string; isHidden?: boolean }) => ({
        problemId: req.params.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden ?? false,
      })),
    });
    res.json({ message: 'Test cases updated', count: created.count });
  } catch { res.status(500).json({ error: 'Failed to update test cases' }); }
};

export const updateStarterCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { starterCode } = req.body;
    const problem = await prisma.problem.update({
      where: { id: req.params.id },
      data: { starterCode: starterCode || {} },
    });
    res.json(problem);
  } catch { res.status(500).json({ error: 'Failed to update starter code' }); }
};

export const updateEditorial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { editorial } = req.body;
    const problem = await prisma.problem.update({
      where: { id: req.params.id },
      data: { editorial: editorial || null },
    });
    res.json(problem);
  } catch { res.status(500).json({ error: 'Failed to update editorial' }); }
};

export const listSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, language, page = '1', limit = '50' } = req.query;
    const where: any = {};
    if (status && status !== 'All') where.status = status;
    if (language && language !== 'All') where.language = language;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, email: true } },
          problem: { select: { id: true, title: true, slug: true } },
          aiReview: { select: { id: true, readabilityScore: true, timeComplexity: true, spaceComplexity: true } },
          interview: { select: { id: true, score: true, verdict: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.submission.count({ where }),
    ]);
    res.json({ data: submissions, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch { res.status(500).json({ error: 'Failed to fetch submissions' }); }
};

export const getAdminSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        problem: { select: { id: true, title: true, slug: true } },
        aiReview: true,
        interview: true,
      },
    });
    if (!submission) { res.status(404).json({ error: 'Submission not found' }); return; }
    res.json(submission);
  } catch { res.status(500).json({ error: 'Failed to fetch submission' }); }
};

export const listAiReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviews = await prisma.aIReview.findMany({
      include: {
        submission: {
          select: { id: true, language: true, status: true, createdAt: true, user: { select: { username: true } }, problem: { select: { title: true, slug: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: reviews });
  } catch { res.status(500).json({ error: 'Failed to fetch AI reviews' }); }
};

export const listInterviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interviews = await prisma.interviewFollowup.findMany({
      include: {
        submission: {
          select: { id: true, language: true, status: true, createdAt: true, user: { select: { username: true } }, problem: { select: { title: true, slug: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: interviews });
  } catch { res.status(500).json({ error: 'Failed to fetch interviews' }); }
};
