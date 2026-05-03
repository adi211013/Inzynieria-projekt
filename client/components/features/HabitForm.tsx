"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  X,
  Check,
  Plus,
  Minus,
  Dumbbell,
  Heart,
  Apple,
  Brain,
  BookOpen,
  Coffee,
  Moon,
  Droplets,
  Flame,
  Leaf,
  Music,
  Pencil,
  Code,
  Wallet,
  Star,
  Target,
  Zap,
  Trophy,
  Sun,
  Palette,
  Bike,
  Pill,
  Camera,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/categories";
import { useCreateHabit } from "@/hooks/useHabits";
import { toast } from "sonner";

const habitSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa jest wymagana")
    .max(50, "Maksymalnie 50 znaków"),
  category: z.union([
    z.literal("zdrowie"),
    z.literal("sport"),
    z.literal("rozwoj"),
    z.literal("hobby"),
    z.literal("praca"),
    z.literal("finanse"),
    z.literal("inne"),
  ]),
  icon: z.string(),
  color: z.string(),
  frequency: z.union([
    z.literal("daily"),
    z.literal("weekly_days"),
    z.literal("times_per_week"),
  ]),
  days_of_week: z.array(z.number()),
  times_per_week: z.number().min(1).max(7),
  target_count: z.number().min(1).optional(),
});

type HabitFormValues = z.infer<typeof habitSchema>;

const ICONS: { name: string; Icon: LucideIcon }[] = [
  { name: "Dumbbell", Icon: Dumbbell },
  { name: "Heart", Icon: Heart },
  { name: "Apple", Icon: Apple },
  { name: "Brain", Icon: Brain },
  { name: "BookOpen", Icon: BookOpen },
  { name: "Coffee", Icon: Coffee },
  { name: "Moon", Icon: Moon },
  { name: "Droplets", Icon: Droplets },
  { name: "Flame", Icon: Flame },
  { name: "Leaf", Icon: Leaf },
  { name: "Music", Icon: Music },
  { name: "Pencil", Icon: Pencil },
  { name: "Code", Icon: Code },
  { name: "Wallet", Icon: Wallet },
  { name: "Star", Icon: Star },
  { name: "Target", Icon: Target },
  { name: "Zap", Icon: Zap },
  { name: "Trophy", Icon: Trophy },
  { name: "Sun", Icon: Sun },
  { name: "Palette", Icon: Palette },
  { name: "Bike", Icon: Bike },
  { name: "Pill", Icon: Pill },
  { name: "Camera", Icon: Camera },
  { name: "Globe", Icon: Globe },
];

const COLORS = [
  "#22C55E",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
  "#F59E0B",
  "#EF4444",
  "#0891B2",
  "#6B7280",
];

const DAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

interface HabitFormProps {
  onBack: () => void;
  onClose: () => void;
}

