import { motion } from "framer-motion";
import { Sparkles, Lightbulb, Code2, AlertTriangle } from "lucide-react";

export default function AiAssistant() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-gradient-to-r from-neon-purple to-neon-blue">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold gradient-text">AI Assistant</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2 text-xs text-white/60">
          <Lightbulb className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span>AI-powered code review is now active. Submit your solution to receive automated analysis on complexity, readability, and edge cases.</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-white/60">
          <Code2 className="w-3.5 h-3.5 text-neon-cyan mt-0.5 flex-shrink-0" />
          <span>Reviews appear automatically after a successful submission in the bottom panel.</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-white/60">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
          <span>Use the interview tab after submission to discuss your approach with AI.</span>
        </div>
      </div>
    </motion.div>
  );
}
