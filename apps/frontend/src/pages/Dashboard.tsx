import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Code2,
  TrendingUp,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Trophy,
  RefreshCw,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useAuth } from "../hooks/AuthProvider";
import { api } from "../lib/api";

interface Analytics {
  total: number;
  accepted: number;
  failed: number;
  pending: number;
  solved: number;
  acceptanceRate: number;
  avgRuntime: number;
  bestRuntime: number;
  streak: number;
  difficultyBreakdown: Record<string, number>;
  languageUsage: Array<{ language: string; count: number }>;
  dailyStats: Array<{ date: string; total: number; accepted: number }>;
  weeklyStats: Array<{ day: string; solved: number }>;
  topicBreakdown: Array<{ topic: string; attempts: number; accepted: number; successRate: number }>;
  aiScoreTrend: Array<{ date: string; readability: number; edgeCases: number; naming: number; average: number }>;
  interviewScoreTrend: Array<{ date: string; score: number }>;
  recentActivity: Array<{ id: string; problem: string; status: string; language: string; createdAt: string }>;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "ACCEPTED") return <CheckCircle2 className="w-4 h-4 text-[#00e676]" />;
  if (status === "WRONG_ANSWER" || status === "FAILED" || status === "TIMEOUT") return <XCircle className="w-4 h-4 text-[#ff5252]" />;
  return <Clock className="w-4 h-4 text-[#ffd740]" />;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const TOPIC_COLORS = ["#6c63ff", "#00d4ff", "#00e676", "#ffd740", "#ff5252", "#8b83ff", "#40e0ff", "#69f0ae"];

function LoadingSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="skeleton h-8 w-72" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 skeleton h-64 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.analytics.get()
      .then(setAnalytics)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="glass-card p-8 text-center">
          <Activity className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-300">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">Retry</button>
        </div>
      </div>
    );
  }

  const a = analytics;
  const isEmpty = !a || a.total === 0;

  const statCards = isEmpty ? [
    { icon: Code2, label: "Problems Solved", value: "0", color: "from-[#6c63ff] to-[#8b83ff]" },
    { icon: TrendingUp, label: "Success Rate", value: "—", color: "from-[#00e676] to-[#69f0ae]" },
    { icon: Zap, label: "Current Streak", value: "0 days", color: "from-[#ffd740] to-[#ffe57f]" },
    { icon: Activity, label: "Total Submissions", value: "0", color: "from-[#00d4ff] to-[#40e0ff]" },
  ] : [
    { icon: Code2, label: "Problems Solved", value: String(a!.solved), color: "from-[#6c63ff] to-[#8b83ff]" },
    { icon: TrendingUp, label: "Success Rate", value: `${a!.acceptanceRate}%`, color: "from-[#00e676] to-[#69f0ae]" },
    { icon: Zap, label: "Current Streak", value: `${a!.streak} days`, color: "from-[#ffd740] to-[#ffe57f]" },
    { icon: Activity, label: "Total Submissions", value: String(a!.total), color: "from-[#00d4ff] to-[#40e0ff]" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back{user?.username ? `, ${user.username}` : ""}
          </h1>
          <p className="text-sm text-[#a0a0b8] mt-1">
            {isEmpty ? "Start solving problems to see your stats" : "Here's your coding progress overview"}
          </p>
        </div>
        <Link to="/problems" className="btn-primary">
          <Code2 className="w-4 h-4" />
          {isEmpty ? "Solve Your First Problem" : "Practice Now"}
        </Link>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card-hover p-5"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `linear-gradient(135deg, ${stat.color.replace("from-", "").replace("to-", "").split(" ").filter(Boolean).join(", ")})` }}
            >
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-[#a0a0b8] mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {isEmpty ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center"
        >
          <Code2 className="w-12 h-12 text-[#6b6b85] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No submissions yet</h2>
          <p className="text-sm text-[#a0a0b8] mb-6 max-w-md mx-auto">
            Solve your first problem to unlock charts, stats, and AI-powered code reviews.
          </p>
          <Link to="/problems" className="btn-primary">
            <Code2 className="w-4 h-4" />
            Browse Problems
          </Link>
        </motion.div>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Weekly progress line chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 glass-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">This Week</h3>
                <span className="text-[10px] text-[#6b6b85]">Problems solved per day</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={a!.weeklyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6b6b85", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b6b85", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#a0a0b8" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="solved"
                      stroke="#6c63ff"
                      strokeWidth={2}
                      dot={{ fill: "#6c63ff", strokeWidth: 0, r: 4 }}
                      activeDot={{ fill: "#8b83ff", strokeWidth: 0, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Activity feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
                <Link to="/history" className="text-[10px] text-[#6c63ff] hover:text-[#8b83ff] transition-colors">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {(a!.recentActivity?.length ?? 0) === 0 ? (
                  <p className="text-xs text-[#6b6b85] text-center py-6">No recent submissions</p>
                ) : (
                  a!.recentActivity!.map((act) => (
                    <Link key={act.id} to={`/submissions/${act.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                      <StatusIcon status={act.status} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white/80 truncate">{act.problem}</div>
                        <div className="text-[10px] text-[#6b6b85]">{act.language} · {timeAgo(act.createdAt)}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#6b6b85]" />
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Topic breakdown bar chart */}
          {(a!.topicBreakdown?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-5 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Performance by Topic</h3>
                <span className="text-[10px] text-[#6b6b85]">Success rate by category</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={a!.topicBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="topic" axisLine={false} tickLine={false} tick={{ fill: "#6b6b85", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b6b85", fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#a0a0b8" }}
                    />
                    <Bar dataKey="successRate" radius={[4, 4, 0, 0]}>
                      {a!.topicBreakdown.map((_, i) => (
                        <Cell key={i} fill={TOPIC_COLORS[i % TOPIC_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* AI Score Trend */}
          {(a!.aiScoreTrend?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card p-5 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">AI Review Scores Over Time</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={a!.aiScoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b6b85", fontSize: 10 }} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: "#6b6b85", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#a0a0b8" }}
                    />
                    <Line type="monotone" dataKey="average" stroke="#6c63ff" strokeWidth={2} dot={{ r: 3 }} name="Average" />
                    <Line type="monotone" dataKey="readability" stroke="#00d4ff" strokeWidth={1.5} dot={{ r: 2 }} name="Readability" />
                    <Line type="monotone" dataKey="edgeCases" stroke="#00e676" strokeWidth={1.5} dot={{ r: 2 }} name="Edge Cases" />
                    <Line type="monotone" dataKey="naming" stroke="#ffd740" strokeWidth={1.5} dot={{ r: 2 }} name="Naming" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Interview Score Trend */}
          {(a!.interviewScoreTrend?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-card p-5 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Interview Performance</h3>
                <span className="text-[10px] text-[#6b6b85]">Score trend</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={a!.interviewScoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b6b85", fontSize: 10 }} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: "#6b6b85", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#a0a0b8" }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#00e676" strokeWidth={2} dot={{ fill: "#00e676", r: 4 }} name="Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Quick links (always visible) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid sm:grid-cols-3 gap-4"
      >
        <Link to="/problems?difficulty=Easy" className="glass-card-hover p-5 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-[rgba(0,230,118,0.1)] flex items-center justify-center">
            <Trophy className="w-6 h-6 text-[#00e676]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Easy Problems</div>
            <div className="text-xs text-[#a0a0b8] mt-0.5">Build confidence</div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#6b6b85] ml-auto group-hover:text-white transition-colors" />
        </Link>
        <Link to="/problems?difficulty=Medium" className="glass-card-hover p-5 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-[rgba(255,215,64,0.1)] flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#ffd740]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Medium Problems</div>
            <div className="text-xs text-[#a0a0b8] mt-0.5">Test your skills</div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#6b6b85] ml-auto group-hover:text-white transition-colors" />
        </Link>
        <Link to="/problems?difficulty=Hard" className="glass-card-hover p-5 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-[rgba(255,82,82,0.1)] flex items-center justify-center">
            <Activity className="w-6 h-6 text-[#ff5252]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Hard Problems</div>
            <div className="text-xs text-[#a0a0b8] mt-0.5">Challenge yourself</div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#6b6b85] ml-auto group-hover:text-white transition-colors" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
