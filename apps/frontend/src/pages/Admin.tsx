import { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
  RefreshCw, AlertTriangle, Users, BookOpen, Code2, Sparkles, MessageSquare,
  Search, ChevronLeft, ChevronRight, Eye, EyeOff, Trash2, Plus, X, Check,
  Shield, ShieldOff, Loader2, Activity, Save, Edit3, ExternalLink,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "users", label: "Users", icon: Users },
  { id: "problems", label: "Problems", icon: BookOpen },
  { id: "submissions", label: "Submissions", icon: Code2 },
  { id: "ai-reviews", label: "AI Reviews", icon: Sparkles },
  { id: "interviews", label: "Interviews", icon: MessageSquare },
] as const;

type Tab = (typeof TABS)[number]["id"];

interface AdminStats {
  totalUsers: number; totalProblems: number; totalSubmissions: number; totalReviews: number;
}

interface AdminUser {
  id: string; username: string; email: string; role: string; createdAt: string; submissionCount: number;
}

interface AdminProblem {
  id: string; title: string; slug: string; difficulty: string; category: string; isPublished: boolean;
  testCaseCount: number; submissionCount: number; acceptanceRate: number; createdAt: string;
}

interface AdminSubmission {
  id: string; userId: string; problemId: string; language: string; status: string; code: string;
  runtime: number; memory: number; createdAt: string;
  user: { id: string; username: string; email: string };
  problem: { id: string; title: string; slug: string };
  aiReview: { id: string; readabilityScore: number; timeComplexity: string; spaceComplexity: string } | null;
  interview: { id: string; score: number; verdict: string } | null;
}

interface AdminReview {
  id: string; timeComplexity: string; spaceComplexity: string; readabilityScore: number;
  edgeCaseScore: number; namingScore: number; createdAt: string;
  submission: { id: string; language: string; status: string; createdAt: string; user: { username: string }; problem: { title: string; slug: string } };
}

