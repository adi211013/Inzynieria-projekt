import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StatsOverview, StatsHistory } from "@/types/domain";

export function useStatsOverview() {
  return useQuery({
    queryKey: ["stats", "overview"],
    queryFn: () => api.get<StatsOverview>("/stats/overview"),
  });
}

function localDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useStatsHistory(days = 14) {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - (days - 1));

  const to = localDateStr(toDate);
  const from = localDateStr(fromDate);

  return useQuery({
    queryKey: ["stats", "history", from, to],
    queryFn: () => api.get<StatsHistory>(`/stats/history?from=${from}&to=${to}`),
  });
}