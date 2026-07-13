import { PrismaClient } from "@prisma/client";
import type { Problem, ProblemListItem, Difficulty, ProblemCategory } from "@devpilot/shared";

const prisma = new PrismaClient();

export class ProblemsService {
  async list(filters: { difficulty?: string; category?: string; search?: string }): Promise<ProblemListItem[]> {
    const where: any = {};
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.category) where.category = filters.category;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { tags: { has: filters.search } },
      ];
    }
    const problems = await prisma.problem.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        category: true,
        tags: true,
        acceptanceRate: true,
        submissionCount: true,
        createdAt: true,
      },
    });
    return problems.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty as Difficulty,
      category: p.category as ProblemCategory,
      tags: (p.tags as string[]) || [],
      acceptanceRate: p.acceptanceRate,
      submissionCount: p.submissionCount,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async getBySlug(slug: string): Promise<Problem | null> {
    const problem = await prisma.problem.findUnique({
      where: { slug },
    });
    if (!problem) return null;
    return {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty as Difficulty,
      category: problem.category as ProblemCategory,
      description: problem.description,
      constraints: problem.constraints,
      examples: problem.examples as any,
      starterCode: problem.starterCode as any,
      tags: (problem.tags as string[]) || [],
      companies: (problem.companies as string[]) || [],
      hints: (problem.hints as string[]) || [],
      editorial: problem.editorial,
      complexity: problem.complexity as any,
      acceptanceRate: problem.acceptanceRate,
      submissionCount: problem.submissionCount,
      isPublished: problem.isPublished,
      createdAt: problem.createdAt.toISOString(),
    };
  }
}
