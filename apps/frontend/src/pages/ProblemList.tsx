import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronRight, Filter } from "lucide-react";
import { api } from "../lib/api";
import type { ProblemListItem } from "@devpilot/shared";

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"] as const;
const CATEGORIES = ["Arrays", "Strings", "Trees", "Dynamic Programming", "Graphs"] as const;

function difficultyBadge(d: string) {
  switch (d) {
    case "Easy": return "badge-easy";
    case "Medium": return "badge-medium";
    case "Hard": return "badge-hard";
    default: return "badge bg-[rgba(255,255,255,0.05)] text-[#a0a0b8]";
  }
}

function SkeletonRow() {
  return (
    <div className="glass-card p-5 flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className="skeleton h-4 w-48" />
        <div className="skeleton h-3 w-24" />
      </div>
      <div className="skeleton h-6 w-16 rounded-full" />
    </div>
  );
}

export default function ProblemList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "All");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (difficulty && difficulty !== "All") params.set("difficulty", difficulty);
    if (category) params.set("category", category);
    setSearchParams(params, { replace: true });

    api
      .problems.list({
        search: search || undefined,
        difficulty: difficulty !== "All" ? difficulty : undefined,
        category: category || undefined,
      })
      .then((res: any) => setProblems(res.data ?? res))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load problems"))
      .finally(() => setLoading(false));
  }, [search, difficulty, category]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Problems</h1>
          <p className="text-sm text-[#a0a0b8] mt-1">Master coding interviews with {problems.length} challenges</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b85]" />
        <input
          type="text"
          placeholder="Search problems..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              difficulty === d
                ? "bg-[rgba(108,99,255,0.15)] text-[#6c63ff] border border-[rgba(108,99,255,0.3)]"
                : "text-[#a0a0b8] hover:text-white bg-transparent border border-transparent hover:border-[rgba(255,255,255,0.1)]"
            }`}
          >
            {d === "All" ? "All" : d}
          </button>
        ))}
        <div className="w-px h-5 bg-[rgba(255,255,255,0.06)] mx-1" />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-transparent text-xs text-[#a0a0b8] border border-[rgba(255,255,255,0.06)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#6c63ff]"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <SkeletonRow />
            </motion.div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-[#ff5252]">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && problems.length === 0 && (
        <div className="glass-card p-10 text-center">
          <Filter className="w-8 h-8 text-[#6b6b85] mx-auto mb-3" />
          <p className="text-sm text-[#a0a0b8]">No problems match your filters.</p>
          <button onClick={() => { setSearch(""); setDifficulty("All"); setCategory(""); }}
            className="text-xs text-[#6c63ff] hover:text-[#8b83ff] mt-2 transition-colors">
            Clear filters
          </button>
        </div>
      )}

      {/* Problem cards */}
      {!loading && (
        <div className="space-y-3">
          {problems.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to={`/problems/${p.slug}`}
                className="glass-card-hover p-5 flex items-center justify-between group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-white group-hover:text-[#6c63ff] transition-colors">
                      {p.title}
                    </h2>
                    <span className={difficultyBadge(p.difficulty)}>{p.difficulty}</span>
                  </div>
                  <p className="text-xs text-[#6b6b85] mt-1.5">{p.category}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6b6b85] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
