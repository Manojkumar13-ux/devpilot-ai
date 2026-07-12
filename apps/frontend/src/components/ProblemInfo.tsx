import { useState } from "react";
import { Bookmark, Share2, Flag, Building2, Users, Clock, Zap, BarChart3, Lightbulb, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { ProblemWithTestCases } from "@devpilot/shared";

interface ProblemInfoProps {
  problem: ProblemWithTestCases;
}

const DIFFICULTY_CONFIG: Record<string, { class: string; icon: typeof Zap; label: string }> = {
  Easy: { class: "badge-easy", icon: Zap, label: "Easy" },
  Medium: { class: "badge-medium", icon: Zap, label: "Medium" },
  Hard: { class: "badge-hard", icon: Zap, label: "Hard" },
};

const ESTIMATED_TIME: Record<string, string> = {
  Easy: "~15 min",
  Medium: "~30 min",
  Hard: "~45 min",
};

export default function ProblemInfo({ problem }: ProblemInfoProps) {
  const config = DIFFICULTY_CONFIG[problem.difficulty] ?? DIFFICULTY_CONFIG.Medium;
  const DiffIcon = config.icon;
  const tags = (problem.tags ?? []) as string[];
  const companies = (problem.companies ?? []) as string[];
  const hints = (problem.hints ?? []) as string[];
  const acceptanceRate = problem.acceptanceRate ?? 0;
  const submissionCount = problem.submissionCount ?? 0;
  const [hintsOpen, setHintsOpen] = useState(false);
  const [editorialOpen, setEditorialOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-3 pb-4"
    >
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-white truncate">{problem.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={config.class}>
                <DiffIcon className="w-3 h-3" />
                {config.label}
              </span>
              <span className="badge bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                {problem.category}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="btn-icon" title="Bookmark"><Bookmark className="w-4 h-4" /></button>
            <button className="btn-icon" title="Share"><Share2 className="w-4 h-4" /></button>
            <button className="btn-icon" title="Report"><Flag className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <BarChart3 className="w-3.5 h-3.5 text-green-400" />
            <span>{acceptanceRate.toFixed(1)}% acceptance</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Users className="w-3.5 h-3.5 text-neon-blue" />
            <span>{(submissionCount / 1000).toFixed(1)}K submissions</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Clock className="w-3.5 h-3.5 text-neon-cyan" />
            <span>{ESTIMATED_TIME[problem.difficulty] ?? "~30 min"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Building2 className="w-3.5 h-3.5 text-neon-purple" />
            <span>{companies.length > 0 ? companies.slice(0, 2).join(", ") : "General"}</span>
          </div>
        </div>

        {/* Tags + Companies */}
        {(tags.length > 0 || companies.length > 0) && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {tags.map((tag: string) => (
              <span key={tag} className="badge bg-white/5 text-white/60 border border-white/10">{tag}</span>
            ))}
            {companies.slice(0, 3).map((c: string) => (
              <span key={c} className="badge bg-amber-500/10 text-amber-400/80 border border-amber-500/20">{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-neon-cyan" />
          Description
        </h3>
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{problem.description}</p>
      </div>

      {/* Constraints */}
      {problem.constraints && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white/90 mb-2">Constraints</h3>
          <pre className="text-sm text-white/60 font-mono whitespace-pre-wrap leading-relaxed">{problem.constraints}</pre>
        </div>
      )}

      {/* Examples */}
      {problem.testCases.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white/90 mb-2">Examples</h3>
          <div className="space-y-2">
            {problem.testCases.map((tc, i) => (
              <div key={tc.id} className="bg-white/5 rounded-lg p-3 font-mono text-xs">
                <div className="text-white/40 mb-1">Example {i + 1}:</div>
                <div className="text-neon-cyan">Input: <span className="text-white/80">{tc.input}</span></div>
                <div className="text-neon-green mt-0.5">Output: <span className="text-white/80">{tc.expectedOutput}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hints */}
      {hints.length > 0 && (
        <div className="glass-card p-4">
          <button
            onClick={() => setHintsOpen(!hintsOpen)}
            className="flex items-center gap-2 w-full text-left"
          >
            <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-sm font-semibold text-white/90 flex-1">Hints</span>
            {hintsOpen ? <ChevronDown className="w-3.5 h-3.5 text-white/40" /> : <ChevronRight className="w-3.5 h-3.5 text-white/40" />}
          </button>
          {hintsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-3 space-y-2 overflow-hidden"
            >
              {hints.map((hint: string, i: number) => (
                <div key={i} className="bg-white/5 rounded-lg p-3 text-sm text-white/60">
                  <span className="text-yellow-400/60 font-medium">Hint {i + 1}:</span> {hint}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Editorial */}
      {problem.editorial && (
        <div className="glass-card p-4">
          <button
            onClick={() => setEditorialOpen(!editorialOpen)}
            className="flex items-center gap-2 w-full text-left"
          >
            <FileText className="w-3.5 h-3.5 text-neon-purple" />
            <span className="text-sm font-semibold text-white/90 flex-1">Editorial</span>
            {editorialOpen ? <ChevronDown className="w-3.5 h-3.5 text-white/40" /> : <ChevronRight className="w-3.5 h-3.5 text-white/40" />}
          </button>
          {editorialOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-3 overflow-hidden"
            >
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{problem.editorial}</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Complexity info */}
      {problem.complexity && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white/90 mb-2">Complexity</h3>
          <div className="space-y-1 text-sm">
            {Object.entries(problem.complexity).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 text-white/60">
                <span className="capitalize">{key.replace(/_/g, " ")}:</span>
                <span className="font-mono text-neon-cyan">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
