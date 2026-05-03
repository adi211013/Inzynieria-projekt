import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Habit, CreateHabitBody } from "@/types/domain";

export function useHabits(enabled = true) {
  return useQuery({
    queryKey: ["habits"],
    queryFn: () => api.get<Habit[]>("/habits"),
    enabled,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateHabitBody) => api.post<Habit>("/habits", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}