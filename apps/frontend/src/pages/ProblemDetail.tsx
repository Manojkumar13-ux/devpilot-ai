import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import { Terminal, Beaker, BarChart3, RefreshCw, AlertTriangle, Keyboard, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import ProblemInfo from "../components/ProblemInfo";
import AiAssistant from "../components/AiAssistant";
import EditorToolbar from "../components/EditorToolbar";
import TestCaseCard from "../components/TestCaseCard";
import SubmissionTimeline from "../components/SubmissionTimeline";
import type {
  ProblemWithTestCases,
  TestResult,
  Submission,
} from "@devpilot/shared";

const LANGUAGE_MONACO_MAP: Record<string, string> = {
  javascript: "javascript", typescript: "typescript", python: "python", java: "java",
  c: "c", cpp: "cpp", csharp: "csharp", go: "go", rust: "rust", kotlin: "kotlin",
  swift: "swift", php: "php", ruby: "ruby", dart: "dart",
};

const STORAGE_PREFIX = "devpilot:draft:";
const POLL_INTERVAL = 2000;
const POLL_TIMEOUT = 120_000;

function loadDraft(slug: string, lang: string): string | null {
  try { return localStorage.getItem(`${STORAGE_PREFIX}${slug}:${lang}`); } catch { return null; }
}
function saveDraft(slug: string, lang: string, code: string) {
  try { localStorage.setItem(`${STORAGE_PREFIX}${slug}:${lang}`, code); } catch { /* ignore */ }
}

type BottomTab = "testcases" | "custom_input" | "output" | "console" | "performance";

export default function ProblemDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<ProblemWithTestCases | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState(true);
  const [theme, setTheme] = useState("vs-dark");
  const [fullscreen, setFullscreen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcases");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [customInput, setCustomInput] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch problem
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");
    api.problems.get(slug)
      .then((p) => {
        setProblem(p);
        const starter = (p.starterCode as Record<string, string>)?.[language] ?? "";
        const draft = loadDraft(slug, language);
        setCode(draft ?? starter);
        setSaved(true);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load problem"))
      .finally(() => setLoading(false));
  }, [slug]);

  // When language changes, swap code
  useEffect(() => {
    if (!problem || !slug) return;
    const starter = (problem.starterCode as Record<string, string>)?.[language] ?? "";
    const draft = loadDraft(slug, language);
    setCode(draft ?? starter);
  }, [language, problem?.slug]);

  // Auto-save with debounce
  const handleCodeChange = useCallback((value: string | undefined) => {
    const next = value ?? "";
    setCode(next);
    setSaved(false);
    if (slug) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveDraft(slug, language, next);
        setSaved(true);
      }, 500);
    }
  }, [slug, language]);

  const handleReset = useCallback(() => {
    if (!problem || !slug) return;
    const starter = (problem.starterCode as Record<string, string>)?.[language] ?? "";
    setCode(starter);
    saveDraft(slug, language, starter);
    setSaved(true);
  }, [problem, slug, language]);

  const handleToggleFullscreen = useCallback(() => {
    setFullscreen((prev) => !prev);
  }, []);

  const TERMINAL_STATUSES = new Set(['ACCEPTED', 'WRONG_ANSWER', 'FAILED', 'TIMEOUT']);

  const startPolling = useCallback((id: string) => {
    setSubmissionId(id);
    setLastSubmissionId(null);
    setResults(null);
    setErrorType(null);
    setErrorMessage(null);
    setSubmitting(true);
    setBottomTab("testcases");
    pollStartRef.current = Date.now();

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const sub = await api.submissions.get(id);
        if (TERMINAL_STATUSES.has(sub.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
          setSubmitting(false);
          setLastSubmissionId(id);
          setSubmissionId(null);

          if (sub.status === 'FAILED' || sub.status === 'TIMEOUT') {
            setErrorType(sub.errorType || (sub.status === 'TIMEOUT' ? 'timeout_error' : 'runtime_error'));
            setErrorMessage(sub.errorMessage || (sub.status === 'TIMEOUT' ? 'Time limit exceeded' : 'Execution failed'));
          } else {
            setResults(sub.testResults as TestResult[]);
            if (slug) {
              setSubmissions((prev) => {
                const exists = prev.find((p) => p.id === sub.id);
                if (exists) return prev.map((p) => (p.id === sub.id ? sub : p));
                return [sub, ...prev];
              });
            }
          }
        } else if (Date.now() - pollStartRef.current > POLL_TIMEOUT) {
          setErrorType("timeout_error");
          setErrorMessage("Submission timed out while waiting for results");
          setSubmitting(false);
          setSubmissionId(null);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // poll will retry
      }
    }, POLL_INTERVAL);
  }, [slug]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleRun = async () => {
    if (!problem || submitting) return;
    try {
      const sub = await api.submissions.run({ problemId: problem.id, code, language });
      startPolling(sub.submissionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    }
  };

  const handleSubmit = async () => {
    if (!problem || submitting) return;
    try {
      const sub = await api.submissions.submit({ problemId: problem.id, code, language });
      startPolling(sub.submissionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0a0a1a]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-neon-purple animate-spin" />
          <div className="h-3 w-32 skeleton rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0a0a1a]">
        <div className="glass-card p-6 text-center max-w-sm">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0a0a1a]">
        <p className="text-sm text-white/40">Problem not found.</p>
      </div>
    );
  }

  const visibleCases = problem.testCases.filter((tc) => !tc.isHidden);
  const totalTests = problem.testCases.length;
  const passedTests = results ? results.filter((r) => r.pass).length : 0;
  const avgRuntime = results && results.length > 0
    ? results.reduce((s, r) => s + (r.runtime || 0), 0) / results.length
    : 0;
  const maxMemory = results && results.length > 0
    ? Math.max(...results.map((r) => r.memory || 0))
    : 0;

  const mainContent = (
    <div ref={containerRef} className={`flex h-[calc(100vh-64px)] bg-[#0a0a1a] ${fullscreen ? "fixed inset-0 z-50 h-screen" : ""}`}>
      {/* Left Pane — glassmorphism, scrollable */}
      <div className="w-[380px] flex-shrink-0 overflow-y-auto border-r border-white/10 p-4 space-y-3 bg-black/20 backdrop-blur-sm">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors mb-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <ProblemInfo problem={problem} />
        <AiAssistant />
      </div>

      {/* Center + Bottom */}
      <div className="flex-1 flex flex-col min-w-0">
        <EditorToolbar
          language={language}
          onLanguageChange={setLanguage}
          theme={theme}
          onThemeChange={setTheme}
          onRun={handleRun}
          onSubmit={handleSubmit}
          onAiReview={() => {
            if (lastSubmissionId) {
              navigate(`/problems/${slug}/ai-assistant/${lastSubmissionId}`);
            }
          }}
          onReset={handleReset}
          onToggleFullscreen={handleToggleFullscreen}
          submitting={submitting}
          fullscreen={fullscreen}
          saved={saved}
        />

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0 border-b border-white/5">
          <Editor
            height="100%"
            language={LANGUAGE_MONACO_MAP[language] || language}
            value={code}
            onChange={handleCodeChange}
            theme={theme}
            options={{
              minimap: { enabled: true, scale: 1 },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              scrollBeyondLastLine: false,
              padding: { top: 12 },
              automaticLayout: true,
              bracketPairColorization: { enabled: true },
              formatOnPaste: true,
              suggest: { showKeywords: true, showSnippets: true },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
            }}
          />
        </div>

        {/* Bottom Panel — always visible */}
        <div className="bg-white/[0.02] border-t border-white/5">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 pt-2 border-b border-white/5">
            <button
              onClick={() => setBottomTab("testcases")}
              className={bottomTab === "testcases" ? "tab-active" : "tab"}
            >
              <Beaker className="w-3.5 h-3.5 inline mr-1.5" />
              Test Cases
            </button>
            <button
              onClick={() => setBottomTab("custom_input")}
              className={bottomTab === "custom_input" ? "tab-active" : "tab"}
            >
              <Keyboard className="w-3.5 h-3.5 inline mr-1.5" />
              Custom Input
            </button>
            <button
              onClick={() => setBottomTab("output")}
              className={bottomTab === "output" ? "tab-active" : "tab"}
            >
              <Terminal className="w-3.5 h-3.5 inline mr-1.5" />
              Output
            </button>
            <button
              onClick={() => setBottomTab("console")}
              className={bottomTab === "console" ? "tab-active" : "tab"}
            >
              <Terminal className="w-3.5 h-3.5 inline mr-1.5" />
              Console
            </button>
            <button
              onClick={() => setBottomTab("performance")}
              className={bottomTab === "performance" ? "tab-active" : "tab"}
            >
              <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />
              Performance
            </button>
            <button
              onClick={() => lastSubmissionId && navigate(`/problems/${slug}/ai-assistant/${lastSubmissionId}`)}
              disabled={!lastSubmissionId}
              className="relative px-3 py-1.5 rounded-lg text-xs font-medium
                bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 text-neon-purple
                border border-neon-purple/20 hover:border-neon-purple/40
                transition-all duration-200 active:scale-[0.97]
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              AI Review
            </button>
            {submitting && (
              <div className="ml-auto flex items-center gap-2 px-3 py-1">
                <RefreshCw className="w-3 h-3 text-neon-purple animate-spin" />
                <span className="text-[11px] text-white/40">Executing...</span>
              </div>
            )}
            {results && !submitting && (
              <div className="ml-auto flex items-center gap-2 px-3 py-1">
                <span className={`text-[11px] font-medium ${passedTests === totalTests ? "text-green-400" : "text-yellow-400"}`}>
                  {passedTests}/{totalTests} passed
                </span>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="max-h-[240px] overflow-y-auto p-3">
            {bottomTab === "testcases" && (
              <div className="space-y-2">
                {results && results.length > 0 ? (
                  results.map((r, i) => (
                    <TestCaseCard
                      key={i}
                      index={i}
                      testCase={problem.testCases[i]}
                      result={r}
                    />
                  ))
                ) : submitting && !results ? (
                  <div className="flex items-center justify-center py-6">
                    <RefreshCw className="w-5 h-5 text-neon-purple animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6">
                    <p className="text-xs text-white/20">Run your code to see test results</p>
                  </div>
                )}
                {results && visibleCases.map((tc, i) => {
                  const existingResult = results[i];
                  if (existingResult) return null;
                  return (
                    <TestCaseCard
                      key={tc.id}
                      index={i}
                      testCase={tc}
                      result={null}
                      showInput={false}
                    />
                  );
                })}
              </div>
            )}

            {bottomTab === "custom_input" && (
              <div className="space-y-2">
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter custom input for your code..."
                  rows={5}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm font-mono text-white/70 placeholder:text-white/20 resize-none focus:outline-none focus:border-neon-purple/50 transition-colors"
                />
                <button
                  onClick={() => {}}
                  disabled={submitting || !customInput.trim()}
                  className="btn-neon text-xs self-start"
                >
                  Run with Custom Input
                </button>
              </div>
            )}

            {bottomTab === "output" && (
              <div className="bg-black/30 rounded-lg p-3 font-mono text-xs min-h-[60px] space-y-2">
                {results && results.length > 0 ? (
                  results.map((r, i) => {
                    const tc = problem?.testCases[i];
                    const passed = r.pass;
                    return (
                      <div key={i} className={`rounded p-2 ${passed ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${passed ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className="text-white/50">Test {i + 1}</span>
                          {tc && <span className="text-white/30">— {tc.input}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 ml-4">
                          <div>
                            <span className="text-white/30">Expected: </span>
                            <span className="text-white/60">{r.expected ?? "(none)"}</span>
                          </div>
                          <div>
                            <span className="text-white/30">Actual: </span>
                            <span className={passed ? 'text-green-400' : 'text-red-400'}>
                              {r.actual ?? (r.error ? `Error: ${r.error}` : "(no output)")}
                            </span>
                          </div>
                        </div>
                        {r.runtime != null && (
                          <div className="ml-4 mt-1 text-white/20">{r.runtime.toFixed(2)}ms</div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-white/20">Run your code to see test output here.</div>
                )}
              </div>
            )}

            {bottomTab === "console" && (
              <div className="bg-black/30 rounded-lg p-3 font-mono text-xs min-h-[60px]">
                {errorType ? (
                  <div>
                    <div className="text-red-400 font-medium mb-1">
                      {errorType === "compilation_error" ? "Compilation Error" :
                       errorType === "timeout_error" ? "Time Limit Exceeded" :
                       errorType === "memory_error" ? "Memory Limit Exceeded" :
                       "Runtime Error"}
                    </div>
                    <pre className="text-red-300 whitespace-pre-wrap">{errorMessage}</pre>
                  </div>
                ) : results ? (
                  <div className="text-green-400">
                    Program executed successfully.
                    {results.length > 1 && ` ${passedTests}/${totalTests} tests passed.`}
                  </div>
                ) : submitting ? (
                  <div className="text-white/30">Waiting for execution...</div>
                ) : (
                  <div className="text-white/20">Run your code to see console output here.</div>
                )}
              </div>
            )}

            {bottomTab === "performance" && (
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card p-4 text-center">
                  <div className="text-[10px] text-white/40 mb-1">Avg Runtime</div>
                  <div className="text-lg font-semibold font-mono text-neon-cyan">
                    {results ? `${avgRuntime.toFixed(2)}ms` : "—"}
                  </div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-[10px] text-white/40 mb-1">Peak Memory</div>
                  <div className="text-lg font-semibold font-mono text-neon-purple">
                    {results ? `${maxMemory}KB` : "—"}
                  </div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-[10px] text-white/40 mb-1">Tests Passed</div>
                  <div className="text-lg font-semibold font-mono text-green-400">
                    {results ? `${passedTests}/${totalTests}` : "—"}
                  </div>
                </div>
              </div>
            )}


          </div>

          {/* Submission History */}
          {submissions.length > 0 && (
            <div className="border-t border-white/5 px-3 py-3">
              <SubmissionTimeline submissions={submissions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <>
        {mainContent}
      </>
    );
  }

  return mainContent;
}
