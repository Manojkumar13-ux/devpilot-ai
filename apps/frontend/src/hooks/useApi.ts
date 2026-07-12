import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useLeaderboard(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["leaderboard", page, limit],
    queryFn: () => api.leaderboard.get({ page, limit }),
    staleTime: 30_000,
  });
}
