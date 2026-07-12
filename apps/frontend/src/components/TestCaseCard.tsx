import { motion } from "framer-motion";
import { Check, X, Copy, Expand } from "lucide-react";
import type { TestCase, TestResult } from "@devpilot/shared";

interface TestCaseCardProps {
  index: number;
  testCase?: TestCase;
  result?: TestResult | null;
  showInput?: boolean;
}

export default function TestCaseCard({ index, testCase, result, showInput = true }: TestCaseCardProps) {
  const pass = result?.pass;
  const hasResult = result !== undefined && result !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-lg border p-3 transition-all ${
        hasResult
          ? pass
            ? "bg-green-500/5 border-green-500/20"
            : "bg-red-500/5 border-red-500/20"
          : "bg-white/5 border-white/10"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {hasResult ? (
            pass ? (
              <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-400" />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                <X className="w-3 h-3 text-red-400" />
              </span>
            )
          ) : (
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            </span>
          )}
          <span className="text-xs font-medium text-white/60">Test #{index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          {result?.runtime != null && (
            <span className="text-[10px] text-white/40 font-mono">{result.runtime}ms</span>
          )}
          <button className="btn-icon !p-1" title="Copy output"><Copy className="w-3 h-3" /></button>
          <button className="btn-icon !p-1" title="Expand"><Expand className="w-3 h-3" /></button>
        </div>
      </div>

      <div className="space-y-1 font-mono text-xs">
        {showInput && testCase && (
          <div className="flex gap-2">
            <span className="text-white/30 w-12 flex-shrink-0">Input:</span>
            <span className="text-white/70 truncate">{testCase.input}</span>
          </div>
        )}
        {result && (
          <>
            <div className="flex gap-2">
              <span className={`w-12 flex-shrink-0 ${pass ? "text-green-400/60" : "text-red-400/60"}`}>Expected:</span>
              <span className="text-white/70 truncate">{result.expected}</span>
            </div>
            {!pass && (
              <div className="flex gap-2">
                <span className="w-12 flex-shrink-0 text-red-400/60">Got:</span>
                <span className="text-red-300/70 truncate">{result.actual}</span>
              </div>
            )}
            {result.error && (
              <div className="flex gap-2">
                <span className="w-12 flex-shrink-0 text-red-400/60">Error:</span>
                <span className="text-red-300/70 truncate">{result.error}</span>
              </div>
            )}
          </>
        )}
        {testCase && !result && (
          <div className="flex gap-2">
            <span className="text-white/30 w-12 flex-shrink-0">Output:</span>
            <span className="text-white/40">{testCase.expectedOutput}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
