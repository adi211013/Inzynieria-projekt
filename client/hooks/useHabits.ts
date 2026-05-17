import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Goal, Habit, CreateHabitBody } from "@/types/domain";

export function useHabits(enabled = true) {
  return useQuery({
    queryKey: ["habits"],
    queryFn: () => api.get<Habit[]>("/habits"),
    enabled,
  });
}

export function useArchivedHabits() {
  return useQuery({
    queryKey: ["habits", "archived"],
    queryFn: () => api.get<Habit[]>("/habits?archived=true"),
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateHabitBody) => api.post<Habit>("/habits", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<CreateHabitBody> }) =>
      api.put<Habit>(`/habits/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useArchiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/habits/${id}`);
      const goals = await queryClient.fetchQuery({
        queryKey: ["goals"],
        queryFn: () => api.get<Goal[]>("/goals"),
        staleTime: 0,
      });
      const linked = goals.filter((g) => g.habit_id === id && g.is_active);
      await Promise.all(linked.map((g) => api.delete(`/goals/${g.goal_id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useRestoreHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.put<Habit>(`/habits/${id}`, { is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits", "archived"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}