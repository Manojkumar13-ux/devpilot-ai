import { Play, CheckCircle2, Sparkles, RotateCcw, Copy, Download, Maximize2, Minimize2, Moon, Sun, Save, ChevronDown } from "lucide-react";
import { useState } from "react";

interface EditorToolbarProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  onAiReview: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
  submitting: boolean;
  fullscreen: boolean;
  saved: boolean;
}

const LANGUAGES: { value: string; label: string; color: string; executable: boolean }[] = [
  { value: "python", label: "Python", color: "text-green-400", executable: true },
  { value: "java", label: "Java", color: "text-orange-400", executable: true },
  { value: "cpp", label: "C++", color: "text-blue-500", executable: true },
  { value: "c", label: "C", color: "text-blue-300", executable: true },
  { value: "go", label: "Go", color: "text-cyan-400", executable: true },
  { value: "rust", label: "Rust", color: "text-orange-500", executable: true },
];

export default function EditorToolbar({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onRun,
  onSubmit,
  onAiReview,
  onReset,
  onToggleFullscreen,
  submitting,
  fullscreen,
  saved,
}: EditorToolbarProps) {
  const [langOpen, setLangOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0];

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border-b border-white/10">
      {/* Left - Language selector */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm font-medium"
          >
            <span className={current.color}>{current.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/40" />
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 w-44 py-1 glass-card max-h-60 overflow-y-auto">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => { onLanguageChange(l.value); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                      l.value === language ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className={l.color}>●</span>
                    {l.label}
                    {!l.executable && (
                      <span className="text-[10px] text-white/30 ml-auto">preview</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Auto-save indicator */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors ${saved ? "text-green-400/60" : "text-yellow-400/60"}`}>
          <Save className="w-3 h-3" />
          {saved ? "Saved" : "Unsaved"}
        </div>
      </div>

      {/* Center - Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onRun}
          disabled={submitting || !current.executable}
          className="btn-neon text-xs"
          title={current.executable ? "Run code" : "Language not supported for execution"}
        >
          <Play className="w-3.5 h-3.5" />
          Run
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || !current.executable}
          className="btn-neon text-xs"
          title={current.executable ? "Submit solution" : "Language not supported for execution"}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Submit
        </button>
        <button
          onClick={onAiReview}
          disabled={submitting}
          className="relative px-3 py-1.5 rounded-lg text-xs font-medium
            bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 text-neon-purple
            border border-neon-purple/20 hover:border-neon-purple/40
            transition-all duration-200 active:scale-[0.97]
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5 inline mr-1" />
          AI Review
        </button>
        <div className="w-px h-5 bg-white/10 mx-1" />

        <button onClick={onReset} className="btn-icon" title="Reset code"><RotateCcw className="w-3.5 h-3.5" /></button>
        <button className="btn-icon" title="Copy code"><Copy className="w-3.5 h-3.5" /></button>
        <button className="btn-icon" title="Download"><Download className="w-3.5 h-3.5" /></button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Theme toggle */}
        <button
          onClick={() => onThemeChange(theme === "vs-dark" ? "light" : "vs-dark")}
          className="btn-icon"
          title={theme === "vs-dark" ? "Light theme" : "Dark theme"}
        >
          {theme === "vs-dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Fullscreen toggle */}
        <button onClick={onToggleFullscreen} className="btn-icon" title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
