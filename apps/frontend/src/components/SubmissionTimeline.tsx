import { motion } from "framer-motion";
import { Clock, CheckCircle2, XCircle, Timer, Zap, BarChart3 } from "lucide-react";
import type { Submission } from "@devpilot/shared";

interface SubmissionTimelineProps {
  submissions: Submission[];
}

function getStatusIcon(status: string, errorType: string | null) {
  if (status === "ACCEPTED") return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
  if (status === "WRONG_ANSWER" || status === "FAILED" || status === "TIMEOUT") return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
}

function getDuration(created: string, completedAt: string | null): string {
  if (!completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(created).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function SubmissionTimeline({ submissions }: SubmissionTimelineProps) {
  if (submissions.length === 0) return null;

  const sorted = [...submissions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-neon-purple" />
        <span className="text-sm font-semibold text-white/90">Submission History</span>
        <span className="text-[10px] text-white/30 ml-auto">{sorted.length} submissions</span>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {sorted.slice(0, 20).map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            {getStatusIcon(s.status, s.errorType)}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/70">
                  {s.status === "ACCEPTED" ? "Accepted" : (s.status === "WRONG_ANSWER" || s.status === "FAILED" || s.status === "TIMEOUT") ? "Failed" : "Pending"}
                </span>
                <span className="text-[10px] uppercase text-white/30 font-mono">{s.language}</span>
              </div>
              <div className="text-[10px] text-white/30">
                {new Date(s.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
              {s.runtime != null && (
                <span className="flex items-center gap-1">
                  <Timer className="w-2.5 h-2.5" />
                  {s.runtime}ms
                </span>
              )}
              {s.memory != null && (
                <span className="flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  {s.memory}KB
                </span>
              )}
              <span className="text-white/20">{getDuration(s.createdAt, s.completedAt)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
