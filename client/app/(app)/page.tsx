"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Sprout, Plus, Target, Info, Star } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import HabitForm from "@/components/features/HabitForm";
import GoalForm from "@/components/features/GoalForm";
import { useStatsOverview, useStatsHistory } from "@/hooks/useStats";
import { useToggleHabitLog, useTodayHabitLog, useLogHabitCount } from "@/hooks/useLogs";
import { useCreateHabit, useHabits } from "@/hooks/useHabits";
import { getIcon } from "@/lib/icons";
import { getCategoryById } from "@/lib/categories";
import { useDisplayName } from "@/components/UserContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FrequencyBody, Habit } from "@/types/domain";
import type { CategoryId } from "@/lib/categories";

type ModalView = "closed" | "habit" | "goal";

interface Template {
  name: string;
  icon: string;
  color: string;
  bg: string;
  category: string;
  frequency: FrequencyBody;
  meta: string;
}

const TEMPLATES: Template[] = [
  {
    name: "Picie wody 2L",
    icon: "Droplets",
    color: "#3B82F6",
    bg: "#DBEAFE",
    category: "zdrowie",
    frequency: { type: "daily" },
    meta: "Codziennie · Zdrowie",
  },
  {
    name: "Czytanie 20 stron",
    icon: "BookOpen",
    color: "#8B5CF6",
    bg: "#EDE9FE",
    category: "rozwoj",
    frequency: { type: "daily" },
    meta: "Codziennie · Rozwój",
  },
  {
    name: "30 minut ruchu",
    icon: "Dumbbell",
    color: "#F97316",
    bg: "#FED7AA",
    category: "sport",
    frequency: { type: "times_per_week", count: 5 },
    meta: "5× w tygodniu · Sport",
  },
  {
    name: "Medytacja 10 min",
    icon: "Sparkles",
    color: "#0891B2",
    bg: "#CFFAFE",
    category: "zdrowie",
    frequency: { type: "daily" },
    meta: "Codziennie · Zdrowie",
  },
  {
    name: "Brak telefonu po 22",
    icon: "Moon",
    color: "#EC4899",
    bg: "#FCE7F3",
    category: "zdrowie",
    frequency: { type: "daily" },
    meta: "Codziennie · Zdrowie",
  },
  {
    name: "Język obcy 15 min",
    icon: "Globe",
    color: "#8B5CF6",
    bg: "#EDE9FE",
    category: "rozwoj",
    frequency: { type: "daily" },
    meta: "Codziennie · Rozwój",
  },
];

const HEAT_COLORS = [
  "bg-surface-alt",
  "bg-accent/20",
  "bg-accent/40",
  "bg-accent/65",
  "bg-accent",
];
const RING_SIZE = 100;
const RING_SW = 9;
const RING_R = (RING_SIZE - RING_SW) / 2;
const RING_C = 2 * Math.PI * RING_R;

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 100, 180, 365];

function scheduledCountOnDate(habits: Habit[], dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  const frontendDow = (dow + 6) % 7;
  return habits.filter((h) => {
    const f = h.frequency;
    if (f.type === "daily") return true;
    if (f.type === "times_per_week") return true;
    return f.days.includes(frontendDow);
  }).length;
}

function isScheduledToday(frequency: FrequencyBody): boolean {
  if (frequency.type === "daily") return true;
  if (frequency.type === "times_per_week") return true;
  // frequency.days uses 0=Mon convention (matching DAYS array in HabitForm)
  // getDay() uses 0=Sun, so convert: (Sun=0→6, Mon=1→0, ..., Sat=6→5)
  const jsDow = new Date().getDay();
  const frontendDow = (jsDow + 6) % 7;
  return frequency.days.includes(frontendDow);
}

function localDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getLast14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(localDateStr(d));
  }
  return days;
}

function heatLevel(completed: number, total: number): number {
  if (total === 0 || completed === 0) return 0;
  const pct = completed / total;
  if (pct <= 0.25) return 1;
  if (pct <= 0.5) return 2;
  if (pct <= 0.75) return 3;
  return 4;
}

