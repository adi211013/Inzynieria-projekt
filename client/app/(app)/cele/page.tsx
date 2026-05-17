"use client";

import { useState, useMemo } from "react";
import {
  Archive,
  CheckCircle2,
  ListChecks,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { getCategoryById } from "@/lib/categories";
import { useGoals, useArchiveGoal } from "@/hooks/useGoals";
import { useHabits, useCreateHabit } from "@/hooks/useHabits";
import { useStatsOverview } from "@/hooks/useStats";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import GoalForm from "@/components/features/GoalForm";
import HabitForm from "@/components/features/HabitForm";
import type { Goal, GoalStat } from "@/types/domain";

type Tab = "in_progress" | "completed" | "failed";

const GOAL_TEMPLATES = [
  {
    name: "30 dni medytacji",
    icon: "Moon",
    color: "#8B5CF6",
    category: "zdrowie",
    target_days: 30,
    meta: "Zdrowie · 30 dni",
  },
  {
    name: "100 pompek dziennie — 60 dni",
    icon: "Dumbbell",
    color: "#F97316",
    category: "sport",
    target_days: 60,
    meta: "Sport · 60 dni",
  },
  {
    name: "12 książek w 2026",
    icon: "BookOpen",
    color: "#3B82F6",
    category: "rozwoj",
    target_days: 90,
    meta: "Rozwój · 90 dni",
  },
];

const HABIT_TEMPLATES = [
  {
    name: "Picie wody 2L",
    icon: "Droplets",
    color: "#3B82F6",
    category: "zdrowie",
    frequency: { type: "daily" as const },
    meta: "Zdrowie · Codziennie",
  },
  {
    name: "30 minut ruchu",
    icon: "Dumbbell",
    color: "#F97316",
    category: "sport",
    frequency: { type: "daily" as const },
    meta: "Sport · Codziennie",
  },
  {
    name: "Czytanie 20 stron",
    icon: "BookOpen",
    color: "#8B5CF6",
    category: "rozwoj",
    frequency: { type: "daily" as const },
    meta: "Rozwój · Codziennie",
  },
];

function daysRemaining(deadline?: string | null): string | null {
  if (!deadline) return null;
  const diff = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / 86400000,
  );
  if (diff < 0) return "Po terminie";
  if (diff === 0) return "Dziś";
  return `za ${diff} dni`;
}

interface GoalCardProps {
  goal: Goal;
  stat?: GoalStat;
  onArchive: (id: number) => void;
}

function GoalCard({ goal, stat, onArchive }: GoalCardProps) {
  const Icon = getIcon(goal.icon);
  const cat = getCategoryById(
    (goal.category ?? "inne") as Parameters<typeof getCategoryById>[0],
  );
  const currentDays = stat?.current_days ?? 0;
  const targetDays = goal.target_days;
  const percent =
    stat?.progress_percent ?? Math.round((currentDays / targetDays) * 100);
  const remaining = daysRemaining(goal.deadline);
  const isCompleted = goal.status === "completed";
  const isFailed = goal.status === "failed";

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-surface border border-border p-5 flex flex-col gap-4 group",
        isCompleted && "border-accent/40",
        isFailed && "opacity-70",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: cat.bg, color: goal.color ?? cat.color }}
        >
          <Icon className="size-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-semibold text-text-1 leading-snug",
              isCompleted && "line-through text-text-2",
            )}
          >
            {goal.name}
          </p>
          <span
            className="inline-flex items-center mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: cat.bg, color: cat.color }}
          >
            {cat.label}
          </span>
        </div>
        {isCompleted && (
          <Trophy className="size-5 shrink-0 text-accent mt-0.5" />
        )}
        {isFailed && <XCircle className="size-5 shrink-0 text-red mt-0.5" />}
      </div>

      {/* Progress numbers */}
      <div className="flex items-end gap-1.5">
        <span className="text-3xl font-bold text-text-1 leading-none">
          {currentDays}
        </span>
        <span className="text-sm text-text-3 mb-0.5">/ {targetDays} dni</span>
        <span className="ml-auto text-sm font-semibold text-text-2">
          {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-surface-alt overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isCompleted ? "bg-accent" : isFailed ? "bg-red" : "bg-accent",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {isCompleted ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-accent">
            <CheckCircle2 className="size-3.5" />
            Ukończono!
          </span>
        ) : isFailed ? (
          <span className="text-xs text-red font-medium">Nie ukończono</span>
        ) : (
          <span className="text-xs text-text-3">
            {remaining ?? `${targetDays - currentDays} dni pozostało`}
          </span>
        )}

        {!isCompleted && !isFailed && (
          <button
            onClick={() => onArchive(goal.goal_id)}
            className="flex size-7 items-center justify-center rounded-lg text-text-3 hover:text-red hover:bg-red/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            title="Archiwizuj"
          >
            <Archive className="size-3.5" />
          </button>
        )}

        {remaining && !isCompleted && !isFailed && (
          <span
            className={cn(
              "text-[10px] font-semibold rounded-full px-2 py-0.5",
              remaining === "Po terminie"
                ? "bg-red/10 text-red"
                : remaining === "Dziś"
                  ? "bg-amber/10 text-amber-600"
                  : "bg-surface-alt text-text-3",
            )}
          >
            {remaining}
          </span>
        )}
      </div>
    </div>
  );
}

