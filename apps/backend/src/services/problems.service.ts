import { PrismaClient } from "@prisma/client";
import type { Problem, ProblemListItem } from "@devpilot/shared";

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
      },
    });
    return problems.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty as any,
      category: p.category,
      tags: p.tags,
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
      difficulty: problem.difficulty as any,
      category: problem.category,
      description: problem.description,
      constraints: problem.constraints,
      examples: problem.examples as any,
      starterCode: problem.starterCode as any,
      tags: problem.tags,
      companies: problem.companies,
      hints: problem.hints as any,
      editorial: problem.editorial,
      complexity: problem.complexity as any,
      createdAt: problem.createdAt.toISOString(),
    };
  }
}
