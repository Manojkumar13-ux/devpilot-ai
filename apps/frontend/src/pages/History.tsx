import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { api } from "../lib/api";

interface SubmissionRow {
  id: string;
  problemId: string;
  code: string;
  language: string;
  status: string;
  testResults: unknown;
  runtime: number | null;
  memory: number | null;
  errorType: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  startedAt: string | null;
  problem: { title: string; difficulty: string } | null;
  aiReview: { readabilityScore: number; edgeCaseScore: number; namingScore: number } | null;
}

const LANGUAGES = ["All", "javascript", "python", "java", "cpp", "go", "rust", "typescript"];

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Wrong Answer", value: "WRONG_ANSWER" },
  { label: "Failed", value: "FAILED" },
  { label: "Time Limit Exceeded", value: "TIMEOUT" },
  { label: "Pending", value: "PENDING,PROCESSING" },
];

const STATUS_BADGE: Record<string, { dot: string; bg: string; label: string }> = {
  ACCEPTED:     { dot: "bg-green-400",  bg: "bg-green-500/10 text-green-400 border-green-500/20",   label: "Accepted" },
  WRONG_ANSWER: { dot: "bg-red-400",    bg: "bg-red-500/10 text-red-400 border-red-500/20",         label: "Wrong Answer" },
  FAILED:       { dot: "bg-red-400",    bg: "bg-red-500/10 text-red-400 border-red-500/20",         label: "Failed" },
  TIMEOUT:      { dot: "bg-yellow-400", bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", label: "TLE" },
  PENDING:      { dot: "bg-gray-400",   bg: "bg-gray-500/10 text-gray-400 border-gray-500/20",       label: "Pending" },
  PROCESSING:   { dot: "bg-blue-400",   bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",       label: "Processing" },
};

function StatusPill({ status, errorType }: { status: string; errorType: string | null }) {
  const badge = STATUS_BADGE[status] || STATUS_BADGE.PENDING;
  let label = badge.label;

  if (status === "FAILED" && errorType) {
    if (errorType === "compilation_error") label = "Compile Error";
    else if (errorType === "runtime_error") label = "Runtime Error";
    else if (errorType === "memory_error") label = "MLE";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${badge.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
      {label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(8)].map((_, i) => (
        <td key={i} className="p-4"><div className="skeleton h-4 w-14" /></td>
      ))}
    </tr>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [data, setData] = useState<{ submissions: SubmissionRow[]; pagination: { page: number; limit: number; total: number; pages: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [langFilter, setLangFilter] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError("");
    api.submissions.list({ status: statusFilter, language: langFilter, page, limit: 20 })
      .then((res) => {
        setData({
          submissions: res.data ?? [],
          pagination: res.pagination ?? { page: 1, limit: 20, total: 0, pages: 1 },
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load submissions"))
      .finally(() => setLoading(false));
  }, [statusFilter, langFilter, page]);

  const submissions = data?.submissions ?? [];
  const pagination = data?.pagination;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Submission History</h1>
          <p className="text-sm text-[#a0a0b8] mt-1">
            {pagination ? `${pagination.total} total submission${pagination.total !== 1 ? "s" : ""}` : "Track your coding progress"}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field !w-auto"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={langFilter}
          onChange={(e) => { setLangFilter(e.target.value); setPage(1); }}
          className="input-field !w-auto"
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l === "All" ? "All Languages" : l}</option>
          ))}
        </select>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#6b6b85]">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left p-4 text-[10px] font-medium text-[#6b6b85] uppercase tracking-wider w-10">#</th>
                <th className="text-left p-4 text-[10px] font-medium text-[#6b6b85] uppercase tracking-wider">Problem</th>
                <th className="text-left p-4 text-[10px] font-medium text-[#6b6b85] uppercase tracking-wider">Language</th>
                <th className="text-left p-4 text-[10px] font-medium text-[#6b6b85] uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-[10px] font-medium text-[#6b6b85] uppercase tracking-wider">Runtime</th>
                <th className="text-left p-4 text-[10px] font-medium text-[#6b6b85] uppercase tracking-wider">Memory</th>
                <th className="text-left p-4 text-[10px] font-medium text-[#6b6b85] uppercase tracking-wider">AI Score</th>
                <th className="text-left p-4 text-[10px] font-medium text-[#6b6b85] uppercase tracking-wider">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {loading ? (
                [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-300">Failed to load submissions</p>
                    <p className="text-xs text-[#6b6b85] mt-1">{error}</p>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <Filter className="w-6 h-6 text-[#6b6b85] mx-auto mb-2" />
                    <p className="text-sm text-[#a0a0b8]">No submissions yet.</p>
                    <p className="text-xs text-[#6b6b85] mt-1">Solve a problem to see your history here.</p>
                  </td>
                </tr>
              ) : (
                submissions.map((s, idx) => {
                  const avgScore = s.aiReview
                    ? Math.round((s.aiReview.readabilityScore + s.aiReview.edgeCaseScore + s.aiReview.namingScore) / 3)
                    : null;
                  const rowNum = ((pagination?.page ?? 1) - 1) * (pagination?.limit ?? 20) + idx + 1;
                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`transition-colors cursor-pointer ${
                        idx % 2 === 1 ? "bg-white/[0.02]" : ""
                      } hover:bg-white/[0.04]`}
                      onClick={() => navigate(`/submissions/${s.id}`)}
                    >
                      <td className="p-4 text-[#6b6b85] text-xs font-mono">{rowNum}</td>
                      <td className="p-4 text-white/80 text-xs font-medium max-w-[200px] truncate">
                        {s.problem?.title || s.problemId.slice(0, 8)}
                      </td>
                      <td className="p-4">
                        <span className="text-[11px] font-mono text-[#a0a0b8] uppercase">{s.language}</span>
                      </td>
                      <td className="p-4">
                        <StatusPill status={s.status} errorType={s.errorType} />
                      </td>
                      <td className="p-4 text-[#a0a0b8] font-mono text-xs">{s.runtime != null ? `${s.runtime}ms` : "—"}</td>
                      <td className="p-4 text-[#a0a0b8] font-mono text-xs">{s.memory != null ? `${s.memory}KB` : "—"}</td>
                      <td className="p-4 text-xs font-mono">
                        {avgScore != null ? (
                          <span className={
                            avgScore >= 7 ? "text-green-400" : avgScore >= 4 ? "text-yellow-400" : "text-red-400"
                          }>
                            {avgScore}/10
                          </span>
                        ) : (
                          <span className="text-[#6b6b85]">—</span>
                        )}
                      </td>
                      <td className="p-4 text-[#6b6b85] text-xs whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center">
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-[#6b6b85]">...</span>}
                <button
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    p === page ? "bg-[#6c63ff] text-white" : "text-[#6b6b85] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
