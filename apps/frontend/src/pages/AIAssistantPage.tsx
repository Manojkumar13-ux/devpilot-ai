import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "../lib/api";
import AiInsights from "../components/AiInsights";
import InterviewPanel from "../components/InterviewPanel";
import type { AiReview, Submission } from "@devpilot/shared";

const REVIEW_POLL_INTERVAL = 3000;
const REVIEW_POLL_TIMEOUT = 60_000;

export default function AIAssistantPage() {
  const { slug, submissionId } = useParams<{ slug: string; submissionId: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [review, setReview] = useState<AiReview | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"idle" | "pending" | "completed" | "error">("idle");
  const [reviewError, setReviewError] = useState<string | null>(null);

  const reviewPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!submissionId) return;
    api.submissions.get(submissionId)
      .then((sub) => {
        setSubmission(sub);
        if (sub.status === "ACCEPTED") {
          startReviewPolling(submissionId);
        } else {
          setReviewError("AI review requires an accepted submission.");
          setReviewStatus("error");
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load submission"))
      .finally(() => setLoading(false));
  }, [submissionId]);

  const startReviewPolling = (sid: string) => {
    setReviewStatus("pending");
    const start = Date.now();

    const check = async () => {
      try {
        const resp = await api.submissions.review(sid);
        if (resp.status === "completed") {
          setReview(resp.review);
          setReviewStatus("completed");
          return true;
        }
        if (resp.status === "error") {
          setReviewError(resp.errorMessage || "AI review failed");
          setReviewStatus("error");
          return true;
        }
      } catch { /* retry */ }
      return false;
    };

    check().then((done) => {
      if (done) return;
      reviewPollRef.current = setInterval(async () => {
        const done = await check();
        if (done || Date.now() - start > REVIEW_POLL_TIMEOUT) {
          if (reviewPollRef.current) clearInterval(reviewPollRef.current);
          if (!done) {
            setReviewStatus("error");
            setReviewError("AI review timed out");
          }
        }
      }, REVIEW_POLL_INTERVAL);
    });
  };

  useEffect(() => {
    return () => {
      if (reviewPollRef.current) clearInterval(reviewPollRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/problems/${slug}`)}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Problem
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-neon-purple to-neon-blue">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold gradient-text">AI Assistant</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-neon-purple animate-spin" />
          </div>
        ) : error ? (
          <div className="glass-card p-6 text-center max-w-sm mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        ) : submission ? (
          <div className="space-y-8">
            {/* Submission Info */}
            <div className="glass-card p-4 flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                submission.status === "ACCEPTED" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {submission.status}
              </div>
              <span className="text-sm text-white/50">{submission.language}</span>
              <span className="text-xs text-white/30 ml-auto">
                {new Date(submission.createdAt).toLocaleString()}
              </span>
            </div>

            {/* AI Review */}
            <div>
              <h2 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                Code Review
                {reviewStatus === "pending" && (
                  <RefreshCw className="w-3 h-3 text-neon-purple animate-spin" />
                )}
              </h2>
              <AiInsights review={review} reviewStatus={reviewStatus} reviewError={reviewError} />
            </div>

            {/* Interview */}
            <div>
              <h2 className="text-sm font-medium text-white/70 mb-3">Follow-up Interview</h2>
              <InterviewPanel submissionId={submissionId ?? null} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
