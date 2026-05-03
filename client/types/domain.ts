export type FrequencyBody =
  | { type: "daily" }
  | { type: "weekly_days"; days: number[] }
  | { type: "times_per_week"; count: number };

export interface Habit {
  habit_id: number;
  name: string;
  frequency: FrequencyBody;
  icon?: string;
  color?: string;
  category?: string;
  target_count?: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateHabitBody {
  name: string;
  frequency: FrequencyBody;
  icon?: string;
  color?: string;
  category?: string;
  target_count?: number;
}

export type GoalStatus = "in_progress" | "completed" | "failed";

export interface Goal {
  goal_id: number;
  habit_id: number;
  name: string;
  frequency: FrequencyBody;
  target_days: number;
  deadline?: string | null;
  icon?: string;
  color?: string;
  category?: string;
  status: GoalStatus;
  is_active: boolean;
  created_at: string;
  habits?: Habit;
}

export interface CreateGoalBody {
  habit_id: number;
  name: string;
  frequency: FrequencyBody;
  target_days: number;
  deadline?: string;
  icon?: string;
  color?: string;
  category?: string;
}