function getHeroDate(): string {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("pl-PL", { weekday: "long" }).format(
    now,
  );
  const rest = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} · ${rest}`;
}

function getMotivationalText(completed: number, total: number): string {
  if (total === 0) return "";
  if (completed === total)
    return "Doskonale! Wszystkie dzisiejsze rytuały wykonane. Tak trzymaj!";
  if (completed === 0)
    return "Nowy dzień, nowa szansa. Czas na dzisiejsze rytuały!";
  const remaining = total - completed;
  const word =
    remaining === 1 ? "rytuał" : remaining < 5 ? "rytuały" : "rytuałów";
  return `Jesteś w połowie drogi. Jeszcze ${remaining} ${word} dzieli Cię od dzisiejszej pełni.`;
}

function nextMilestone(streak: number): number {
  return STREAK_MILESTONES.find((m) => m > streak) ?? streak + 7;
}

interface CountStepperProps {
  habitId: number;
  targetCount: number;
  disabled?: boolean;
}

function CountHabitStepper({ habitId, targetCount, disabled }: CountStepperProps) {
  const { data: todayValue, isLoading } = useTodayHabitLog(habitId);
  const { mutate: logCount, isPending } = useLogHabitCount();
  const current = todayValue ?? 0;
  const isComplete = current >= targetCount;
  const date = new Date().toISOString();

  function handleChange(next: number) {
    logCount({ habitId, value: next, date, targetCount });
  }

  if (isLoading) return <div className="h-7 w-20 rounded-full bg-surface-alt animate-pulse shrink-0" />;

  return (
    <div className={cn(
      "flex items-center gap-1 rounded-full border px-1 py-0.5 shrink-0 transition-colors",
      isComplete ? "border-accent bg-accent-soft" : "border-border-md bg-surface-alt",
    )}>
      <button
        onClick={() => handleChange(current - 1)}
        disabled={disabled || isPending || current <= 0}
        className="flex size-5 items-center justify-center rounded-full text-text-2 hover:bg-surface hover:text-text-1 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
      >
        <span className="text-xs font-bold leading-none">−</span>
      </button>
      <span className={cn("text-xs font-semibold w-10 text-center tabular-nums", isComplete ? "text-accent" : "text-text-2")}>
        {current}/{targetCount}
      </span>
      <button
        onClick={() => handleChange(current + 1)}
        disabled={disabled || isPending || isComplete}
        className="flex size-5 items-center justify-center rounded-full text-text-2 hover:bg-surface hover:text-text-1 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
      >
        <span className="text-xs font-bold leading-none">+</span>
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const [modalView, setModalView] = useState<ModalView>("closed");
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);

  const displayName = useDisplayName();
  const { data: overview, isLoading } = useStatsOverview();
  const { data: history } = useStatsHistory(30);
  const { data: habitsData = [] } = useHabits();
  const { mutate: toggleLog } = useToggleHabitLog();
  const { mutate: createHabit } = useCreateHabit();

  const isEmptyState = !isLoading && (overview?.total_habits ?? 0) === 0;

  const habitMap = useMemo(
    () => new Map(habitsData.map((h) => [h.habit_id, h])),
    [habitsData],
  );

  const scheduledHabitsToday = useMemo(
    () =>
      overview?.habits.filter((h) => {
        const full = habitMap.get(h.habit_id);
        return full ? isScheduledToday(full.frequency) : true;
      }) ?? [],
    [overview?.habits, habitMap],
  );

  const completedCount = scheduledHabitsToday.filter((h) => h.completed_today).length;
  const totalCount = scheduledHabitsToday.length;
  const ringPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const ringOffset = RING_C * (1 - Math.min(ringPercent, 100) / 100);

  const last14 = useMemo(() => getLast14Days(), []);
  const dailyByDate = useMemo(
    () => new Map(history?.daily.map((d) => [d.date, d]) ?? []),
    [history],
  );

  const effectivenessPercent = useMemo(() => {
    if (!history?.daily || habitsData.length === 0) return 0;
    const totalCompleted = history.daily.reduce((s, d) => s + d.completed, 0);
    const totalPossible = history.daily.reduce(
      (s, d) => s + scheduledCountOnDate(habitsData, d.date),
      0,
    );
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  }, [history, habitsData]);

  const todayPct = Math.round(ringPercent);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return localDateStr(d);
  }, []);
  const yesterdayData = dailyByDate.get(yesterday);
  const yesterdayPct = useMemo(() => {
    if (!yesterdayData || habitsData.length === 0) return null;
    const total = scheduledCountOnDate(habitsData, yesterday);
    return total > 0 ? Math.round((yesterdayData.completed / total) * 100) : null;
  }, [yesterdayData, habitsData, yesterday]);
  const delta = yesterdayPct !== null ? todayPct - yesterdayPct : null;

  const bestStreakHabit = overview?.habits.reduce<
    (typeof overview.habits)[0] | null
  >((best, h) => (!best || h.streak > best.streak ? h : best), null);

  const activeGoals =
    overview?.goals.filter((g) => g.status === "in_progress") ?? [];

  function handleAddTemplate(template: Template) {
    setAddingTemplate(template.name);
    createHabit(
      {
        name: template.name,
        frequency: template.frequency,
        icon: template.icon,
        color: template.color,
        category: template.category,
      },
      {
        onSuccess: () => {
          toast.success(`„${template.name}" dodano do nawyków`);
          setAddingTemplate(null);
        },
        onError: () => setAddingTemplate(null),
      },
    );
  }

  return (
    <div>
      <PageHeader title="Dzisiaj" />

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
              <div className="h-52 rounded-2xl bg-surface border border-border animate-pulse" />
              <div className="h-52 rounded-2xl bg-surface border border-border animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-surface border border-border animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : isEmptyState ? (
          /* ── EMPTY STATE ────────────────────────────── */
          <div className="space-y-6">
            <div className="rounded-2xl bg-primary p-7 md:p-10 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 size-44 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -bottom-6 right-6 size-28 rounded-full bg-white/5 pointer-events-none" />
              <div className="flex size-11 items-center justify-center rounded-xl bg-white/15 mb-5">
                <Sprout className="size-5 text-white" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white leading-tight mb-3">
                Zacznij swoją <span className="italic text-accent">podróż</span>
              </h2>
              <p className="text-white/70 text-sm md:text-base max-w-lg leading-relaxed mb-7">
                Stwórz pierwszy nawyk i zacznij budować trwałe zmiany. Małe
                kroki, codziennie — to wystarczy, żeby po kilku tygodniach
                zobaczyć różnicę.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setModalView("habit")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer"
                >
                  <Plus className="size-4" />
                  Utwórz nawyk
                </button>
                <button
                  disabled
                  title="Najpierw utwórz nawyk"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white/40 text-sm font-semibold cursor-not-allowed"
                >
                  <Target className="size-4" />
                  Utwórz cel
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-1 mb-1">
                Inspiracje na start
              </h3>
              <p className="text-xs text-text-3 mb-3">
                Sprawdzone nawyki, od których warto zacząć. Kliknij, żeby dodać
                do swoich.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TEMPLATES.map((template) => {
                  const Icon = getIcon(template.icon);
                  const isAdding = addingTemplate === template.name;
                  return (
                    <div
                      key={template.name}
                      className="rounded-xl bg-surface border border-border p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex size-10 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: template.bg }}
                        >
                          <Icon
                            className="size-5"
                            style={{ color: template.color }}
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-1 truncate">
                            {template.name}
                          </p>
                          <p className="text-xs text-text-3">{template.meta}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddTemplate(template)}
                        disabled={addingTemplate !== null}
                        className="w-full rounded-lg border border-border py-2 text-xs font-semibold text-text-2 hover:bg-surface-alt hover:text-text-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAdding ? "Dodawanie..." : "+ Dodaj do moich"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-accent-soft p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary mt-0.5">
                <Info className="size-4 text-primary-fg" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-1 mb-0.5">
                  Czym różni się nawyk od celu?
                </p>
                <p className="text-sm text-text-2 leading-relaxed">
                  Nawyk to bezterminowy rytuał — picie wody codziennie, czytanie
                  po 20 stron.{" "}
                  <span className="font-semibold text-text-1">Cel</span> to
                  wyzwanie z metą — 30 dni medytacji, przeczytać 12 książek w
                  roku. Streaki działają w obu, ale cel ma datę końcową.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ── NORMAL STATE ───────────────────────────── */
          <>
            {/* Hero + Ring */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-4">
              {/* Hero card */}
              <div className="rounded-2xl bg-primary p-6 md:p-7 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 size-40 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute bottom-0 right-12 size-24 rounded-full bg-white/5 pointer-events-none" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3">
                  {getHeroDate()}
                </p>
                <h2 className="font-heading text-2xl lg:text-3xl font-semibold text-white leading-tight mb-2">
                  Dzień dobry,{" "}
                  <span className="italic text-accent">{displayName}</span>
                </h2>
                <p className="text-white/70 text-sm mb-6 max-w-md leading-relaxed">
                  {getMotivationalText(completedCount, totalCount)}
                </p>
                <div className="flex gap-8">
                  <div>
                    <p className="text-2xl font-bold text-accent leading-none">
                      {overview?.longest_current_streak ?? 0}
                    </p>
                    <p className="text-[11px] text-white/50 mt-1">
                      Najdłuższa aktywna passa
                    </p>
                  </div>
                  {effectivenessPercent > 0 && (
                    <div>
                      <p className="text-2xl font-bold text-accent leading-none">
                        {effectivenessPercent}%
                      </p>
                      <p className="text-[11px] text-white/50 mt-1">
                        Skuteczność (30 dni)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ring card */}
              <div className="rounded-2xl bg-surface border border-border p-5 flex items-center justify-center gap-5">
                <div
                  className="relative shrink-0"
                  style={{ width: RING_SIZE, height: RING_SIZE }}
                >
                  <svg
                    width={RING_SIZE}
                    height={RING_SIZE}
                    viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RING_R}
                      strokeWidth={RING_SW}
                      stroke="currentColor"
                      className="text-border"
                      fill="none"
                    />
                    <circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RING_R}
                      strokeWidth={RING_SW}
                      stroke="currentColor"
                      className="text-accent transition-all duration-500"
                      fill="none"
                      strokeDasharray={RING_C}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-xl font-bold text-text-1 leading-none">
                      {completedCount}/{totalCount}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-text-3">
                      rytuałów
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-text-3 mb-1">
                    Dziś
                  </p>
                  <p className="text-4xl font-bold text-text-1 leading-none">
                    {todayPct}%
                  </p>
                  {delta !== null && (
                    <p
                      className={cn(
                        "text-xs font-medium mt-1.5",
                        delta >= 0 ? "text-accent" : "text-red",
                      )}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta}% vs wczoraj
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Today's habits */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading text-lg font-semibold text-text-1">
                  Dzisiejsze nawyki
                </h2>
                <Link
                  href="/nawyki"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Zobacz wszystkie →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {overview?.habits.map((habit) => {
                  const Icon = getIcon(habit.icon);
                  const fullHabit = habitMap.get(habit.habit_id);
                  const catId = (fullHabit?.category ?? "inne") as CategoryId;
                  const cat = getCategoryById(catId);
                  const targetCount = fullHabit?.target_count ?? null;
                  const scheduledToday = fullHabit
                    ? isScheduledToday(fullHabit.frequency)
                    : true;

                  return (
                    <div
                      key={habit.habit_id}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl bg-surface border border-border transition-opacity",
                        habit.completed_today && "opacity-60",
                        !scheduledToday && "opacity-50",
                      )}
                    >
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: habit.color ? `${habit.color}22` : cat.bg,
                          color: habit.color ?? cat.color,
                        }}
                      >
                        <Icon className="size-5" />
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-semibold text-text-1 truncate",
                          habit.completed_today && "line-through text-text-2",
                        )}>
                          {habit.name}
                        </p>
                        <p className="text-xs text-text-3 mt-0.5">
                          {cat.label}
                          {!scheduledToday ? (
                            <span className="ml-2 text-text-3 font-medium">Nie dziś</span>
                          ) : habit.streak > 0 ? (
                            <span className="ml-2 text-accent font-medium">
                              🔥 {habit.streak}{" "}
                              {fullHabit?.frequency.type === "times_per_week" ? "tyg." : "dni"}
                            </span>
                          ) : null}
                        </p>
                      </div>

                      {targetCount ? (
                        <CountHabitStepper
                          habitId={habit.habit_id}
                          targetCount={targetCount}
                          disabled={!scheduledToday}
                        />
                      ) : (
                        <button
                          onClick={() => scheduledToday && toggleLog({
                            habitId: habit.habit_id,
                            completed: !habit.completed_today,
                            date: new Date().toISOString(),
                          })}
                          disabled={!scheduledToday}
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            scheduledToday ? "cursor-pointer" : "cursor-not-allowed opacity-40",
                            habit.completed_today
                              ? "bg-accent border-accent"
                              : scheduledToday
                                ? "border-border-md hover:border-accent/60"
                                : "border-border",
                          )}
                        >
                          {habit.completed_today && (
                            <svg className="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Active goals */}
            {activeGoals.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-heading text-lg font-semibold text-text-1">
                    Aktywne cele
                  </h2>
                  <Link
                    href="/cele"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Zarządzaj celami →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeGoals.map((goal) => {
                    const daysLeft = goal.deadline
                      ? Math.max(
                          0,
                          Math.ceil(
                            (new Date(goal.deadline).getTime() - Date.now()) /
                              86400000,
                          ),
                        )
                      : null;
                    return (
                      <div
                        key={goal.goal_id}
                        className="rounded-xl bg-surface border border-border p-4 flex flex-col gap-3"
                      >
                        <p className="text-sm font-semibold text-text-1 leading-tight">
                          {goal.name}
                        </p>
                        <div>
                          <div className="flex items-baseline gap-1.5 mb-2">
                            <span className="text-2xl font-bold text-text-1">
                              {goal.current_days}
                            </span>
                            <span className="text-sm text-text-3">
                              / {goal.target_days} dni
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent transition-all duration-500"
                              style={{ width: `${goal.progress_percent}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-text-3">
                          <span>
                            ☆ Streak:{" "}
                            {goal.current_days > 0 ? goal.current_days : 0} dni
                          </span>
                          {daysLeft !== null && (
                            <span>{daysLeft} dni do końca</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Bottom: heatmap + streak card */}
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
              {/* Heatmap */}
              <div className="rounded-xl bg-surface border border-border p-4">
                <p className="font-heading text-base font-semibold text-text-1 mb-0.5">
                  Ostatnie 2 tygodnie
                </p>
                <p className="text-xs text-text-3 mb-4">
                  Intensywność wszystkich nawyków
                </p>
                <div className="flex gap-1.5">
                  {last14.map((date) => {
                    const day = dailyByDate.get(date);
                    const scheduledTotal = scheduledCountOnDate(habitsData, date);
                    const level = day ? heatLevel(day.completed, scheduledTotal) : 0;
                    return (
                      <div
                        key={date}
                        title={
                          day
                            ? `${date}: ${day.completed}/${scheduledTotal} nawyków`
                            : date
                        }
                        className={cn(
                          "flex-1 aspect-square rounded-sm transition-colors",
                          HEAT_COLORS[level],
                        )}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-text-3">
                    {new Intl.DateTimeFormat("pl-PL", {
                      day: "numeric",
                      month: "short",
                    }).format(new Date(last14[0]))}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-text-3">Mniej</span>
                    {HEAT_COLORS.map((cls, i) => (
                      <div key={i} className={cn("size-3 rounded-sm", cls)} />
                    ))}
                    <span className="text-[10px] text-text-3">Więcej</span>
                  </div>
                  <span className="text-[10px] text-text-3">Dziś</span>
                </div>
              </div>

              {/* Streak highlight */}
              {bestStreakHabit && bestStreakHabit.streak > 0 ? (
                <div className="rounded-xl bg-accent-soft border border-accent/20 p-4 flex flex-col justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-accent/70 mb-3">
                    Najdłuższy aktywny streak
                  </p>
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-3xl leading-none">🔥</span>
                    <div>
                      <p className="text-sm font-semibold text-text-1 leading-snug">
                        {bestStreakHabit.name} — {bestStreakHabit.streak} dni z
                        rzędu
                      </p>
                      <p className="text-xs text-text-2 mt-1">
                        Jeszcze{" "}
                        {nextMilestone(bestStreakHabit.streak) -
                          bestStreakHabit.streak}{" "}
                        dni do kolejnej odznaki 🏅
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Star className="size-3.5 text-accent" />
                    <div className="flex-1 h-1 rounded-full bg-accent/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{
                          width: `${Math.min(100, (bestStreakHabit.streak / nextMilestone(bestStreakHabit.streak)) * 100)}%`,
                        }}
                      />
                    </div>
                    <Star className="size-3.5 text-accent/30" />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-surface border border-border p-4 flex flex-col items-center justify-center text-center gap-2">
                  <span className="text-3xl">🎯</span>
                  <p className="text-sm text-text-2">
                    Zacznij odhaczać nawyki żeby budować streak!
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Dialog
        open={modalView !== "closed"}
        onOpenChange={(open) => {
          if (!open) setModalView("closed");
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          showCloseButton={false}
          className="rounded-2xl bg-surface border-border sm:max-w-130 p-0 gap-0 overflow-hidden"
        >
          <DialogTitle className="sr-only">
            {modalView === "habit" ? "Nowy nawyk" : "Nowy cel"}
          </DialogTitle>
          {modalView === "habit" && (
            <HabitForm
              onBack={() => setModalView("closed")}
              onClose={() => setModalView("closed")}
            />
          )}
          {modalView === "goal" && (
            <GoalForm
              onBack={() => setModalView("closed")}
              onClose={() => setModalView("closed")}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
