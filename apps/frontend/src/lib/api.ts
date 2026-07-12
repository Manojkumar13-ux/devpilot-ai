import type {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  CreateSubmissionRequest,
  User,
} from "@devpilot/shared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

let tokenInterceptor: string | null = null;

export function setAuthToken(token: string | null) {
  tokenInterceptor = token;
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (tokenInterceptor) {
    headers["Authorization"] = `Bearer ${tokenInterceptor}`;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

export const api = {
  auth: {
    register: (data: RegisterRequest) =>
      request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: LoginRequest) =>
      request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
    me: () => request<User>("/api/auth/me"),
    logout: () => request<{ message: string }>("/api/auth/logout", { method: "POST" }),
  },
  problems: {
    list: (params?: { search?: string; difficulty?: string; category?: string }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.difficulty) qs.set("difficulty", params.difficulty);
      if (params?.category) qs.set("category", params.category);
      const q = qs.toString();
      return request(`/api/problems${q ? `?${q}` : ""}`);
    },
    get: (slug: string) => request<any>(`/api/problems/slug/${slug}`),
  },
  profile: {
    get: () => request("/api/profile"),
    update: (data: Record<string, unknown>) =>
      request("/api/profile", { method: "PATCH", body: JSON.stringify(data) }),
  },
  submissions: {
    run: (data: CreateSubmissionRequest) =>
      request<{ submissionId: string; status: string }>("/api/submissions/run", { method: "POST", body: JSON.stringify(data) }),
    submit: (data: CreateSubmissionRequest) =>
      request<{ submissionId: string; status: string; message: string }>("/api/submissions/submit", { method: "POST", body: JSON.stringify(data) }),
    list: (params?: { status?: string; language?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status && params.status !== "All") qs.set("status", params.status);
      if (params?.language && params.language !== "All") qs.set("language", params.language);
      if (params?.page && params.page > 1) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const q = qs.toString();
      return request(`/api/submissions${q ? `?${q}` : ""}`);
    },
    get: (id: string) => request<any>(`/api/submissions/${id}`),
    review: (id: string) => request(`/api/submissions/${id}/review`),
    interview: {
      generate: (id: string) => request(`/api/submissions/${id}/interview`, { method: "POST" }),
      get: (id: string) => request(`/api/submissions/${id}/interview`),
      submitAnswer: (id: string, answer: string) =>
        request(`/api/submissions/${id}/interview-answer`, { method: "POST", body: JSON.stringify({ answer }) }),
    },
  },
  analytics: {
    get: () => request("/api/analytics"),
  },
  leaderboard: {
    get: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page && params.page > 1) qs.set("page", String(params.page));
      if (params?.limit && params.limit !== 20) qs.set("limit", String(params.limit));
      const q = qs.toString();
      return request(`/api/leaderboard${q ? `?${q}` : ""}`);
    },
  },
  admin: {
    getStats: () => request("/api/admin/stats"),
    listUsers: () => request("/api/admin/users"),
    updateUserRole: (id: string, role: string) =>
      request(`/api/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
    deleteUser: (id: string) =>
      request(`/api/admin/users/${id}`, { method: "DELETE" }),
    listProblems: () => request("/api/admin/problems"),
    createProblem: (data: Record<string, unknown>) =>
      request("/api/admin/problems", { method: "POST", body: JSON.stringify(data) }),
    updateProblem: (id: string, data: Record<string, unknown>) =>
      request(`/api/admin/problems/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    updateProblemStatus: (id: string, isPublished: boolean) =>
      request(`/api/admin/problems/${id}/status`, { method: "PATCH", body: JSON.stringify({ isPublished }) }),
    deleteProblem: (id: string) =>
      request(`/api/admin/problems/${id}`, { method: "DELETE" }),
    updateTestCases: (id: string, testCases: { input: string; expectedOutput: string; isHidden?: boolean }[]) =>
      request(`/api/admin/problems/${id}/test-cases`, { method: "PUT", body: JSON.stringify({ testCases }) }),
    listSubmissions: (params?: { status?: string; language?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status && params.status !== "All") qs.set("status", params.status);
      if (params?.language && params.language !== "All") qs.set("language", params.language);
      if (params?.page && params.page > 1) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const q = qs.toString();
      return request(`/api/admin/submissions${q ? `?${q}` : ""}`);
    },
    getSubmission: (id: string) => request(`/api/admin/submissions/${id}`),
    listAiReviews: () => request("/api/admin/ai-reviews"),
    listInterviews: () => request("/api/admin/interviews"),
  },
  settings: {
    get: () => request("/api/settings"),
    update: (data: Record<string, unknown>) =>
      request("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request("/api/settings/change-password", { method: "POST", body: JSON.stringify(data) }),
    deleteAccount: (data: { password: string }) =>
      request("/api/settings/account", { method: "DELETE", body: JSON.stringify(data) }),
  },
};
