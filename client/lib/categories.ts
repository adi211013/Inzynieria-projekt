import { Heart, Dumbbell, BookOpen, Palette, Briefcase, Wallet, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CategoryId = "zdrowie" | "sport" | "rozwoj" | "hobby" | "praca" | "finanse" | "inne";

export interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const CATEGORIES: Category[] = [
  { id: "zdrowie", label: "Zdrowie", icon: Heart,     color: "#10B981", bg: "#D1FAE5" },
  { id: "sport",   label: "Sport",   icon: Dumbbell,  color: "#F97316", bg: "#FED7AA" },
  { id: "rozwoj",  label: "Rozwój",  icon: BookOpen,  color: "#8B5CF6", bg: "#EDE9FE" },
  { id: "hobby",   label: "Hobby",   icon: Palette,   color: "#EC4899", bg: "#FCE7F3" },
  { id: "praca",   label: "Praca",   icon: Briefcase, color: "#0891B2", bg: "#CFFAFE" },
  { id: "finanse", label: "Finanse", icon: Wallet,    color: "#059669", bg: "#A7F3D0" },
  { id: "inne",    label: "Inne",    icon: Sparkles,  color: "#6B7280", bg: "#F3F4F6" },
];

export function getCategoryById(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[6];
}