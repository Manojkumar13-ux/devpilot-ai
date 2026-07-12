import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import {
  RefreshCw, AlertTriangle, BarChart3, Code2, TrendingUp,
} from "lucide-react";
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
  contributionData: Array<{ date: string; count: number }>;
  weeklyStats: Array<{ day: string; solved: number }>;
  topicBreakdown: Array<{ topic: string; attempts: number; accepted: number; successRate: number }>;
  aiScoreTrend: Array<{ date: string; readability: number; edgeCases: number; naming: number; average: number }>;
  interviewScoreTrend: Array<{ date: string; score: number }>;
  recentActivity: Array<{ id: string; problem: string; status: string; language: string; createdAt: string }>;
}

const COLORS = {
  easy: "#00e676",
  medium: "#ffd740",
  hard: "#ff5252",
};

const DONUT_COLORS = ["#00e676", "#ffd740", "#ff5252"];

function LoadingSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="skeleton h-8 w-56" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="skeleton h-72 rounded-xl" />
        <div className="skeleton h-72 rounded-xl" />
      </div>
      <div className="skeleton h-64 rounded-xl" />
      <div className="skeleton h-80 rounded-xl" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.analytics.get()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = !data || data.total === 0;

  const difficultyData = useMemo(() => {
    if (!data) return [];
    const b = data.difficultyBreakdown || {};
    return [
      { name: "Easy", value: b.Easy || 0 },
      { name: "Medium", value: b.Medium || 0 },
      { name: "Hard", value: b.Hard || 0 },
    ].filter((d) => d.value > 0);
  }, [data]);

  const langData = useMemo(() => {
    if (!data) return [];
    return (data.languageUsage || []).slice(0, 10);
  }, [data]);

  const topicData = useMemo(() => {
    if (!data) return [];
    return (data.topicBreakdown || []).slice(0, 10);
  }, [data]);

  const trendData = useMemo(() => {
    if (!data) return [];
    return (data.dailyStats || []).slice(-30);
  }, [data]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-300">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-[#a0a0b8] mt-1">
            {isEmpty ? "No data yet — submit solutions to unlock insights" : "Deep dive into your coding patterns and performance"}
          </p>
        </div>
      </div>

      {isEmpty ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center"
        >
          <BarChart3 className="w-12 h-12 text-[#6b6b85] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No data yet</h2>
          <p className="text-sm text-[#a0a0b8] mb-6 max-w-md mx-auto">
            Solve problems and submit code to see charts, language breakdowns, topic performance, and contribution activity.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Donut + Bar */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Difficulty Donut */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-4">Difficulty Breakdown</h3>
              {difficultyData.length > 0 ? (
                <div className="flex items-center justify-center h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                      >
                        {difficultyData.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 ml-2">
                    {difficultyData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          d.name === "Easy" ? "bg-[#00e676]" : d.name === "Medium" ? "bg-[#ffd740]" : "bg-[#ff5252]"
                        }`} />
                        <span className="text-white/60">{d.name}</span>
                        <span className="text-white font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-[#6b6b85]">No difficulty data</div>
              )}
            </motion.div>

            {/* Language Usage Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-4">Language Usage</h3>
              {langData.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={langData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#6b6b85", fontSize: 11 }} />
                      <YAxis dataKey="language" type="category" axisLine={false} tickLine={false} tick={{ fill: "#a0a0b8", fontSize: 11 }} width={80} />
                      <Tooltip
                        contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 12 }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#6c63ff" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-[#6b6b85]">No language data</div>
              )}
            </motion.div>
          </div>

          {/* Row 2: 30-day trend area chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Submission Trend (30 days)</h3>
              <TrendingUp className="w-4 h-4 text-[#6b6b85]" />
            </div>
            {trendData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="acceptedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b6b85", fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b6b85", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 12 }}
                      labelFormatter={(v) => String(v)}
                    />
                    <Area type="monotone" dataKey="total" stroke="#6c63ff" strokeWidth={2} fill="url(#totalGrad)" name="Total" />
                    <Area type="monotone" dataKey="accepted" stroke="#00e676" strokeWidth={2} fill="url(#acceptedGrad)" name="Accepted" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-[#6b6b85]">No submission data</div>
            )}
          </motion.div>

          {/* Row 3: Topic success rate + Heatmap */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Topic success rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-4">Success Rate by Topic</h3>
              {topicData.length > 0 ? (
                <div className="space-y-3">
                  {topicData.map((t) => (
                    <div key={t.topic}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/70">{t.topic}</span>
                        <span className="text-white/50">{t.accepted}/{t.attempts} ({t.successRate}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${t.successRate}%`,
                            background: `linear-gradient(90deg, #6c63ff, ${t.successRate > 75 ? "#00e676" : t.successRate > 50 ? "#ffd740" : "#ff5252"})`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-[#6b6b85]">No topic data</div>
              )}
            </motion.div>

            {/* Contribution heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Contributions</h3>
                <span className="text-[10px] text-[#6b6b85]">Past year</span>
              </div>
              <ContributionHeatmap data={data?.contributionData || []} />
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ContributionHeatmap({ data }: { data: Array<{ date: string; count: number }> }) {
  const weeks = useMemo(() => {
    if (!data.length) return [];
    const dateMap = new Map(data.map((d) => [d.date, d.count]));
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 363);

    const result: Array<Array<{ date: string; count: number }>> = [];
    let currentWeek: Array<{ date: string; count: number }> = [];

    // Pad to start of week (Sunday)
    while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      currentWeek.push({ date: key, count: dateMap.get(key) || 0 });
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) result.push(currentWeek);
    return result;
  }, [data]);

  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-[rgba(255,255,255,0.04)]";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity <= 0.25) return "bg-[#0d4429]";
    if (intensity <= 0.5) return "bg-[#006d32]";
    if (intensity <= 0.75) return "bg-[#00a84e]";
    return "bg-[#00e676]";
  };

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthLabels = useMemo(() => {
    if (!weeks.length) return [];
    const labels: Array<{ weekIndex: number; label: string }> = [];
    let lastMonth = -1;
    for (let w = 0; w < weeks.length; w++) {
      if (!weeks[w].length) continue;
      const dateStr = weeks[w][0].date;
      if (!dateStr) continue;
      const month = new Date(dateStr).getMonth();
      if (month !== lastMonth) {
        labels.push({ weekIndex: w, label: MONTHS[month] });
        lastMonth = month;
      }
    }
    return labels;
  }, [weeks]);

  if (!weeks.length) {
    return <div className="h-48 flex items-center justify-center text-xs text-[#6b6b85]">No contribution data</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5" style={{ minWidth: weeks.length * 14 }}>
        {/* Month labels */}
        <div className="flex flex-col text-[8px] text-[#6b6b85] mr-1">
          {monthLabels.map((m) => (
            <span key={m.weekIndex} style={{ marginTop: m.weekIndex * 14 }} className="h-3">{m.label}</span>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-0.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {Array.from({ length: 7 }).map((_, di) => {
                const day = week[di];
                if (!day) return <div key={di} className="w-3 h-3" />;
                return (
                  <div
                    key={day.date}
                    className={`w-3 h-3 rounded-sm ${getColor(day.count)}`}
                    title={`${day.date}: ${day.count} accepted`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 justify-end text-[9px] text-[#6b6b85]">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-[rgba(255,255,255,0.04)]" />
        <div className="w-3 h-3 rounded-sm bg-[#0d4429]" />
        <div className="w-3 h-3 rounded-sm bg-[#006d32]" />
        <div className="w-3 h-3 rounded-sm bg-[#00a84e]" />
        <div className="w-3 h-3 rounded-sm bg-[#00e676]" />
        <span>More</span>
      </div>
    </div>
  );
}
