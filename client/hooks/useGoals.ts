import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Goal, CreateGoalBody } from "@/types/domain";

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<Goal[]>("/goals"),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateGoalBody) => api.post<Goal>("/goals", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useArchiveGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}