interface AdminInterview {
  id: string; question: string; answer: string; verdict: string; score: number; createdAt: string;
  submission: { id: string; language: string; status: string; createdAt: string; user: { username: string }; problem: { title: string; slug: string } };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "bg-[#6c63ff]" : "bg-[rgba(255,255,255,0.12)]"
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-[18px]" : "translate-x-[3px]"
      }`} />
    </button>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm shadow-lg ${
      type === "success" ? "bg-[rgba(81,207,102,0.15)] border border-[rgba(81,207,102,0.3)] text-[#51cf66]" : "bg-[rgba(255,82,82,0.15)] border border-[rgba(255,82,82,0.3)] text-[#ff5252]"
    }`}>
      {type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {message}
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [problems, setProblems] = useState<AdminProblem[]>([]);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [subPage, setSubPage] = useState(1);
  const [subStatus, setSubStatus] = useState("All");
  const [subLang, setSubLang] = useState("All");
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [interviews, setInterviews] = useState<AdminInterview[]>([]);

  const [showCreateProblem, setShowCreateProblem] = useState(false);
  const [editProblem, setEditProblem] = useState<AdminProblem | null>(null);
  const [showTestCases, setShowTestCases] = useState<{ id: string; title: string } | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AdminSubmission | null>(null);

  useEffect(() => { loadTab(); }, [tab, subPage, subStatus, subLang]);

  const loadTab = async () => {
    setLoading(true);
    try {
      switch (tab) {
        case "overview": setStats(await api.admin.getStats()); break;
        case "users": setUsers((await api.admin.listUsers()).data); break;
        case "problems": setProblems((await api.admin.listProblems()).data); break;
        case "submissions": {
          const res = await api.admin.listSubmissions({ status: subStatus, language: subLang, page: subPage });
          setSubmissions(res.data); setSubTotal(res.total);
          break;
        }
        case "ai-reviews": setReviews((await api.admin.listAiReviews()).data); break;
        case "interviews": setInterviews((await api.admin.listInterviews()).data); break;
      }
    } catch (e: any) { setToast({ message: e.message, type: "error" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-[#6b6b85] mt-1">System management and monitoring</p>
        </div>
        <button onClick={loadTab} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-sm text-[#a0a0b8] hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-[rgba(255,255,255,0.06)] overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setSubPage(1); setSelectedSubmission(null); }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
              tab === id ? "text-white border-[#6c63ff]" : "text-[#6b6b85] hover:text-[#a0a0b8] border-transparent"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats ? (
            <>
              {[
                { label: "Total Users", value: stats.totalUsers, color: "from-[#6c63ff] to-[#8b83ff]" },
                { label: "Total Problems", value: stats.totalProblems, color: "from-[#00d4ff] to-[#4de8ff]" },
                { label: "Total Submissions", value: stats.totalSubmissions, color: "from-[#51cf66] to-[#69db7c]" },
                { label: "AI Reviews", value: stats.totalReviews, color: "from-[#ff6b6b] to-[#ff8787]" },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-[#6b6b85] mt-1">{label}</div>
                </div>
              ))}
            </>
          ) : loading ? (
            <div className="col-span-4 flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#6c63ff]" /></div>
          ) : null}
        </div>
      )}

      {/* ── Users ── */}
      {tab === "users" && (
        <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Username</th>
                <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Email</th>
                <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Role</th>
                <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Submissions</th>
                <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Joined</th>
                <th className="text-right p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-3 font-medium text-white/80 text-xs">{u.username}</td>
                  <td className="p-3 text-[#a0a0b8] text-xs">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      u.role === "admin" ? "bg-[rgba(108,99,255,0.15)] text-[#6c63ff]" : "bg-[rgba(255,255,255,0.06)] text-[#a0a0b8]"
                    }`}>{u.role}</span>
                  </td>
                  <td className="p-3 text-[#a0a0b8] text-xs">{u.submissionCount}</td>
                  <td className="p-3 text-[#6b6b85] text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={async () => {
                          try {
                            const newRole = u.role === "admin" ? "user" : "admin";
                            await api.admin.updateUserRole(u.id, newRole);
                            setToast({ message: `${u.username} is now ${newRole}`, type: "success" });
                            loadTab();
                          } catch (e: any) { setToast({ message: e.message, type: "error" }); }
                        }}
                        className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[#6b6b85] hover:text-white transition-colors"
                        title={u.role === "admin" ? "Demote to user" : "Promote to admin"}
                      >
                        {u.role === "admin" ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
                          try {
                            await api.admin.deleteUser(u.id);
                            setToast({ message: "User deleted", type: "success" });
                            loadTab();
                          } catch (e: any) { setToast({ message: e.message, type: "error" }); }
                        }}
                        className="p-1.5 rounded-lg hover:bg-[rgba(255,82,82,0.1)] text-[#6b6b85] hover:text-[#ff5252] transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Problems ── */}
      {tab === "problems" && (
        <div className="space-y-4">
          <button onClick={() => setShowCreateProblem(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Create Problem
          </button>

          <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Title</th>
                  <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Slug</th>
                  <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Difficulty</th>
                  <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Category</th>
                  <th className="text-center p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Published</th>
                  <th className="text-center p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Tests</th>
                  <th className="text-right p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {problems.map((p) => (
                  <tr key={p.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="p-3 font-medium text-white/80 text-xs">{p.title}</td>
                    <td className="p-3 text-[#6b6b85] text-xs font-mono">{p.slug}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.difficulty === "easy" ? "bg-[rgba(81,207,102,0.15)] text-[#51cf66]" :
                        p.difficulty === "medium" ? "bg-[rgba(255,193,7,0.15)] text-[#ffc107]" :
                        "bg-[rgba(255,82,82,0.15)] text-[#ff5252]"
                      }`}>{p.difficulty}</span>
                    </td>
                    <td className="p-3 text-[#a0a0b8] text-xs">{p.category}</td>
                    <td className="p-3 text-center">
                      <Toggle
                        checked={p.isPublished}
                        onChange={async (v) => {
                          try { await api.admin.updateProblemStatus(p.id, v); loadTab(); }
                          catch (e: any) { setToast({ message: e.message, type: "error" }); }
                        }}
                      />
                    </td>
                    <td className="p-3 text-center text-[#a0a0b8] text-xs">{p.testCaseCount}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setShowTestCases({ id: p.id, title: p.title })} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[#6b6b85] hover:text-white" title="Test cases">
                          <Code2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditProblem(p)} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[#6b6b85] hover:text-white" title="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete "${p.title}"?`)) return;
                            try { await api.admin.deleteProblem(p.id); setToast({ message: "Problem deleted", type: "success" }); loadTab(); }
                            catch (e: any) { setToast({ message: e.message, type: "error" }); }
                          }}
                          className="p-1.5 rounded-lg hover:bg-[rgba(255,82,82,0.1)] text-[#6b6b85] hover:text-[#ff5252]" title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Create/Edit Problem Modal */}
          {(showCreateProblem || editProblem) && (
            <ProblemFormModal
              problem={editProblem}
              onClose={() => { setShowCreateProblem(false); setEditProblem(null); }}
              onSaved={() => { setShowCreateProblem(false); setEditProblem(null); loadTab(); }}
              onToast={setToast}
            />
          )}

          {/* Test Cases Modal */}
          {showTestCases && (
            <TestCasesModal
              problemId={showTestCases.id}
              problemTitle={showTestCases.title}
              onClose={() => setShowTestCases(null)}
              onSaved={() => setShowTestCases(null)}
              onToast={setToast}
            />
          )}
        </div>
      )}

      {/* ── Submissions ── */}
      {tab === "submissions" && (
        <div className="space-y-4">
          {selectedSubmission ? (
            <SubmissionDetailModal submission={selectedSubmission} onClose={() => setSelectedSubmission(null)} />
          ) : (
            <>
              <div className="flex gap-2">
                <select value={subStatus} onChange={e => { setSubStatus(e.target.value); setSubPage(1); }}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-xs focus:outline-none focus:border-[#6c63ff]">
                  {["All", "accepted", "wrong_answer", "time_limit", "runtime_error", "pending"].map(s => (
                    <option key={s} value={s} className="bg-[#1a1a2e]">{s === "All" ? "All Status" : s}</option>
                  ))}
                </select>
                <select value={subLang} onChange={e => { setSubLang(e.target.value); setSubPage(1); }}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-xs focus:outline-none focus:border-[#6c63ff]">
                  {["All", "python", "java", "cpp", "c", "go", "rust"].map(l => (
                    <option key={l} value={l} className="bg-[#1a1a2e]">{l === "All" ? "All Languages" : l}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">User</th>
                      <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Problem</th>
                      <th className="text-left p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Language</th>
                      <th className="text-center p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Status</th>
                      <th className="text-right p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Runtime</th>
                      <th className="text-right p-3 text-[10px] font-medium text-[#6b6b85] uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {submissions.map((s) => (
                      <tr key={s.id} className="hover:bg-[rgba(255,255,255,0.02)] cursor-pointer" onClick={() => setSelectedSubmission(s)}>
                        <td className="p-3 font-medium text-white/80 text-xs">{s.user.username}</td>
                        <td className="p-3 text-[#a0a0b8] text-xs">{s.problem.title}</td>
                        <td className="p-3 text-[#a0a0b8] text-xs">{s.language}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            s.status === "accepted" ? "bg-[rgba(81,207,102,0.15)] text-[#51cf66]" :
                            s.status === "wrong_answer" ? "bg-[rgba(255,82,82,0.15)] text-[#ff5252]" :
                            "bg-[rgba(255,193,7,0.15)] text-[#ffc107]"
                          }`}>{s.status}</span>
                        </td>
                        <td className="p-3 text-right text-[#a0a0b8] text-xs">{s.runtime ? `${s.runtime.toFixed(0)}ms` : "-"}</td>
                        <td className="p-3 text-right text-[#6b6b85] text-xs">{new Date(s.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {subTotal > 50 && (
                <div className="flex items-center justify-center gap-2">
                  <button disabled={subPage === 1} onClick={() => setSubPage(p => p - 1)}
                    className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#a0a0b8] disabled:opacity-30 hover:text-white">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[#6b6b85]">Page {subPage} of {Math.ceil(subTotal / 50)}</span>
                  <button disabled={subPage >= Math.ceil(subTotal / 50)} onClick={() => setSubPage(p => p + 1)}
                    className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#a0a0b8] disabled:opacity-30 hover:text-white">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── AI Reviews ── */}
      {tab === "ai-reviews" && (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{r.submission.problem.title}</span>
                  <span className="text-xs text-[#6b6b85]">by {r.submission.user.username}</span>
                </div>
                <span className="text-xs text-[#6b6b85]">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex gap-4 text-xs text-[#a0a0b8]">
                <span>Readability: <span className="text-white">{r.readabilityScore?.toFixed(1) ?? "-"}</span></span>
                <span>Time: <span className="text-white">{r.timeComplexity ?? "-"}</span></span>
                <span>Space: <span className="text-white">{r.spaceComplexity ?? "-"}</span></span>
                <span>Lang: <span className="text-white">{r.submission.language}</span></span>
              </div>
            </div>
          ))}
          {reviews.length === 0 && !loading && (
            <div className="text-center py-12 text-sm text-[#6b6b85]">No AI reviews yet</div>
          )}
        </div>
      )}

      {/* ── Interviews ── */}
      {tab === "interviews" && (
        <div className="space-y-3">
          {interviews.map((i) => (
            <div key={i.id} className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{i.submission.problem.title}</span>
                  <span className="text-xs text-[#6b6b85]">by {i.submission.user.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    i.verdict === "passed" ? "bg-[rgba(81,207,102,0.15)] text-[#51cf66]" : "bg-[rgba(255,193,7,0.15)] text-[#ffc107]"
                  }`}>{i.verdict ?? "pending"}</span>
                  <span className="text-xs text-[#6b6b85]">{new Date(i.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-[#a0a0b8] line-clamp-2">{i.question}</p>
              {i.score != null && <p className="text-xs text-[#6b6b85] mt-1">Score: {i.score.toFixed(1)}</p>}
            </div>
          ))}
          {interviews.length === 0 && !loading && (
            <div className="text-center py-12 text-sm text-[#6b6b85]">No interviews yet</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Problem Form Modal ──
function ProblemFormModal({ problem, onClose, onSaved, onToast }: {
  problem: AdminProblem | null; onClose: () => void; onSaved: () => void;
  onToast: (t: { message: string; type: "success" | "error" }) => void;
}) {
  const [form, setForm] = useState({
    title: problem?.title ?? "",
    slug: problem?.slug ?? "",
    difficulty: problem?.difficulty ?? "easy",
    category: problem?.category ?? "",
    description: "",
    constraints: "",
    starterCode: "",
    editorial: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (problem) {
      api.admin.listProblems().then(res => {
        const full = res.data.find((p: any) => p.id === problem.id);
        if (full) setForm(f => ({ ...f, description: full.description || "", constraints: full.constraints || "", editorial: full.editorial || "", starterCode: JSON.stringify(full.starterCode || {}) }));
      }).catch(() => {});
    }
  }, [problem?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug || !form.difficulty || !form.category || !form.description) {
      onToast({ message: "Title, slug, difficulty, category, and description are required", type: "error" }); return;
    }
    setSaving(true);
    try {
      const data = { ...form, starterCode: form.starterCode ? JSON.parse(form.starterCode) : {} };
      if (problem) await api.admin.updateProblem(problem.id, data);
      else await api.admin.createProblem(data);
      onToast({ message: problem ? "Problem updated" : "Problem created", type: "success" });
      onSaved();
    } catch (e: any) { onToast({ message: e.message, type: "error" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-[#1a1a2e] border border-[rgba(255,255,255,0.08)] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{problem ? "Edit Problem" : "Create Problem"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[#6b6b85]"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#a0a0b8] mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#a0a0b8] mb-1">Slug *</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#a0a0b8] mb-1">Difficulty *</label>
              <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff]">
                <option value="easy" className="bg-[#1a1a2e]">Easy</option>
                <option value="medium" className="bg-[#1a1a2e]">Medium</option>
                <option value="hard" className="bg-[#1a1a2e]">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#a0a0b8] mb-1">Category *</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a0a0b8] mb-1">Description *</label>
            <textarea rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a0a0b8] mb-1">Constraints</label>
            <textarea rows={3} value={form.constraints} onChange={e => setForm({ ...form, constraints: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a0a0b8] mb-1">Starter Code (JSON)</label>
            <textarea rows={3} value={form.starterCode} onChange={e => setForm({ ...form, starterCode: e.target.value })}
              placeholder='{"javascript": "function solve() { }"}'
              className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a0a0b8] mb-1">Editorial</label>
            <textarea rows={5} value={form.editorial} onChange={e => setForm({ ...form, editorial: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] font-mono" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-sm text-[#a0a0b8] hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {problem ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Test Cases Modal ──
function TestCasesModal({ problemId, problemTitle, onClose, onSaved, onToast }: {
  problemId: string; problemTitle: string; onClose: () => void; onSaved: () => void;
  onToast: (t: { message: string; type: "success" | "error" }) => void;
}) {
  const [testCases, setTestCases] = useState<{ input: string; expectedOutput: string; isHidden: boolean }[]>([
    { input: "", expectedOutput: "", isHidden: false },
    { input: "", expectedOutput: "", isHidden: false },
  ]);
  const [saving, setSaving] = useState(false);

  const addRow = () => setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }]);
  const removeRow = (i: number) => testCases.length > 1 && setTestCases(testCases.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, value: unknown) => {
    const upd = [...testCases];
    upd[i] = { ...upd[i], [field]: value };
    setTestCases(upd);
  };

  const handleSave = async () => {
    const valid = testCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim());
    if (valid.length === 0) { onToast({ message: "At least one test case with input and output is required", type: "error" }); return; }
    setSaving(true);
    try {
      await api.admin.updateTestCases(problemId, valid);
      onToast({ message: `${valid.length} test case(s) saved`, type: "success" });
      onSaved();
    } catch (e: any) { onToast({ message: e.message, type: "error" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl bg-[#1a1a2e] border border-[rgba(255,255,255,0.08)] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Test Cases</h2>
            <p className="text-xs text-[#6b6b85] mt-0.5">{problemTitle}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[#6b6b85]"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-2">
          {testCases.map((tc, i) => (
            <div key={i} className="flex gap-2 items-start p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
              <span className="text-xs text-[#6b6b85] mt-2 w-6">{i + 1}.</span>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-[#6b6b85] mb-0.5">Input</label>
                  <textarea rows={2} value={tc.input} onChange={e => updateRow(i, "input", e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-xs focus:outline-none focus:border-[#6c63ff] font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[#6b6b85] mb-0.5">Expected Output</label>
                  <textarea rows={2} value={tc.expectedOutput} onChange={e => updateRow(i, "expectedOutput", e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-xs focus:outline-none focus:border-[#6c63ff] font-mono" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 pt-1">
                <button onClick={() => updateRow(i, "isHidden", !tc.isHidden)}
                  className={`p-1.5 rounded-lg transition-colors ${tc.isHidden ? "bg-[rgba(108,99,255,0.15)] text-[#6c63ff]" : "text-[#6b6b85] hover:text-white"}`}
                  title={tc.isHidden ? "Hidden test case" : "Visible test case"}>
                  {tc.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => removeRow(i)} className="p-1.5 rounded-lg text-[#6b6b85] hover:text-[#ff5252] hover:bg-[rgba(255,82,82,0.1)]" title="Remove">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4">
          <button onClick={addRow} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-[rgba(255,255,255,0.15)] text-xs text-[#a0a0b8] hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-colors">
            <Plus className="w-3 h-3" /> Add Test Case
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-sm text-[#a0a0b8] hover:text-white">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Test Cases
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Submission Detail Modal ──
function SubmissionDetailModal({ submission, onClose }: { submission: AdminSubmission; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl bg-[#1a1a2e] border border-[rgba(255,255,255,0.08)] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Submission Detail</h2>
            <p className="text-xs text-[#6b6b85] mt-0.5">{submission.problem.title} by {submission.user.username}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[#6b6b85]"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { label: "Status", value: submission.status },
            { label: "Language", value: submission.language },
            { label: "Runtime", value: submission.runtime ? `${submission.runtime.toFixed(0)}ms` : "-" },
            { label: "Memory", value: submission.memory ? `${submission.memory.toFixed(1)}MB` : "-" },
            { label: "Created", value: new Date(submission.createdAt).toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
              <div className="text-[10px] font-medium text-[#6b6b85] uppercase">{label}</div>
              <div className="text-sm text-white mt-0.5">{value}</div>
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-medium text-[#a0a0b8] mb-1">Code</label>
          <pre className="p-3 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.06)] text-xs text-[#a0a0b8] font-mono overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">{submission.code}</pre>
        </div>
        {submission.aiReview && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-[#a0a0b8] mb-1">AI Review</label>
            <div className="p-3 rounded-lg bg-[rgba(108,99,255,0.05)] border border-[rgba(108,99,255,0.15)]">
              <div className="flex gap-3 text-xs text-[#a0a0b8]">
                <span>Readability: <span className="text-white">{submission.aiReview.readabilityScore?.toFixed(1)}</span></span>
                <span>Time: <span className="text-white">{submission.aiReview.timeComplexity}</span></span>
                <span>Space: <span className="text-white">{submission.aiReview.spaceComplexity}</span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
