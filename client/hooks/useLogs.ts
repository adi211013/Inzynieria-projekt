import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Goal, StatsOverview } from "@/types/domain";

interface HabitLog {
  habit_log_id: number;
  user_id: number;
  habit_id: number;
  date: string;
  value: number | string | null;
  note: string | null;
}

interface LogsResponse {
  data: HabitLog[];
  total: number;
  page: number;
  limit: number;
}

export function useTodayHabitLog(habitId: number) {
  const today = new Date().toISOString();
  return useQuery({
    queryKey: ["logs", "habit", habitId, "today"],
    queryFn: async () => {
      const result = await api.get<LogsResponse>(
        `/logs?type=habit&id=${habitId}&from=${today}&to=${today}`,
      );
      const raw = result.data[0]?.value;
      return raw != null ? Number(raw) : null;
    },
  });
}

interface LogHabitCountParams {
  habitId: number;
  value: number;
  date: string;
  targetCount: number;
}

export function useLogHabitCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, value, date, targetCount }: LogHabitCountParams) => {
      if (value > 0) {
        await api.post("/logs", { type: "habit", date, habit_id: habitId, value });
      } else {
        await api.delete("/logs", { type: "habit", date, habit_id: habitId });
      }

      const isCompleted = value >= targetCount;
      queryClient.fetchQuery({
        queryKey: ["goals"],
        queryFn: () => api.get<Goal[]>("/goals"),
        staleTime: 30_000,
      }).then((goals) => {
        const linked = goals.filter((g) => g.habit_id === habitId && g.status === "in_progress");
        return Promise.all(
          linked.map((goal) =>
            isCompleted
              ? api.post("/logs", { type: "goal", date, goal_id: goal.goal_id, completed: true })
              : api.delete("/logs", { type: "goal", date, goal_id: goal.goal_id }),
          ),
        );
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["goals"] });
        queryClient.invalidateQueries({ queryKey: ["stats", "overview"] });
      }).catch(() => {});
    },

    onMutate: async ({ habitId, value, targetCount }) => {
      await queryClient.cancelQueries({ queryKey: ["logs", "habit", habitId, "today"] });
      await queryClient.cancelQueries({ queryKey: ["stats"] });

      const prevCount = queryClient.getQueryData(["logs", "habit", habitId, "today"]);
      const prevOverview = queryClient.getQueryData<StatsOverview>(["stats", "overview"]);

      queryClient.setQueryData(["logs", "habit", habitId, "today"], value > 0 ? value : null);
      queryClient.setQueryData<StatsOverview>(["stats", "overview"], (old) => {
        if (!old) return old;
        return {
          ...old,
          habits: old.habits.map((h) =>
            h.habit_id === habitId ? { ...h, completed_today: value >= targetCount } : h,
          ),
        };
      });

      return { prevCount, prevOverview };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prevCount !== undefined) {
        queryClient.setQueryData(["logs", "habit", vars.habitId, "today"], ctx.prevCount);
      }
      if (ctx?.prevOverview) {
        queryClient.setQueryData(["stats", "overview"], ctx.prevOverview);
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ["logs", "habit", vars.habitId, "today"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

function recentDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useRecentLogs(habitIds: number[], days = 7) {
  const to = recentDateStr(new Date());
  const from = recentDateStr(new Date(Date.now() - (days - 1) * 86400000));
  const key = [...habitIds].sort().join(",");

  return useQuery({
    queryKey: ["logs", "recent", key, from, to],
    queryFn: async () => {
      if (!habitIds.length) return [];
      const all = await Promise.all(
        habitIds.map((id) =>
          api.get<LogsResponse>(`/logs?type=habit&id=${id}&from=${from}&to=${to}&limit=50`),
        ),
      );
      return all.flatMap((r) => r.data);
    },
    enabled: habitIds.length > 0,
  });
}

interface ToggleHabitLogParams {
  habitId: number;
  completed: boolean;
  date: string;
}

export function useToggleHabitLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, completed, date }: ToggleHabitLogParams) => {
      if (completed) {
        await api.post("/logs", { type: "habit", date, habit_id: habitId });
      } else {
        await api.delete("/logs", { type: "habit", date, habit_id: habitId });
      }

      queryClient.fetchQuery({
        queryKey: ["goals"],
        queryFn: () => api.get<Goal[]>("/goals"),
        staleTime: 30_000,
      }).then((goals) => {
        const linked = goals.filter((g) => g.habit_id === habitId && g.status === "in_progress");
        return Promise.all(
          linked.map((goal) =>
            completed
              ? api.post("/logs", { type: "goal", date, goal_id: goal.goal_id, completed: true })
              : api.delete("/logs", { type: "goal", date, goal_id: goal.goal_id }),
          ),
        );
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["goals"] });
        queryClient.invalidateQueries({ queryKey: ["stats", "overview"] });
      }).catch(() => {});
    },
    onMutate: async ({ habitId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["stats"] });
      const previous = queryClient.getQueryData<StatsOverview>(["stats", "overview"]);
      queryClient.setQueryData<StatsOverview>(["stats", "overview"], (old) => {
        if (!old) return old;
        return {
          ...old,
          today_logs: old.today_logs + (completed ? 1 : -1),
          habits: old.habits.map((h) =>
            h.habit_id === habitId ? { ...h, completed_today: completed } : h,
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["stats", "overview"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}