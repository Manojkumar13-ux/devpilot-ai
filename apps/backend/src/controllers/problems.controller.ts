import { Request, Response } from "express";
import { ProblemsService } from "../services/problems.service.js";

const problemsService = new ProblemsService();

export class ProblemsController {
  async list(req: Request, res: Response) {
    try {
      const { difficulty, category, search } = req.query;
      const problems = await problemsService.list({
        difficulty: difficulty as string | undefined,
        category: category as string | undefined,
        search: search as string | undefined,
      });
      res.json(problems);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch problems" });
    }
  }

  async getBySlug(req: Request, res: Response) {
    try {
      const problem = await problemsService.getBySlug(req.params.slug);
      if (!problem) {
        res.status(404).json({ error: "Problem not found" });
        return;
      }
      res.json(problem);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch problem" });
    }
  }
}
