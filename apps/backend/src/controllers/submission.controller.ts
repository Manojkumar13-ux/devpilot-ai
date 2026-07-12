import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { logger } from '../lib/logger.js';
import { addSubmissionJob } from '../queue/index.js';
import { generateAiReview, AiReviewError } from '../services/ai-review.service.js';
import {
  generateInterviewQuestion,
  evaluateInterviewAnswer,
} from '../services/ai-interview.service.js';

export const runCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { code, language, problemId } = req.body;

    if (!code || !language || !problemId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          where: { isHidden: false },
        },
      },
    });

    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    const submission = await prisma.submission.create({
      data: {
        userId: req.userId,
        problemId,
        code,
        language,
        status: 'PENDING',
        startedAt: new Date(),
      },
    });

    const testCases = problem.testCases.map((tc: any) => ({
      input: tc.input,
      expected: tc.expectedOutput,
      isHidden: false,
    }));

    const queued = await addSubmissionJob({
      submissionId: submission.id,
      userId: req.userId,
      code,
      language,
      problemId,
      testCases,
      isSubmit: false,
    });

    if (!queued) {
      logger.warn({ submissionId: submission.id }, 'Queue unavailable — marking submission as failed');
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: 'FAILED', errorType: 'runtime_error', errorMessage: 'Execution queue is unavailable', completedAt: new Date() },
      });
      res.status(503).json({ error: 'Execution service is temporarily unavailable' });
      return;
    }

    res.json({
      submissionId: submission.id,
      status: 'PENDING',
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Run error');
    res.status(500).json({ error: error.message || 'Execution failed' });
  }
};

export const submitCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { code, language, problemId } = req.body;

    if (!code || !language || !problemId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: true,
      },
    });

    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    const submission = await prisma.submission.create({
      data: {
        userId: req.userId,
        problemId,
        code,
        language,
        status: 'PENDING',
        startedAt: new Date(),
      },
    });

    const testCases = problem.testCases.map((tc: any) => ({
      input: tc.input,
      expected: tc.expectedOutput,
      isHidden: tc.isHidden,
    }));

    const queued = await addSubmissionJob({
      submissionId: submission.id,
      userId: req.userId,
      code,
      language,
      problemId,
      testCases,
      isSubmit: true,
    });

    if (!queued) {
      logger.warn({ submissionId: submission.id }, 'Queue unavailable — marking submission as failed');
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: 'FAILED', errorType: 'runtime_error', errorMessage: 'Execution queue is unavailable', completedAt: new Date() },
      });
      res.status(503).json({ error: 'Execution service is temporarily unavailable' });
      return;
    }

    res.json({
      submissionId: submission.id,
      status: 'PENDING',
      message: 'Submission queued for processing',
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Submit error');
    res.status(500).json({ error: error.message || 'Submission failed' });
  }
};

export const getSubmissionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (submission.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      submissionId: submission.id,
      status: submission.status,
      testResults: submission.testResults,
      errorType: submission.errorType,
      errorMessage: submission.errorMessage,
      runtime: submission.runtime,
      memory: submission.memory,
      completedAt: submission.completedAt,
    });
  } catch (error) {
    logger.error({ err: error }, 'Status error');
    res.status(500).json({ error: 'Failed to fetch submission status' });
  }
};

