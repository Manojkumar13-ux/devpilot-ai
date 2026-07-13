import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { ProblemListItem } from "@devpilot/shared";
import { api } from "../lib/api";
import { Search, Filter, ChevronRight, Code2 } from "lucide-react";

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"] as const;
const CATEGORIES = [
  "All", "Arrays", "Strings", "HashMap", "Two Pointers", "Sliding Window",
  "Stack", "Queue", "Linked List", "Trees", "Binary Trees", "BST",
  "Graphs", "DFS", "BFS", "Heap / Priority Queue", "Backtracking",
  "Greedy", "Dynamic Programming", "Binary Search",
] as const;

const difficultyColors: Record<string, string> = {
  Easy: "text-green-400 bg-green-500/10",
  Medium: "text-yellow-400 bg-yellow-500/10",
  Hard: "text-red-400 bg-red-500/10",
};

export default function Problems() {
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (difficulty !== "All") params.set("difficulty", difficulty);
    if (category !== "All") params.set("category", category);
    if (search) params.set("search", search);

    api.get<ProblemListItem[]>(`/problems?${params.toString()}`)
      .then((res) => setProblems(res))
      .catch(() => setError("Failed to load problems"))
      .finally(() => setLoading(false));
  }, [difficulty, category, search]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code2 className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold">DevPilot AI</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
            <Link to="/problems" className="text-white font-medium">Problems</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Problems</h1>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 mr-1" />
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                difficulty === d
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              {d}
            </button>
          ))}
          <span className="text-gray-600 mx-1">|</span>
          {CATEGORIES.slice(0, 8).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                category === c
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : problems.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-400">No problems found matching your filters.</p>
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-3 text-sm text-gray-400 font-medium">Title</th>
                  <th className="text-left px-6 py-3 text-sm text-gray-400 font-medium">Difficulty</th>
                  <th className="text-left px-6 py-3 text-sm text-gray-400 font-medium">Category</th>
                  <th className="text-left px-6 py-3 text-sm text-gray-400 font-medium">Tags</th>
                  <th className="w-10 px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {problems.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/problems/${p.slug}`} className="text-white hover:text-purple-400 transition-colors font-medium">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${difficultyColors[p.difficulty]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          p.difficulty === "Easy" ? "bg-green-400" :
                          p.difficulty === "Medium" ? "bg-yellow-400" : "bg-red-400"
                        }`} />
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{p.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {p.tags.slice(0, 3).map((t) => (
                          <span key={t} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
