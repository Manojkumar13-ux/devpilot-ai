import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Hash,
  BookOpen,
  ShieldAlert,
  Type,
  Lightbulb,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import ReviewScoreGauge from "./ReviewScoreGauge";
import type { AiReview } from "@devpilot/shared";

interface AiInsightsProps {
  review: AiReview | null;
  reviewStatus: "idle" | "pending" | "completed" | "error";
  reviewError: string | null;
}

const GAUGE_CONFIG = [
  { label: "Readability", key: "readabilityScore" as const, color: "#8B5CF6", icon: <BookOpen className="w-3.5 h-3.5" /> },
  { label: "Edge Cases", key: "edgeCaseScore" as const, color: "#06B6D4", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { label: "Naming", key: "namingScore" as const, color: "#10B981", icon: <Type className="w-3.5 h-3.5" /> },
];

export default function AiInsights({ review, reviewStatus, reviewError }: AiInsightsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-gradient-to-r from-neon-blue to-neon-cyan">
          <Activity className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold gradient-text">AI Code Review</span>
      </div>

      <AnimatePresence mode="wait">
        {reviewStatus === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8 text-white/30"
          >
            <Activity className="w-8 h-8 mb-2" />
            <p className="text-xs">Submit your solution to get an AI review</p>
          </motion.div>
        )}

        {reviewStatus === "pending" && (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            <RefreshCw className="w-6 h-6 text-neon-purple animate-spin mb-2" />
            <p className="text-xs text-white/50">AI is analyzing your code...</p>
            <div className="flex gap-1 mt-3">
              <span className="w-2 h-2 rounded-full bg-neon-purple animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-neon-blue animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        )}

        {reviewStatus === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-1">
              <AlertTriangle className="w-4 h-4" />
              AI Review Failed
            </div>
            <p className="text-xs text-red-300/70">
              {reviewError || "The AI review service encountered an error. Please try again."}
            </p>
          </motion.div>
        )}

        {reviewStatus === "completed" && review && (
          <motion.div
            key="completed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Complexity Section */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-white/40 mb-1">
                  <Hash className="w-3 h-3" />
                  Time Complexity
                </div>
                <div className="text-sm font-mono font-semibold text-neon-cyan">{review.timeComplexity}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-white/40 mb-1">
                  <Hash className="w-3 h-3" />
                  Space Complexity
                </div>
                <div className="text-sm font-mono font-semibold text-neon-purple">{review.spaceComplexity}</div>
              </div>
            </div>

            {/* Score Gauges */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-[11px] text-white/40 mb-3 font-medium">Quality Scores</div>
              <div className="grid grid-cols-3 gap-2">
                {GAUGE_CONFIG.map((g) => (
                  <ReviewScoreGauge
                    key={g.key}
                    label={g.label}
                    score={review[g.key]}
                    color={g.color}
                    icon={g.icon}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            {/* Suggested Improvement */}
            <div className="bg-gradient-to-r from-neon-purple/10 to-neon-cyan/10 rounded-lg p-3 border border-neon-purple/10">
              <div className="flex items-center gap-1.5 text-[11px] text-white/40 mb-1.5">
                <Lightbulb className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400/80 font-medium">Suggested Improvement</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">{review.suggestedImprovement}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
