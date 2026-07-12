import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  Hash,
  Lightbulb,
  Activity,
  BookOpen,
  ShieldAlert,
  Type,
  MessageSquare,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { api } from "../lib/api";
import ReviewScoreGauge from "../components/ReviewScoreGauge";
import type { AiReview, InterviewFollowup } from "@devpilot/shared";

interface SubmissionDetailData {
  id: string;
  problemId: string;
  code: string;
  language: string;
  status: string;
  testResults: Array<{ pass: boolean; runtime: number; memory: number; error: string | null; expected: string; actual: string }> | null;
  runtime: number | null;
  memory: number | null;
  errorType: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  problem: { title: string; difficulty: string; category: string } | null;
  aiReview: AiReview | null;
  interview: InterviewFollowup | null;
}

const GAUGE_CONFIG = [
  { label: "Readability", key: "readabilityScore" as const, color: "#8B5CF6", icon: <BookOpen className="w-3.5 h-3.5" /> },
  { label: "Edge Cases", key: "edgeCaseScore" as const, color: "#06B6D4", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { label: "Naming", key: "namingScore" as const, color: "#10B981", icon: <Type className="w-3.5 h-3.5" /> },
];

const STATUS_LARGE: Record<string, { dot: string; bg: string; icon: React.ReactNode; label: string }> = {
  ACCEPTED:     { dot: "bg-green-400", bg: "bg-green-500/10 text-green-400 border-green-500/20",      icon: <CheckCircle2 className="w-4 h-4" />, label: "Accepted" },
  WRONG_ANSWER: { dot: "bg-red-400",   bg: "bg-red-500/10 text-red-400 border-red-500/20",            icon: <XCircle className="w-4 h-4" />,      label: "Wrong Answer" },
  FAILED:       { dot: "bg-red-400",   bg: "bg-red-500/10 text-red-400 border-red-500/20",            icon: <XCircle className="w-4 h-4" />,      label: "Failed" },
  TIMEOUT:      { dot: "bg-yellow-400",bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",    icon: <Clock className="w-4 h-4" />,         label: "TLE" },
  PENDING:      { dot: "bg-gray-400",  bg: "bg-gray-500/10 text-gray-400 border-gray-500/20",          icon: <Clock className="w-4 h-4" />,         label: "Pending" },
  PROCESSING:   { dot: "bg-blue-400",  bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",          icon: <Clock className="w-4 h-4" />,         label: "Processing" },
};

function StatusBadgeLarge({ status, errorType }: { status: string; errorType: string | null }) {
  const cfg = STATUS_LARGE[status] || STATUS_LARGE.PENDING;
  let label = cfg.label;
  if (status === "FAILED" && errorType) {
    if (errorType === "compilation_error") label = "Compile Error";
    else if (errorType === "runtime_error") label = "Runtime Error";
    else if (errorType === "memory_error") label = "MLE";
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${cfg.bg}`}>
      {cfg.icon}
      {label}
    </span>
  );
}

const verdictLabels: Record<string, { label: string; color: string }> = {
  clear_tradeoff_reasoning: { label: "Clear Tradeoff Reasoning", color: "text-[#00e676]" },
  vague_missing_key_detail: { label: "Vague — Missing Key Detail", color: "text-[#ffd740]" },
  incorrect_understanding: { label: "Incorrect Understanding", color: "text-[#ff5252]" },
};

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const [sub, setSub] = useState<SubmissionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [showTests, setShowTests] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.submissions.get(id)
      .then(setSub)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load submission"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a1a]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6c63ff]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a1a]">
        <div className="glass-card p-6 text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-300">{error}</p>
          <Link to="/history" className="text-xs text-[#6c63ff] mt-3 inline-block">Back to History</Link>
        </div>
      </div>
    );
  }

  if (!sub) return null;

  const review = sub.aiReview;
  const interview = sub.interview;
  const testResults = sub.testResults;
  const passed = testResults ? testResults.filter((t) => t.pass).length : 0;
  const total = testResults ? testResults.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0a0a1a] p-6 lg:p-8"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back + header */}
        <div className="flex items-center gap-4">
          <Link to="/history" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#a0a0b8]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{sub.problem?.title || "Submission"}</h1>
            <p className="text-xs text-[#6b6b85] mt-0.5">Submitted {new Date(sub.createdAt).toLocaleString()}</p>
          </div>
          <div className="ml-auto">
            <StatusBadgeLarge status={sub.status} errorType={sub.errorType} />
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetaBox label="Language" value={sub.language} />
          <MetaBox label="Runtime" value={sub.runtime != null ? `${sub.runtime}ms` : "—"} />
          <MetaBox label="Memory" value={sub.memory != null ? `${sub.memory}KB` : "—"} />
          <MetaBox label="Tests" value={total > 0 ? `${passed}/${total}` : "—"} />
        </div>

        {/* Code */}
        <div className="glass-card overflow-hidden">
          <button
            onClick={() => setShowCode(!showCode)}
            className="w-full flex items-center gap-2 p-4 text-left text-sm font-medium text-white/80 hover:bg-white/5 transition-colors"
          >
            <Code2 className="w-4 h-4 text-[#6c63ff]" />
            Source Code
            {showCode ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
          </button>
          {showCode && (
            <pre className="p-4 bg-black/30 text-xs font-mono text-green-400 overflow-x-auto max-h-96 overflow-y-auto">
              <code>{sub.code}</code>
            </pre>
          )}
        </div>

        {/* Test results */}
        {testResults && testResults.length > 0 && (
          <div className="glass-card overflow-hidden">
            <button
              onClick={() => setShowTests(!showTests)}
              className="w-full flex items-center gap-2 p-4 text-left text-sm font-medium text-white/80 hover:bg-white/5 transition-colors"
            >
              <Activity className="w-4 h-4 text-[#00d4ff]" />
              Test Results ({passed}/{total} passed)
              {showTests ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
            {showTests && (
              <div className="p-4 border-t border-white/5 space-y-2 max-h-64 overflow-y-auto">
                {testResults.map((t, i) => (
                  <div key={i} className={`flex items-start gap-3 p-2 rounded-lg ${t.pass ? "bg-[#00e676]/5" : "bg-[#ff5252]/5"}`}>
                    {t.pass ? (
                      <CheckCircle2 className="w-4 h-4 text-[#00e676] mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#ff5252] mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="text-white/70 font-medium mb-1">Test case {i + 1}</div>
                      <div className="text-[#6b6b85]">
                        Expected: <span className="text-white/50">{t.expected}</span>
                      </div>
                      <div className="text-[#6b6b85]">
                        Actual: <span className={t.pass ? "text-[#00e676]" : "text-[#ff5252]"}>{t.actual}</span>
                      </div>
                      {t.error && <div className="text-[#ff5252] mt-1">{t.error}</div>}
                      <div className="text-[10px] text-[#6b6b85] mt-1">
                        {t.runtime.toFixed(1)}ms · {t.memory}KB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {sub.errorMessage && (
          <div className="glass-card p-4 border-l-4 border-[#ff5252]">
            <div className="flex items-center gap-2 text-[#ff5252] text-sm font-medium mb-1">
              <XCircle className="w-4 h-4" />
              {sub.errorType || "Error"}
            </div>
            <pre className="text-xs text-red-300 whitespace-pre-wrap">{sub.errorMessage}</pre>
          </div>
        )}

        {/* AI Review */}
        {review && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#6c63ff]">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold gradient-text">AI Code Review</span>
            </div>

            {/* Complexity */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#a0a0b8] mb-1">
                  <Hash className="w-3 h-3" /> Time Complexity
                </div>
                <div className="text-sm font-mono font-semibold text-[#00d4ff]">{review.timeComplexity}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#a0a0b8] mb-1">
                  <Hash className="w-3 h-3" /> Space Complexity
                </div>
                <div className="text-sm font-mono font-semibold text-[#6c63ff]">{review.spaceComplexity}</div>
              </div>
            </div>

            {/* Gauges */}
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <div className="text-[11px] text-[#a0a0b8] mb-3 font-medium">Quality Scores</div>
              <div className="grid grid-cols-3 gap-2">
                {GAUGE_CONFIG.map((g) => (
                  <ReviewScoreGauge
                    key={g.key}
                    label={g.label}
                    score={review[g.key] as number}
                    color={g.color}
                    icon={g.icon}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            {/* Improvement */}
            <div className="bg-gradient-to-r from-[#6c63ff]/10 to-[#00d4ff]/10 rounded-lg p-3 border border-[#6c63ff]/10">
              <div className="flex items-center gap-1.5 text-[11px] text-[#a0a0b8] mb-1.5">
                <Lightbulb className="w-3 h-3 text-[#ffd740]" />
                <span className="text-[#ffd740]/80 font-medium">Suggested Improvement</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">{review.suggestedImprovement}</p>
            </div>
          </motion.div>
        )}

        {/* Interview Follow-up */}
        {interview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#00e676] to-[#69f0ae]">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold gradient-text">Follow-up Interview</span>
            </div>

            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <div className="text-[10px] text-[#a0a0b8] mb-1">Question</div>
              <p className="text-xs text-white/80">{interview.question}</p>
            </div>

            {interview.userAnswer && (
              <div className="bg-black/30 rounded-lg p-3 mb-3">
                <div className="text-[10px] text-[#a0a0b8] mb-1">Your Answer</div>
                <p className="text-xs text-white/70">{interview.userAnswer}</p>
              </div>
            )}

            {interview.verdict && verdictLabels[interview.verdict] && (
              <div className={`flex items-center gap-1.5 mb-3 text-xs font-medium ${verdictLabels[interview.verdict].color}`}>
                {interview.verdict === "clear_tradeoff_reasoning" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                 interview.verdict === "vague_missing_key_detail" ? <Clock className="w-3.5 h-3.5" /> :
                 <XCircle className="w-3.5 h-3.5" />}
                {verdictLabels[interview.verdict].label}
              </div>
            )}

            {interview.score != null && (
              <div className="bg-white/5 rounded-lg p-3 text-center mb-3">
                <div className="text-[10px] text-[#a0a0b8] mb-1">Interview Score</div>
                <div className="text-xl font-bold text-[#00e676]">{interview.score}/10</div>
              </div>
            )}

            {interview.answeredAt && (
              <p className="text-[10px] text-[#6b6b85]">
                Answered {new Date(interview.answeredAt).toLocaleString()}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-3 text-center">
      <div className="text-[10px] text-[#a0a0b8] mb-1">{label}</div>
      <div className="text-sm font-semibold font-mono text-white">{value}</div>
    </div>
  );
}