type ModalMode = { type: "none" } | { type: "goal" } | { type: "habit" };

export default function CelePage() {
  const [tab, setTab] = useState<Tab>("in_progress");
  const [modal, setModal] = useState<ModalMode>({ type: "none" });

  const { data: goals = [], isLoading } = useGoals();
  const { data: habits = [] } = useHabits();
  const { data: overview } = useStatsOverview();
  const { mutate: archiveGoal } = useArchiveGoal();
  const { mutate: createHabit } = useCreateHabit();

  const statsMap = useMemo(() => {
    const map = new Map<number, GoalStat>();
    for (const g of overview?.goals ?? []) {
      map.set(g.goal_id, g);
    }
    return map;
  }, [overview]);

  const noHabits = !isLoading && habits.length === 0;
  const noGoals = !isLoading && goals.length === 0 && !noHabits;

  const filtered = useMemo(
    () => goals.filter((g) => g.status === tab),
    [goals, tab],
  );

  const tabCounts = useMemo(
    () => ({
      in_progress: goals.filter((g) => g.status === "in_progress").length,
      completed: goals.filter((g) => g.status === "completed").length,
      failed: goals.filter((g) => g.status === "failed").length,
    }),
    [goals],
  );

  function handleArchive(id: number) {
    archiveGoal(id, {
      onSuccess: () => toast.success("Cel zarchiwizowany"),
      onError: () => toast.error("Nie udało się zarchiwizować"),
    });
  }

  function addHabitTemplate(tpl: (typeof HABIT_TEMPLATES)[0]) {
    createHabit(
      {
        name: tpl.name,
        icon: tpl.icon,
        color: tpl.color,
        category: tpl.category,
        frequency: tpl.frequency,
      },
      {
        onSuccess: () => toast.success(`Dodano: ${tpl.name}`),
        onError: () => toast.error("Nie udało się dodać nawyku"),
      },
    );
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "in_progress", label: "Aktywne", count: tabCounts.in_progress },
    { key: "completed", label: "Ukończone", count: tabCounts.completed },
    { key: "failed", label: "Nieudane", count: tabCounts.failed },
  ];

  return (
    <>
      <PageHeader title="Cele" />

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Page header */}
        <div className="hidden md:flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-semibold text-text-1">
              Cele
            </h1>
            <p className="text-sm text-text-2 mt-1">
              Wyzwania z określoną metą i terminem ukończenia
            </p>
          </div>
          {!noHabits && (
            <button
              onClick={() => setModal({ type: "goal" })}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-fg hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
            >
              + Dodaj cel
            </button>
          )}
        </div>

        {/* No habits state */}
        {noHabits && (
          <div className="rounded-2xl border-2 border-dashed border-border p-6">
            <EmptyState
              icon={ListChecks}
              title="Najpierw utwórz nawyk"
              description="Każdy cel musi być powiązany z nawykiem. Zacznij od stworzenia nawyku — np. 'Medytacja' — a potem wyznacz sobie cel: '30 dni medytacji'."
              action={{
                label: "+ Utwórz nawyk",
                onClick: () => setModal({ type: "habit" }),
              }}
              className="py-8"
            >
              <div className="w-full mt-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-text-3 mb-3">
                  Albo wybierz z propozycji
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {HABIT_TEMPLATES.map((tpl) => {
                    const Icon = getIcon(tpl.icon);
                    return (
                      <button
                        key={tpl.name}
                        onClick={() => addHabitTemplate(tpl)}
                        className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left hover:border-primary/40 hover:bg-surface-alt transition-colors cursor-pointer group"
                      >
                        <span
                          className="flex size-9 shrink-0 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: `${tpl.color}22`,
                            color: tpl.color,
                          }}
                        >
                          <Icon className="size-4.5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-1 truncate">
                            {tpl.name}
                          </p>
                          <p className="text-xs text-text-3">{tpl.meta}</p>
                        </div>
                        <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          + Dodaj
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </EmptyState>
          </div>
        )}

        {/* No goals state */}
        {noGoals && (
          <>
            {/* Disabled tabs */}
            <div className="flex gap-1">
              {TABS.map((t) => (
                <span
                  key={t.key}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium bg-surface-alt text-text-3 opacity-50 select-none"
                >
                  {t.label}
                </span>
              ))}
            </div>

            <div className="rounded-2xl border-2 border-dashed border-border p-6">
              <EmptyState
                icon={Target}
                title="Brak celów"
                description="Cel to wyzwanie z określonym czasem i metą — np. 30 dni medytacji, 100 dni nauki angielskiego albo przeczytanie 12 książek w roku. W odróżnieniu od nawyków, cele kończą się sukcesem lub porażką."
                action={{
                  label: "+ Utwórz cel",
                  onClick: () => setModal({ type: "goal" }),
                }}
                className="py-8"
              >
                <div className="w-full mt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-3 mb-3">
                    Przykładowe cele
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {GOAL_TEMPLATES.map((tpl) => {
                      const Icon = getIcon(tpl.icon);
                      return (
                        <div
                          key={tpl.name}
                          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left"
                        >
                          <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-full"
                            style={{
                              backgroundColor: `${tpl.color}22`,
                              color: tpl.color,
                            }}
                          >
                            <Icon className="size-4.5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-1 truncate">
                              {tpl.name}
                            </p>
                            <p className="text-xs text-text-3">{tpl.meta}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </EmptyState>
            </div>
          </>
        )}

        {/* Normal state */}
        {!noHabits && !noGoals && (
          <>
            {/* Tabs */}
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                    tab === t.key
                      ? "bg-primary text-primary-fg"
                      : "bg-surface-alt text-text-2 hover:text-text-1",
                  )}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                        tab === t.key ? "bg-white/20" : "bg-border text-text-3",
                      )}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-sm text-text-3">
                Ładowanie...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-3">
                {tab === "completed"
                  ? "Twoje ukończone cele pojawią się tutaj."
                  : tab === "failed"
                    ? "Brak nieudanych celów. Tak trzymaj."
                    : "Brak aktywnych celów."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((goal) => (
                  <GoalCard
                    key={goal.goal_id}
                    goal={goal}
                    stat={statsMap.get(goal.goal_id)}
                    onArchive={handleArchive}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <Dialog
        open={modal.type === "goal"}
        onOpenChange={(open) => {
          if (!open) setModal({ type: "none" });
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-130 p-0 gap-0 overflow-hidden rounded-2xl bg-surface border-border"
        >
          <DialogTitle className="sr-only">Nowy cel</DialogTitle>
          {modal.type === "goal" && (
            <GoalForm
              onBack={() => setModal({ type: "none" })}
              onClose={() => setModal({ type: "none" })}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={modal.type === "habit"}
        onOpenChange={(open) => {
          if (!open) setModal({ type: "none" });
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-130 p-0 gap-0 overflow-hidden rounded-2xl bg-surface border-border"
        >
          <DialogTitle className="sr-only">Nowy nawyk</DialogTitle>
          {modal.type === "habit" && (
            <HabitForm
              onBack={() => setModal({ type: "none" })}
              onClose={() => setModal({ type: "none" })}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
