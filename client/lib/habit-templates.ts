import type { FrequencyBody } from "@/types/domain";

export interface HabitTemplate {
  name: string;
  icon: string;
  color: string;
  bg: string;
  category: string;
  frequency: FrequencyBody;
  meta: string;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  { name: "Picie wody 2L", icon: "Droplets", color: "#3B82F6", bg: "#DBEAFE", category: "zdrowie", frequency: { type: "daily" }, meta: "Codziennie · Zdrowie" },
  { name: "Czytanie 20 stron", icon: "BookOpen", color: "#8B5CF6", bg: "#EDE9FE", category: "rozwoj", frequency: { type: "daily" }, meta: "Codziennie · Rozwój" },
  { name: "30 minut ruchu", icon: "Dumbbell", color: "#F97316", bg: "#FED7AA", category: "sport", frequency: { type: "times_per_week", count: 5 }, meta: "5× w tygodniu · Sport" },
  { name: "Medytacja 10 min", icon: "Sparkles", color: "#0891B2", bg: "#CFFAFE", category: "zdrowie", frequency: { type: "daily" }, meta: "Codziennie · Zdrowie" },
  { name: "Brak telefonu po 22", icon: "Moon", color: "#EC4899", bg: "#FCE7F3", category: "zdrowie", frequency: { type: "daily" }, meta: "Codziennie · Zdrowie" },
  { name: "Język obcy 15 min", icon: "Globe", color: "#8B5CF6", bg: "#EDE9FE", category: "rozwoj", frequency: { type: "daily" }, meta: "Codziennie · Rozwój" },
];