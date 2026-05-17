export interface HabitStat {
  habit_id: number;
  name: string;
  icon?: string;
  color?: string;
  streak: number;
  completed_today: boolean;
}

export interface GoalStat {
  goal_id: number;
  name: string;
  status: GoalStatus;
  target_days: number;
  current_days: number;
  progress_percent: number;
  deadline?: string;
}

export interface StatsOverview {
  total_habits: number;
  total_goals: number;
  total_logs: number;
  today_logs: number;
  longest_current_streak: number;
  habits: HabitStat[];
  goals: GoalStat[];
}

export interface DailyStats {
  date: string;
  completed: number;
  total: number;
}

export interface StatsHistory {
  daily: DailyStats[];
  by_category: { category: string; completed: number }[];
}

export type FrequencyBody =
  | { type: "daily" }
  | { type: "weekly_days"; days: number[] }
  | { type: "times_per_week"; count: number };

export interface Habit {
  habit_id: number;
  name: string;
  description?: string;
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
  description?: string;
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