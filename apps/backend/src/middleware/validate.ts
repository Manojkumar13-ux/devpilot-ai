import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req[source] = result.data;
    next();
  };
}

// Reusable schemas
export const schemas = {
  submission: {
    run: z.object({
      problemId: z.string().min(1),
      code: z.string().min(1).max(50000),
      language: z.enum(['python', 'java', 'cpp', 'c', 'go', 'rust']),
    }),
    submit: z.object({
      problemId: z.string().min(1),
      code: z.string().min(1).max(50000),
      language: z.enum(['python', 'java', 'cpp', 'c', 'go', 'rust']),
    }),
    interviewAnswer: z.object({
      answer: z.string().min(1).max(10000),
    }),
  },
  settings: {
    changePassword: z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    }),
    deleteAccount: z.object({
      password: z.string().min(1),
    }),
  },
  admin: {
    updateRole: z.object({
      role: z.enum(['user', 'admin']),
    }),
    createProblem: z.object({
      title: z.string().min(1).max(200),
      slug: z.string().min(1).max(200),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      category: z.string().min(1).max(100),
      description: z.string().min(1).max(50000),
      constraints: z.string().max(10000).optional(),
      examples: z.array(z.any()).optional(),
      tags: z.array(z.string()).optional(),
      hints: z.array(z.string()).optional(),
      starterCode: z.record(z.string()).optional(),
      editorial: z.string().max(50000).optional(),
      complexity: z.any().optional(),
    }),
    updateTestCases: z.object({
      testCases: z.array(z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().optional(),
      })).min(1),
    }),
  },
};