export default function HabitForm({ onBack, onClose }: HabitFormProps) {
  const [trackCount, setTrackCount] = useState(false);
  const { mutate: createHabit, isPending, error } = useCreateHabit();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: "",
      category: "inne",
      icon: "Dumbbell",
      color: "#22C55E",
      frequency: "daily",
      days_of_week: [],
      times_per_week: 3,
    },
  });

  const category = watch("category");
  const selectedIcon = watch("icon");
  const selectedColor = watch("color");
  const frequency = watch("frequency");
  const selectedDays = watch("days_of_week");
  const timesPerWeek = watch("times_per_week");
  const targetCount = watch("target_count") ?? 1;

  function toggleDay(i: number) {
    const current = selectedDays ?? [];
    setValue(
      "days_of_week",
      current.includes(i) ? current.filter((d) => d !== i) : [...current, i],
    );
  }

  function handleTrackCountToggle() {
    const next = !trackCount;
    setTrackCount(next);
    if (next) setValue("target_count", 1);
    else setValue("target_count", undefined);
  }

  function buildFrequency(values: HabitFormValues) {
    if (values.frequency === "daily") return { type: "daily" as const };
    if (values.frequency === "weekly_days")
      return { type: "weekly_days" as const, days: values.days_of_week };
    return { type: "times_per_week" as const, count: values.times_per_week };
  }

  function onSubmit(values: HabitFormValues) {
    createHabit(
      {
        name: values.name,
        frequency: buildFrequency(values),
        icon: values.icon,
        color: values.color,
        category: values.category,
        ...(trackCount &&
          values.target_count != null && {
            target_count: values.target_count,
          }),
      },
      {
        onSuccess: () => {
          toast.success("Nawyk został utworzony");
          onClose();
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col max-h-[88vh]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-alt text-text-2 hover:text-text-1 hover:bg-surface transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h2 className="font-heading text-base font-semibold text-text-1 flex-1">
          Nowy nawyk
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-alt text-text-2 hover:text-text-1 hover:bg-surface transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-col gap-5 overflow-y-auto flex-1 min-h-0 p-4">
        {/* Nazwa */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-text-3">
            Nazwa
          </label>
          <input
            {...register("name")}
            type="text"
            placeholder="np. Poranne ćwiczenia"
            className={cn(
              "w-full rounded-xl border bg-surface-alt px-3 py-2.5 text-sm text-text-1 placeholder:text-text-3 outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
              errors.name
                ? "border-red focus:border-red"
                : "border-border focus:border-primary",
            )}
          />
          {errors.name && (
            <p className="text-xs text-red">{errors.name.message}</p>
          )}
        </div>

        {/* Kategoria */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-text-3">
            Kategoria
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setValue("category", cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl p-2.5 border transition-colors text-xs font-medium cursor-pointer",
                    isSelected
                      ? "border-primary bg-accent-soft text-primary"
                      : "border-border bg-surface-alt text-text-2 hover:border-primary/50 hover:bg-surface",
                  )}
                >
                  <span
                    className="flex size-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: cat.bg, color: cat.color }}
                  >
                    <cat.icon className="size-4" />
                  </span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ikona */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-text-3">
            Ikona
          </label>
          <div className="grid grid-cols-8 gap-2">
            {ICONS.map(({ name: iconName, Icon }) => {
              const isSelected = selectedIcon === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setValue("icon", iconName)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl border transition-colors cursor-pointer",
                    isSelected
                      ? "border-primary bg-accent-soft"
                      : "border-border bg-surface-alt text-text-3 hover:border-primary/40 hover:bg-surface",
                  )}
                  style={isSelected ? { color: selectedColor } : undefined}
                >
                  <Icon className="size-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Kolor */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-text-3">
            Kolor
          </label>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue("color", color)}
                className="relative flex size-8 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 cursor-pointer"
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && (
                  <Check className="size-4 text-white" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Częstotliwość */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-text-3">
            Częstotliwość
          </label>
          <div className="flex rounded-xl border border-border bg-surface-alt p-1 gap-1">
            {(["daily", "weekly_days", "times_per_week"] as const).map(
              (freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setValue("frequency", freq)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
                    frequency === freq
                      ? "bg-surface text-text-1 shadow-sm"
                      : "text-text-2 hover:text-text-1",
                  )}
                >
                  {freq === "daily"
                    ? "Codziennie"
                    : freq === "weekly_days"
                      ? "Wybrane dni"
                      : "X razy / tydz."}
                </button>
              ),
            )}
          </div>

          {frequency === "weekly_days" && (
            <div className="flex gap-1.5 mt-1">
              {DAYS.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-xs font-medium transition-colors border cursor-pointer",
                    selectedDays.includes(i)
                      ? "bg-primary text-primary-fg border-primary"
                      : "bg-surface-alt text-text-2 border-border hover:border-primary/50",
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          {frequency === "times_per_week" && (
            <div className="flex items-center justify-center gap-6 mt-2 py-2">
              <button
                type="button"
                onClick={() =>
                  setValue("times_per_week", Math.max(1, timesPerWeek - 1))
                }
                className="flex size-9 items-center justify-center rounded-full border border-border bg-surface-alt text-text-1 hover:bg-surface transition-colors cursor-pointer"
              >
                <Minus className="size-4" />
              </button>
              <div className="flex flex-col items-center min-w-[60px]">
                <span className="text-3xl font-bold text-text-1 leading-none">
                  {timesPerWeek}
                </span>
                <span className="text-xs text-text-3 mt-1">
                  razy w tygodniu
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setValue("times_per_week", Math.min(7, timesPerWeek + 1))
                }
                className="flex size-9 items-center justify-center rounded-full border border-border bg-surface-alt text-text-1 hover:bg-surface transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* Śledź liczbę */}
        <div className="flex flex-col gap-2 pb-1">
          <button
            type="button"
            onClick={handleTrackCountToggle}
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-alt hover:bg-surface transition-colors cursor-pointer"
          >
            <div className="text-left">
              <p className="text-sm font-medium text-text-1">Śledź liczbę</p>
              <p className="text-xs text-text-3 mt-0.5">
                Np. 8 szklanek wody, 10 000 kroków
              </p>
            </div>
            <span
              className={cn(
                "relative flex h-6 w-11 shrink-0 rounded-full transition-colors",
                trackCount ? "bg-primary" : "bg-border-md",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
                  trackCount && "translate-x-5",
                )}
              />
            </span>
          </button>

          {trackCount && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt px-4 py-3">
              <span className="text-sm text-text-2 flex-1">Cel dzienny</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setValue("target_count", Math.max(1, targetCount - 1))
                  }
                  className="flex size-7 items-center justify-center rounded-full border border-border bg-surface text-text-1 hover:bg-surface-alt transition-colors cursor-pointer"
                >
                  <Minus className="size-3" />
                </button>
                <input
                  {...register("target_count", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  className="w-20 rounded-lg border border-border bg-surface px-2 py-1 text-sm font-semibold text-text-1 text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setValue("target_count", targetCount + 1)}
                  className="flex size-7 items-center justify-center rounded-full border border-border bg-surface text-text-1 hover:bg-surface-alt transition-colors cursor-pointer"
                >
                  <Plus className="size-3" />
                </button>
              </div>
              <span className="text-sm text-text-3 whitespace-nowrap">
                razy
              </span>
            </div>
          )}
        </div>

        {/* Błąd serwera */}
        {error && (
          <p className="text-xs text-red rounded-lg bg-red/10 px-3 py-2">
            {error.message}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 p-4 border-t border-border shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="flex-1 rounded-xl border border-border bg-surface-alt py-2.5 text-sm font-medium text-text-2 hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-fg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-70"
        >
          {isPending ? "Tworzenie..." : "Utwórz nawyk"}
        </button>
      </div>
    </form>
  );
}
