export type SubmissionStatus =
  | "PENDING"
  | "PROCESSING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "FAILED"
  | "TIMEOUT";

export type ErrorType =
  | "compilation_error"
  | "runtime_error"
  | "timeout_error"
  | "memory_error"
  | null;

export interface TestResult {
  pass: boolean;
  runtime: number;
  memory: number;
  error: string | null;
  expected: string;
  actual: string;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  code: string;
  language: string;
  status: SubmissionStatus;
  testResults: TestResult[] | null;
  runtime: number | null;
  memory: number | null;
  errorType: ErrorType;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  startedAt: string | null;
}

export interface AiReview {
  id: string;
  submissionId: string;
  timeComplexity: string;
  spaceComplexity: string;
  readabilityScore: number;
  edgeCaseScore: number;
  namingScore: number;
  suggestedImprovement: string;
  errorType: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface CreateSubmissionRequest {
  problemId: string;
  code: string;
  language: string;
  input?: string;
}

export interface InterviewFollowup {
  id: string;
  submissionId: string;
  question: string;
  userAnswer: string | null;
  verdict: string | null;
  strengths: string | null;
  weaknesses: string | null;
  score: number | null;
  createdAt: string;
  answeredAt: string | null;
}
