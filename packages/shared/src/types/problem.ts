export type Difficulty = "Easy" | "Medium" | "Hard";

export type ProblemCategory =
  | "Arrays"
  | "Strings"
  | "Trees"
  | "Dynamic Programming"
  | "Graphs";

export const SUPPORTED_LANGUAGES = ["python", "java", "cpp", "c"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: ProblemCategory;
  description: string;
  constraints: string;
  examples: string[];
  starterCode: Record<Language, string>;
  tags: string[];
  companies: string[];
  hints: string[];
  editorial: string | null;
  complexity: Record<string, string> | null;
  acceptanceRate: number;
  submissionCount: number;
  isPublished: boolean;
  createdAt: string;
}

export interface ProblemListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: ProblemCategory;
  tags: string[];
  acceptanceRate: number;
  submissionCount: number;
  createdAt: string;
}

export interface TestCase {
  id: string;
  problemId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ProblemWithTestCases extends Problem {
  testCases: TestCase[];
}
