import { useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Medal, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useLeaderboard } from "../hooks/useApi";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  problemsSolved: number;
  acceptanceRate: number;
  avgAiScore: number;
  avgInterviewScore: number;
  streak: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function LoadingSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-12 w-full rounded-xl" />
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 w-full rounded-lg" />)}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-mono text-white/40 w-5 text-center">{rank}</span>;
}

export default function Leaderboard() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useLeaderboard(page);
  const errorMsg = error instanceof Error ? error.message : error ? String(error) : "";

  const respData = ((data as { data?: LeaderboardEntry[] })?.data ?? []) as LeaderboardEntry[];
  const pagination = ((data as { pagination?: Pagination })?.pagination ?? null) as Pagination | null;

  if (isLoading && respData.length === 0) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-300">{errorMsg}</p>
          <button onClick={() => setPage(1)} className="btn-primary mt-4">Retry</button>
        </div>
      </div>
    );
  }

  const p = pagination;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-sm text-[#a0a0b8] mt-1">
            {p ? `${p.total} participants` : "Top coders ranked by performance"}
          </p>
        </div>
      </div>

      {respData.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center"
        >
          <Trophy className="w-12 h-12 text-[#6b6b85] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No rankings yet</h2>
          <p className="text-sm text-[#a0a0b8] mb-6 max-w-md mx-auto">
            Solve problems to earn your spot on the leaderboard.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[#6b6b85] font-medium w-12">#</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[#6b6b85] font-medium">Username</th>
                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[#6b6b85] font-medium">Solved</th>
                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[#6b6b85] font-medium hidden sm:table-cell">Acceptance</th>
                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[#6b6b85] font-medium hidden md:table-cell">AI Score</th>
                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[#6b6b85] font-medium hidden lg:table-cell">Interview</th>
                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[#6b6b85] font-medium hidden sm:table-cell">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {respData.map((entry, i) => (
                    <motion.tr
                      key={entry.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-medium">{entry.username}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-white font-mono">{entry.problemsSolved}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className={`font-mono text-xs ${entry.acceptanceRate >= 75 ? "text-[#00e676]" : entry.acceptanceRate >= 50 ? "text-[#ffd740]" : "text-[#ff5252]"}`}>
                          {entry.acceptanceRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="font-mono text-xs text-[#6c63ff]">{entry.avgAiScore > 0 ? entry.avgAiScore.toFixed(1) : "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="font-mono text-xs text-[#00d4ff]">{entry.avgInterviewScore > 0 ? entry.avgInterviewScore.toFixed(1) : "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className="font-mono text-xs text-white/60">{entry.streak > 0 ? `${entry.streak}d` : "—"}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {p && p.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 text-sm">
              <span className="text-xs text-[#6b6b85]">
                Page {p.page} of {p.totalPages} ({p.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p.page - 1)}
                  disabled={p.page <= 1}
                  className="btn-icon"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(p.totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (p.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (p.page <= 3) {
                    pageNum = i + 1;
                  } else if (p.page >= p.totalPages - 2) {
                    pageNum = p.totalPages - 4 + i;
                  } else {
                    pageNum = p.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        pageNum === p.page
                          ? "bg-[#6c63ff] text-white"
                          : "text-[#a0a0b8] hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p.page + 1)}
                  disabled={p.page >= p.totalPages}
                  className="btn-icon"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
