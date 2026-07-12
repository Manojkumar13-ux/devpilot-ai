import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ThumbsDown,
  Bot,
} from "lucide-react";
import { api } from "../lib/api";
import type { InterviewFollowup } from "@devpilot/shared";

interface InterviewPanelProps {
  submissionId: string | null;
}

interface EvaluationScores {
  correctness: number;
  clarity: number;
  depth: number;
  communication: number;
}

const EVAL_DIMS = [
  { key: "correctness" as const, label: "Correctness", color: "#8B5CF6" },
  { key: "clarity" as const, label: "Clarity", color: "#06B6D4" },
  { key: "depth" as const, label: "Depth", color: "#10B981" },
  { key: "communication" as const, label: "Communication", color: "#F59E0B" },
];

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round((Math.max(0, Math.min(value, 10)) / 10) * 100);
  return (
    <div>
      <div className="flex justify-between text-[10px] text-white/50 mb-1">
        <span>{label}</span>
        <span>{value}/10</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export default function InterviewPanel({ submissionId }: InterviewPanelProps) {
  const [interview, setInterview] = useState<InterviewFollowup | null>(null);
  const [scores, setScores] = useState<EvaluationScores | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [answer, setAnswer] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "question" | "answered" | "error">("idle");
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!submissionId) {
      setInterview(null);
      setStatus("idle");
      setScores(null);
      return;
    }
    setLoading(true);
    setError(null);
    api.submissions.interview.get(submissionId)
      .then((data) => {
        if (data.exists && data.question) {
          setInterview(data);
          if (data.evaluation) setScores(data.evaluation);
          setStatus(data.answered ? "answered" : "question");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [submissionId]);

  const handleGenerate = async () => {
    if (!submissionId) return;
    setGenerating(true);
    setError(null);
    try {
      const data = await api.submissions.interview.generate(submissionId);
      setInterview({
        id: data.interviewId,
        submissionId,
        question: data.question,
        userAnswer: null,
        verdict: null,
        strengths: null,
        weaknesses: null,
        score: null,
        createdAt: data.createdAt,
        answeredAt: null,
      } as unknown as InterviewFollowup);
      setStatus("question");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate question");
      setStatus("error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!submissionId || !answer.trim()) return;
    setSubmittingAnswer(true);
    setError(null);
    try {
      const result = await api.submissions.interview.submitAnswer(submissionId, answer.trim());
      setScores(result.scores || null);
      setInterview((prev) => prev ? {
        ...prev,
        userAnswer: answer.trim(),
        verdict: result.verdict,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        score: result.score,
        answeredAt: new Date().toISOString(),
      } : prev);
      setStatus("answered");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to evaluate answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const verdictConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    clear_tradeoff_reasoning: {
      label: "Clear Tradeoff Reasoning",
      icon: <CheckCircle className="w-4 h-4" />,
      color: "text-green-400",
    },
    vague_missing_key_detail: {
      label: "Vague — Missing Key Detail",
      icon: <HelpCircle className="w-4 h-4" />,
      color: "text-yellow-400",
    },
    incorrect_understanding: {
      label: "Incorrect Understanding",
      icon: <ThumbsDown className="w-4 h-4" />,
      color: "text-red-400",
    },
  };

  if (!submissionId) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600">
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold gradient-text">Follow-up Interview</span>
        </div>
        <p className="text-xs text-white/30 text-center py-6">Submit code first to unlock the interview</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      {/* AI Avatar */}
      <div className="flex items-center gap-2 mb-3">
        <div ref={avatarRef} className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center relative z-10">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 animate-ping opacity-30" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-sm animate-pulse" />
        </div>
        <span className="text-sm font-semibold gradient-text">Follow-up Interview</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
        </div>
      )}

      {!loading && status === "idle" && (
        <div className="flex flex-col items-center py-4 gap-3">
          <Bot className="w-8 h-8 text-white/20" />
          <p className="text-xs text-white/30 text-center">Get a code-specific interview question about this submission</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-medium hover:brightness-110 hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            {generating ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</>
            ) : (
              <><MessageSquare className="w-3 h-3" /> Generate Question</>
            )}
          </button>
        </div>
      )}

      {!loading && status === "question" && interview && (
        <div className="space-y-3">
          {/* Chat bubble */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 items-start"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-white/5 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%] border border-white/5">
              <p className="text-xs text-white/80 leading-relaxed">{interview.question}</p>
            </div>
          </motion.div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
          />

          <button
            onClick={handleSubmitAnswer}
            disabled={submittingAnswer || !answer.trim()}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-medium hover:brightness-110 hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            {submittingAnswer ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Evaluating...</>
            ) : (
              <><Send className="w-3 h-3" /> Submit Answer</>
            )}
          </button>
        </div>
      )}

      {!loading && status === "answered" && interview && (
        <div className="space-y-3">
          {/* Question + Answer chat bubble */}
          <div className="flex gap-2 items-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-white/5 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%] border border-white/5">
              <p className="text-xs text-white/80 leading-relaxed">{interview.question}</p>
            </div>
          </div>

          <div className="flex gap-2 items-start justify-end">
            <div className="bg-purple-500/10 rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%] border border-purple-500/10">
              <p className="text-xs text-white/70 leading-relaxed">{interview.userAnswer}</p>
            </div>
          </div>

          {/* Verdict badge */}
          {interview.verdict && verdictConfig[interview.verdict] && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 ${verdictConfig[interview.verdict].color}`}>
              {verdictConfig[interview.verdict].icon}
              <span className="text-xs font-medium">{verdictConfig[interview.verdict].label}</span>
            </div>
          )}

          {/* Dimension progress bars */}
          {scores && (
            <div className="bg-black/30 rounded-xl p-3 space-y-2.5">
              <div className="text-[10px] text-white/40 font-medium mb-2">Evaluation</div>
              {EVAL_DIMS.map((dim) => (
                <ProgressBar
                  key={dim.key}
                  label={dim.label}
                  value={scores[dim.key]}
                  color={dim.color}
                />
              ))}
            </div>
          )}

          {/* Strengths */}
          {interview.strengths && (
            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-3">
              <div className="text-[10px] text-cyan-400/80 mb-1 font-medium">Strengths</div>
              <p className="text-xs text-white/70 leading-relaxed">{interview.strengths}</p>
            </div>
          )}

          {/* Weaknesses */}
          {interview.weaknesses && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
              <div className="text-[10px] text-amber-400/80 mb-1 font-medium">Areas to Improve</div>
              <p className="text-xs text-white/70 leading-relaxed">{interview.weaknesses}</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3"
          >
            <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium mb-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Error
            </div>
            <p className="text-xs text-red-300/70">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
