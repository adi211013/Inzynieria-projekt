import {
  Dumbbell, Heart, Apple, Brain, BookOpen, Coffee, Moon, Droplets,
  Flame, Leaf, Music, Pencil, Code, Wallet, Star, Target, Zap, Trophy,
  Sun, Palette, Bike, Pill, Camera, Globe, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell, Heart, Apple, Brain, BookOpen, Coffee, Moon, Droplets,
  Flame, Leaf, Music, Pencil, Code, Wallet, Star, Target, Zap, Trophy,
  Sun, Palette, Bike, Pill, Camera, Globe, Sparkles,
};

export function getIcon(name: string | undefined): LucideIcon {
  if (!name) return Sparkles;
  return ICON_MAP[name] ?? Sparkles;
}
