import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Goal, CreateGoalBody } from "@/types/domain";

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateGoalBody) => api.post<Goal>("/goals", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}