export const getSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const language = req.query.language as string;

    const where: any = { userId: req.userId };

    if (status) {
      const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }

    if (language) {
      where.language = language;
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          problem: {
            select: {
              title: true,
              difficulty: true,
            },
          },
          aiReview: {
            select: {
              readabilityScore: true,
              edgeCaseScore: true,
              namingScore: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.submission.count({ where }),
    ]);

    res.json({
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Get submissions error');
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

export const getSubmissionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        problem: {
          select: {
            title: true,
            difficulty: true,
            category: true,
          },
        },
        aiReview: true,
        interview: true,
      },
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (submission.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(submission);
  } catch (error) {
    logger.error({ err: error }, 'Get submission error');
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
};

export const getSubmissionReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true, code: true, language: true, status: true, problemId: true },
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (submission.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const existing = await prisma.aIReview.findUnique({
      where: { submissionId },
    });

    if (existing) {
      if (existing.errorType) {
        res.json({ status: 'error', errorMessage: existing.errorMessage || 'AI review failed' });
        return;
      }
      res.json({
        status: 'completed',
        review: {
          id: existing.id,
          submissionId: existing.submissionId,
          timeComplexity: existing.timeComplexity,
          spaceComplexity: existing.spaceComplexity,
          readabilityScore: existing.readabilityScore,
          edgeCaseScore: existing.edgeCaseScore,
          namingScore: existing.namingScore,
          suggestedImprovement: existing.suggestedImprovement,
          createdAt: existing.createdAt,
        },
      });
      return;
    }

    if (submission.status !== 'ACCEPTED') {
      res.json({ status: 'pending' });
      return;
    }

    // Re-check existence (worker may have created one during the previous DB calls)
    const doubleCheck = await prisma.aIReview.findUnique({
      where: { submissionId },
    });
    if (doubleCheck) {
      if (doubleCheck.errorType) {
        res.json({ status: 'error', errorMessage: doubleCheck.errorMessage || 'AI review failed' });
        return;
      }
      res.json({
        status: 'completed',
        review: {
          id: doubleCheck.id,
          submissionId: doubleCheck.submissionId,
          timeComplexity: doubleCheck.timeComplexity,
          spaceComplexity: doubleCheck.spaceComplexity,
          readabilityScore: doubleCheck.readabilityScore,
          edgeCaseScore: doubleCheck.edgeCaseScore,
          namingScore: doubleCheck.namingScore,
          suggestedImprovement: doubleCheck.suggestedImprovement,
          createdAt: doubleCheck.createdAt,
        },
      });
      return;
    }

    // Generate review on-demand
    try {
      const problem = await prisma.problem.findUnique({
        where: { id: submission.problemId },
        select: { title: true },
      });
      const review = await generateAiReview(submission.code, submission.language, problem?.title || 'Unknown');
      // Use upsert to handle race with worker's async review creation
      const created = await prisma.aIReview.upsert({
        where: { submissionId },
        create: { submissionId, ...review },
        update: review,
      });
      res.json({
        status: 'completed',
        review: {
          id: created.id,
          submissionId: created.submissionId,
          timeComplexity: created.timeComplexity,
          spaceComplexity: created.spaceComplexity,
          readabilityScore: created.readabilityScore,
          edgeCaseScore: created.edgeCaseScore,
          namingScore: created.namingScore,
          suggestedImprovement: created.suggestedImprovement,
          createdAt: created.createdAt,
        },
      });
    } catch (err) {
      const msg = err instanceof AiReviewError ? err.message : 'AI review failed';
      await prisma.aIReview.upsert({
        where: { submissionId },
        create: {
          submissionId,
          timeComplexity: '',
          spaceComplexity: '',
          readabilityScore: 0,
          edgeCaseScore: 0,
          namingScore: 0,
          suggestedImprovement: '',
          errorType: 'ai_review_error',
          errorMessage: msg,
        },
        update: {
          errorType: 'ai_review_error',
          errorMessage: msg,
        },
      });
      res.json({ status: 'error', errorMessage: msg });
    }
  } catch (error) {
    logger.error({ err: error }, 'Review error');
    res.status(500).json({ error: 'Failed to fetch review' });
  }
};

export const getInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true },
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (submission.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const interview = await prisma.interviewFollowup.findUnique({
      where: { submissionId },
    });

    if (!interview) {
      res.json({ exists: false });
      return;
    }

    res.json({
      exists: true,
      id: interview.id,
      submissionId: interview.submissionId,
      question: interview.question,
      answer: interview.answer,
      verdict: interview.verdict,
      strengths: interview.strengths,
      weaknesses: interview.weaknesses,
      score: interview.score,
      evaluation: interview.evaluation ? JSON.parse(interview.evaluation) : null,
      answered: !!interview.answer,
      createdAt: interview.createdAt,
      answeredAt: interview.updatedAt,
    });
  } catch (error) {
    logger.error({ err: error }, 'Get interview error');
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
};

export const generateInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true, code: true, language: true, status: true, problemId: true },
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (submission.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const existing = await prisma.interviewFollowup.findUnique({
      where: { submissionId },
    });
    if (existing) {
      res.json({
        interviewId: existing.id,
        question: existing.question,
        createdAt: existing.createdAt,
      });
      return;
    }

    const problem = await prisma.problem.findUnique({
      where: { id: submission.problemId },
      select: { title: true, category: true },
    });

    const question = await generateInterviewQuestion(
      submission.code,
      submission.language,
      problem?.title || 'Unknown',
      problem?.category || 'Unknown',
    );

    const interview = await prisma.interviewFollowup.create({
      data: {
        submissionId,
        question,
      },
    });

    res.json({
      interviewId: interview.id,
      question: interview.question,
      createdAt: interview.createdAt,
    });
  } catch (error) {
    logger.error({ err: error }, 'Generate interview error');
    if (error instanceof AiReviewError) {
      res.status(502).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to generate interview question' });
  }
};

export const submitInterviewAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { submissionId } = req.params;
    const { answer } = req.body;

    if (!answer || typeof answer !== 'string' || !answer.trim()) {
      res.status(400).json({ error: 'Answer is required' });
      return;
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true, code: true, language: true, problemId: true },
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (submission.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const interview = await prisma.interviewFollowup.findUnique({
      where: { submissionId },
    });

    if (!interview) {
      res.status(400).json({ error: 'No interview question has been generated yet' });
      return;
    }

    const problem = await prisma.problem.findUnique({
      where: { id: submission.problemId },
      select: { title: true },
    });

    const evaluation = await evaluateInterviewAnswer(
      submission.code,
      submission.language,
      problem?.title || 'Unknown',
      interview.question,
      answer.trim(),
    );

    const overallScore = Math.round(
      (evaluation.scores.correctness + evaluation.scores.clarity
        + evaluation.scores.depth + evaluation.scores.communication) / 4,
    );

    await prisma.interviewFollowup.update({
      where: { id: interview.id },
      data: {
        answer: answer.trim(),
        verdict: evaluation.verdict,
        score: overallScore,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        evaluation: JSON.stringify(evaluation.scores),
      },
    });

    res.json({
      verdict: evaluation.verdict,
      scores: evaluation.scores,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      score: overallScore,
    });
  } catch (error) {
    logger.error({ err: error }, 'Submit answer error');
    if (error instanceof AiReviewError) {
      res.status(502).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
};
