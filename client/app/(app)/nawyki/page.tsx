"use client";

import { useState, useMemo } from "react";
import {
  Archive,
  ListChecks,
  PenLine,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { getCategoryById } from "@/lib/categories";
import { HABIT_TEMPLATES } from "@/lib/habit-templates";
import {
  useHabits,
  useArchivedHabits,
  useArchiveHabit,
  useRestoreHabit,
  useCreateHabit,
} from "@/hooks/useHabits";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import HabitForm from "@/components/features/HabitForm";
import type { Habit } from "@/types/domain";

type Tab = "active" | "archived";
type Filter = "all" | "daily" | "weekly_days" | "times_per_week";

const DAYS_SHORT = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

function frequencyLabel(habit: Habit): string {
  const f = habit.frequency;
  if (f.type === "daily") return "Codziennie";
  if (f.type === "times_per_week") return `${f.count}× w tygodniu`;
  return "Wybrane dni";
}

function frequencyFilter(habit: Habit): Filter {
  return habit.frequency.type as Filter;
}

interface HabitRowProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onArchive: (id: number) => void;
}

function HabitRow({ habit, onEdit, onArchive }: HabitRowProps) {
  const Icon = getIcon(habit.icon);
  const cat = getCategoryById(
    (habit.category ?? "inne") as Parameters<typeof getCategoryById>[0],
  );
  const f = habit.frequency;

  return (
    <div className="flex items-center gap-3 py-3.5 px-1 group">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: cat.bg, color: habit.color ?? cat.color }}
      >
        <Icon className="size-5" />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-1 truncate">
          {habit.name}
        </p>
        <p className="text-xs text-text-3 mt-0.5 truncate">
          {habit.description ? habit.description : cat.label}
        </p>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
        <span className="inline-flex items-center rounded-full bg-surface-alt border border-border px-2.5 py-0.5 text-xs font-medium text-text-2">
          {frequencyLabel(habit)}
        </span>
        {f.type === "weekly_days" && (
          <div className="flex gap-1">
            {DAYS_SHORT.map((d, i) => (
              <span
                key={i}
                className={cn(
                  "flex size-5 items-center justify-center rounded text-[10px] font-medium",
                  f.days.includes(i)
                    ? "bg-accent/15 text-accent"
                    : "bg-surface-alt text-text-3",
                )}
              >
                {d.slice(0, 1)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(habit)}
          className="flex size-8 items-center justify-center rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-alt transition-colors cursor-pointer"
          title="Edytuj"
        >
          <PenLine className="size-4" />
        </button>
        <button
          onClick={() => onArchive(habit.habit_id)}
          className="flex size-8 items-center justify-center rounded-lg text-text-3 hover:text-red hover:bg-red/10 transition-colors cursor-pointer"
          title="Archiwizuj"
        >
          <Archive className="size-4" />
        </button>
      </div>
    </div>
  );
}

interface ArchivedRowProps {
  habit: Habit;
  onRestore: (id: number) => void;
}

function ArchivedRow({ habit, onRestore }: ArchivedRowProps) {
  const Icon = getIcon(habit.icon);
  const cat = getCategoryById(
    (habit.category ?? "inne") as Parameters<typeof getCategoryById>[0],
  );

  return (
    <div className="flex items-center gap-3 py-3.5 px-1 group opacity-60">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full grayscale"
        style={{ backgroundColor: cat.bg, color: habit.color ?? cat.color }}
      >
        <Icon className="size-5" />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-2 truncate line-through">
          {habit.name}
        </p>
        <p className="text-xs text-text-3 mt-0.5">
          {cat.label} · {frequencyLabel(habit)}
        </p>
      </div>

      <button
        onClick={() => onRestore(habit.habit_id)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-alt px-3 py-1.5 text-xs font-medium text-text-2 hover:text-text-1 hover:bg-surface transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
      >
        <RotateCcw className="size-3" />
        Przywróć
      </button>
    </div>
  );
}

type ModalMode =
  | { type: "none" }
  | { type: "create" }
  | { type: "create-prefill"; template: (typeof HABIT_TEMPLATES)[0] }
  | { type: "edit"; habit: Habit };

export default function NawykirPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalMode>({ type: "none" });

  const { data: habits = [], isLoading } = useHabits();
  const { data: archived = [], isLoading: isLoadingArchived } =
    useArchivedHabits();
  const { mutate: archiveHabit } = useArchiveHabit();
  const { mutate: restoreHabit } = useRestoreHabit();
  const { mutate: createHabit } = useCreateHabit();

  const filtered = useMemo(() => {
    let list = habits;
    if (filter !== "all")
      list = list.filter((h) => frequencyFilter(h) === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          (h.category ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [habits, filter, search]);

  function handleArchive(id: number) {
    archiveHabit(id, {
      onSuccess: () => toast.success("Nawyk zarchiwizowany"),
      onError: () => toast.error("Nie udało się zarchiwizować"),
    });
  }

  function handleRestore(id: number) {
    restoreHabit(id, {
      onSuccess: () => toast.success("Nawyk przywrócony"),
      onError: () => toast.error("Nie udało się przywrócić"),
    });
  }

  function addTemplate(template: (typeof HABIT_TEMPLATES)[0]) {
    createHabit(
      {
        name: template.name,
        icon: template.icon,
        color: template.color,
        category: template.category,
        frequency: template.frequency,
      },
      {
        onSuccess: () => toast.success(`Dodano: ${template.name}`),
        onError: () => toast.error("Nie udało się dodać nawyku"),
      },
    );
  }

  const isEmpty = !isLoading && habits.length === 0;
  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all", label: `Wszystkie · ${habits.length}` },
    { key: "daily", label: "Codzienne" },
    { key: "weekly_days", label: "Wybrane dni" },
    { key: "times_per_week", label: "Tygodniowe" },
  ];

  const modalOpen = modal.type !== "none";

  function closeModal() {
    setModal({ type: "none" });
  }

  return (
    <>
      <PageHeader title="Nawyki" />

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Page header */}
        <div className="hidden md:flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-semibold text-text-1">
              Nawyki
            </h1>
            <p className="text-sm text-text-2 mt-1">
              Bezterminowe rytuały, które wykonujesz regularnie
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setTab("archived")}
              disabled={archived.length === 0 && !isLoadingArchived}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors",
                archived.length === 0 && !isLoadingArchived
                  ? "opacity-40 cursor-not-allowed text-text-3"
                  : "text-text-2 hover:bg-surface-alt cursor-pointer",
              )}
            >
              <Archive className="size-4" />
              Archiwum
              {archived.length > 0 && (
                <span className="text-xs bg-surface-alt rounded-full px-1.5 py-0.5 text-text-3">
                  {archived.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setModal({ type: "create" })}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-fg hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              Dodaj nawyk
            </button>
          </div>
        </div>

        {/* Tabs */}
        {tab === "active" && !isEmpty && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex gap-1 overflow-x-auto pb-0.5 shrink-0">
              {filterTabs.map((ft) => (
                <button
                  key={ft.key}
                  onClick={() => setFilter(ft.key)}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer shrink-0",
                    filter === ft.key
                      ? "bg-primary text-primary-fg"
                      : "bg-surface-alt text-text-2 hover:text-text-1",
                  )}
                >
                  {ft.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-text-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj nawyku..."
                className="w-full rounded-xl border border-border bg-surface-alt pl-8 pr-3 py-1.5 text-sm text-text-1 placeholder:text-text-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Archive tab toggle (mobile) */}
        {tab === "archived" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("active")}
              className="flex items-center gap-1.5 text-sm text-text-2 hover:text-text-1 transition-colors cursor-pointer"
            >
              ← Wróć do aktywnych
            </button>
          </div>
        )}

        {/* Content */}
        {tab === "active" && (
          <>
            {isEmpty ? (
              <div className="rounded-2xl border-2 border-dashed border-border p-6">
                <EmptyState
                  icon={ListChecks}
                  title="Brak nawyków"
                  description="Nawyki to powtarzalne czynności, które wykonujesz regularnie — codziennie, w wybrane dni tygodnia, lub kilka razy w tygodniu. Streak rośnie z każdym wykonaniem."
                  action={{
                    label: "+ Utwórz pierwszy nawyk",
                    onClick: () => setModal({ type: "create" }),
                  }}
                  className="py-8"
                >
                  <div className="w-full mt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-text-3 mb-3">
                      Albo wybierz z propozycji
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {HABIT_TEMPLATES.slice(0, 4).map((tpl) => {
                        const Icon = getIcon(tpl.icon);
                        return (
                          <button
                            key={tpl.name}
                            onClick={() => addTemplate(tpl)}
                            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left hover:border-primary/40 hover:bg-surface-alt transition-colors cursor-pointer group"
                          >
                            <span
                              className="flex size-9 shrink-0 items-center justify-center rounded-full"
                              style={{
                                backgroundColor: tpl.bg,
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
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-3">
                Brak nawyków spełniających kryteria.
              </div>
            ) : (
              <div className="rounded-2xl bg-surface border border-border divide-y divide-border px-4">
                {filtered.map((habit) => (
                  <HabitRow
                    key={habit.habit_id}
                    habit={habit}
                    onEdit={(h) => setModal({ type: "edit", habit: h })}
                    onArchive={handleArchive}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "archived" && (
          <>
            {isLoadingArchived ? (
              <div className="py-12 text-center text-sm text-text-3">
                Ładowanie...
              </div>
            ) : archived.length === 0 ? (
              <p className="text-sm text-text-3 text-center py-8">
                Brak zarchiwizowanych nawyków.
              </p>
            ) : (
              <div className="rounded-2xl bg-surface border border-border divide-y divide-border px-4">
                {archived.map((habit) => (
                  <ArchivedRow
                    key={habit.habit_id}
                    habit={habit}
                    onRestore={handleRestore}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit/Create modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-130 p-0 gap-0 overflow-hidden rounded-2xl bg-surface border-border"
        >
          <DialogTitle className="sr-only">
            {modal.type === "edit" ? "Edytuj nawyk" : "Nowy nawyk"}
          </DialogTitle>
          {modal.type !== "none" && (
            <HabitForm
              onBack={closeModal}
              onClose={closeModal}
              habit={modal.type === "edit" ? modal.habit : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
