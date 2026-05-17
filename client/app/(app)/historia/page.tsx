"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Check } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useStatsOverview, useStatsHistory } from "@/hooks/useStats";
import { useHabits, useArchivedHabits } from "@/hooks/useHabits";
import { useRecentLogs } from "@/hooks/useLogs";
import { getIcon } from "@/lib/icons";
import { getCategoryById } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types/domain";
import type { CategoryId } from "@/lib/categories";

const DAYS_ABBR = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nie"];
const MONTHS_PL = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];
const HEAT_COLORS = [
  "bg-surface-alt",
  "bg-accent/20",
  "bg-accent/40",
  "bg-accent/65",
  "bg-accent",
];

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function scheduledCountOnDate(habits: Habit[], dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const frontendDow = (new Date(y, m - 1, d).getDay() + 6) % 7;
  return habits.filter((h) => {
    const f = h.frequency;
    if (f.type === "daily") return true;
    if (f.type === "times_per_week") return true;
    return f.days.includes(frontendDow);
  }).length;
}

function getDayLabel(dateStr: string): string {
  const todayStr = localDateStr(new Date());
  const yesterdayStr = localDateStr(new Date(Date.now() - 86400000));
  if (dateStr === todayStr) return "Dzisiaj";
  if (dateStr === yesterdayStr) return "Wczoraj";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
  }).format(new Date(y, m - 1, d));
}

function heatLevel(completed: number, total: number): number {
  if (total === 0 || completed === 0) return 0;
  const pct = completed / total;
  if (pct <= 0.25) return 1;
  if (pct <= 0.5) return 2;
  if (pct <= 0.75) return 3;
  return 4;
}

function buildCalendarCells(year: number, month: number): string[] {
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: string[] = [];
  for (let i = startDow - 1; i >= 0; i--)
    cells.push(localDateStr(new Date(year, month, -i)));
  for (let d = 1; d <= totalDays; d++)
    cells.push(localDateStr(new Date(year, month, d)));
  const trailing = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= trailing; i++)
    cells.push(localDateStr(new Date(year, month + 1, i)));
  return cells;
}

type DayStatus = "full" | "partial" | "missed" | "future" | "outside";

function calcDayStatus(
  dateStr: string,
  todayStr: string,
  firstOfMonth: string,
  lastOfMonth: string,
  dailyByDate: Map<string, { completed: number }>,
  scheduledCount: number,
): DayStatus {
  const isCurrent = dateStr >= firstOfMonth && dateStr <= lastOfMonth;
  if (!isCurrent) return "outside";
  if (dateStr > todayStr) return "future";
  if (scheduledCount === 0) return "future";
  const completed = dailyByDate.get(dateStr)?.completed ?? 0;
  if (completed >= scheduledCount) return "full";
  if (completed > 0) return "partial";
  return "missed";
}

interface CalendarProps {
  year: number;
  month: number;
  dailyByDate: Map<string, { completed: number }>;
  habits: Habit[];
  preview?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  canGoNext?: boolean;
}

function MonthCalendar({
  year,
  month,
  dailyByDate,
  habits,
  preview,
  onPrev,
  onNext,
  canGoNext,
}: CalendarProps) {
  const todayStr = localDateStr(new Date());
  const firstOfMonth = localDateStr(new Date(year, month, 1));
  const lastOfMonth = localDateStr(new Date(year, month + 1, 0));
  const cells = useMemo(() => buildCalendarCells(year, month), [year, month]);

  const { streakDays, missedDays } = useMemo(() => {
    let streakDays = 0;
    let missedDays = 0;
    for (const dateStr of cells) {
      const isCurrent = dateStr >= firstOfMonth && dateStr <= lastOfMonth;
      if (!isCurrent || dateStr > todayStr) continue;
      const sc = scheduledCountOnDate(habits, dateStr);
      if (sc === 0) continue;
      const completed = dailyByDate.get(dateStr)?.completed ?? 0;
      if (completed > 0) streakDays++;
      else missedDays++;
    }
    return { streakDays, missedDays };
  }, [cells, firstOfMonth, lastOfMonth, todayStr, habits, dailyByDate]);

  const subtitle = preview
    ? "Brak danych"
    : `${streakDays} dni ze streakiem · ${missedDays} dni pominiętych`;

  return (
    <div className="rounded-2xl bg-surface border border-border p-5">
      <div className="flex items-center justify-between mb-1">
        <h2
          className={cn(
            "font-heading text-2xl font-semibold",
            preview ? "text-text-3" : "text-text-1",
          )}
        >
          {MONTHS_PL[month]} {year}
        </h2>
        {!preview && (
          <div className="flex gap-1">
            <button
              onClick={onPrev}
              className="flex size-8 items-center justify-center rounded-lg text-text-2 hover:bg-surface-alt hover:text-text-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="flex size-8 items-center justify-center rounded-lg text-text-2 hover:bg-surface-alt hover:text-text-1 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
      <p
        className={cn("text-sm mb-5", preview ? "text-text-3" : "text-text-2")}
      >
        {subtitle}
      </p>

      <div className="grid grid-cols-7 mb-2">
        {DAYS_ABBR.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-semibold uppercase tracking-widest text-text-3"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((dateStr) => {
          const isCurrent = dateStr >= firstOfMonth && dateStr <= lastOfMonth;
          const isToday = dateStr === todayStr;
          const sc = preview ? 0 : scheduledCountOnDate(habits, dateStr);
          const status = preview
            ? isCurrent
              ? "future"
              : "outside"
            : calcDayStatus(
                dateStr,
                todayStr,
                firstOfMonth,
                lastOfMonth,
                dailyByDate,
                sc,
              );
          const dayNum = parseInt(dateStr.split("-")[2], 10);

          return (
            <div
              key={dateStr}
              className="flex items-center justify-center h-18"
            >
              <div
                className={cn(
                  "size-14 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                  !isCurrent && "opacity-30 text-text-3",
                  isToday &&
                    status === "future" &&
                    "ring-2 ring-primary ring-offset-1 text-text-1",
                  isToday &&
                    status !== "future" &&
                    "ring-2 ring-white/40 ring-inset",
                  status === "full" && "bg-primary text-primary-fg",
                  status === "partial" && "bg-accent/30 text-accent",
                  status === "missed" && "bg-red/20 text-red",
                  status === "future" && isCurrent && "text-text-3",
                )}
              >
                {dayNum}
              </div>
            </div>
          );
        })}
      </div>

      {!preview && (
        <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-border">
          <span className="flex items-center gap-1.5 text-xs text-text-2">
            <span className="size-3 rounded-sm bg-primary" /> Pełny dzień
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-2">
            <span className="size-3 rounded-sm bg-accent/30" /> Częściowo
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-2">
            <span className="size-3 rounded-sm bg-red/20" /> Pominięty
          </span>
        </div>
      )}
    </div>
  );
}

function SixMonthHeatmap({
  dailyByDate,
  habits,
  preview = false,
}: {
  dailyByDate: Map<string, { completed: number }>;
  habits: Habit[];
  preview?: boolean;
}) {
  const todayStr = localDateStr(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  const weeks = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    const dow = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dow - 25 * 7);

    const result: string[][] = [];
    const cursor = new Date(start);
    while (localDateStr(cursor) <= todayStr) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(localDateStr(new Date(cursor)));
        cursor.setDate(cursor.getDate() + 1);
      }
      result.push(week);
    }
    return result;
  }, [todayStr]);

  useEffect(() => {
    if (scrollRef.current && !preview) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [preview, weeks]);

  return (
    <div className="rounded-2xl bg-surface border border-border p-5">
      <p
        className={cn(
          "font-heading text-base font-semibold mb-0.5",
          preview ? "text-text-3" : "text-text-1",
        )}
      >
        6 miesięcy wstecz
      </p>
      <p className="text-xs text-text-3 mb-4">
        {preview
          ? "Heatmapa zacznie nabierać kształtu po kilku tygodniach"
          : "Każdy kwadrat to jeden dzień"}
      </p>
      <div ref={scrollRef} className="flex gap-0.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5 flex-1 min-w-0">
            {week.map((dateStr) => {
              const isFuture = dateStr > todayStr;
              const sc = scheduledCountOnDate(habits, dateStr);
              const completed = dailyByDate.get(dateStr)?.completed ?? 0;
              const level = preview || isFuture ? 0 : heatLevel(completed, sc);
              return (
                <div
                  key={dateStr}
                  title={
                    !preview ? `${dateStr}: ${completed}/${sc}` : undefined
                  }
                  className={cn(
                    "aspect-square w-full rounded-[2px] transition-colors",
                    HEAT_COLORS[level],
                    isFuture && "opacity-20",
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
      {!preview && (
        <div className="flex items-center gap-1 justify-end mt-2">
          <span className="text-[10px] text-text-3">Mniej</span>
          {HEAT_COLORS.map((cls, i) => (
            <div key={i} className={cn("size-2.5 rounded-[2px]", cls)} />
          ))}
          <span className="text-[10px] text-text-3">Więcej</span>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  subColor,
  preview,
}: {
  label: string;
  value?: string;
  sub?: string;
  subColor?: "accent" | "red";
  preview?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface border border-border p-4 flex flex-col gap-2 min-w-0 overflow-hidden">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-3 leading-tight break-words">
        {label}
      </p>
      {preview ? (
        <>
          <div className="w-6 h-0.5 bg-text-3/30 rounded" />
          <p className="text-xs text-text-3">brak danych</p>
        </>
      ) : (
        <>
          <p className="font-heading text-2xl font-bold text-text-1 leading-none truncate">
            {value}
          </p>
          {sub && (
            <p
              className={cn(
                "text-xs leading-tight break-words",
                subColor === "accent"
                  ? "text-accent"
                  : subColor === "red"
                    ? "text-red"
                    : "text-text-2",
              )}
            >
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function HistoriaPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const { data: overview } = useStatsOverview();
  const { data: history } = useStatsHistory(180);
  const { data: habits = [] } = useHabits();
  const { data: archivedHabits = [] } = useArchivedHabits();
  const allHabits = useMemo(() => [...habits, ...archivedHabits], [habits, archivedHabits]);

  const habitIds = useMemo(() => allHabits.map((h) => h.habit_id), [allHabits]);
  const { data: recentLogEntries = [] } = useRecentLogs(habitIds, 7);

  const hasData = (overview?.total_logs ?? 0) > 0;

  const dailyByDate = useMemo(
    () =>
      new Map(
        history?.daily.map((d) => [d.date, { completed: d.completed }]) ?? [],
      ),
    [history],
  );

  const habitMap = useMemo(
    () => new Map(allHabits.map((h) => [h.habit_id, h])),
    [allHabits],
  );

  const currentStreak = overview?.longest_current_streak ?? 0;

  const bestStreakHabit = useMemo(() => {
    if (!overview?.habits.length) return null;
    return overview.habits.reduce<(typeof overview.habits)[0] | null>(
      (best, h) => (!best || h.streak > best.streak ? h : best),
      null,
    );
  }, [overview?.habits]);

  const { effectiveness30, delta } = useMemo(() => {
    if (!history?.daily || !allHabits.length)
      return { effectiveness30: 0, delta: null as number | null };
    const todayStr = localDateStr(new Date());
    const cutoff30 = localDateStr(new Date(Date.now() - 30 * 86400000));
    const cutoff60 = localDateStr(new Date(Date.now() - 60 * 86400000));

    let c30 = 0,
      p30 = 0,
      c60 = 0,
      p60 = 0;
    for (const d of history.daily) {
      if (d.date > todayStr) continue;
      const sc = scheduledCountOnDate(allHabits, d.date);
      if (sc === 0) continue;
      if (d.date >= cutoff30) {
        c30 += d.completed;
        p30 += sc;
      } else if (d.date >= cutoff60) {
        c60 += d.completed;
        p60 += sc;
      }
    }
    const curr = p30 > 0 ? Math.round((c30 / p30) * 100) : 0;
    const prev = p60 > 0 ? Math.round((c60 / p60) * 100) : 0;
    return { effectiveness30: curr, delta: p60 > 0 ? curr - prev : null };
  }, [history, allHabits]);

  const sortedRecentLogs = useMemo(
    () =>
      [...recentLogEntries]
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) || b.habit_log_id - a.habit_log_id,
        )
        .slice(0, 10),
    [recentLogEntries],
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const todayMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoNext = currentMonth < todayMonthStart;

  function prevMonth() {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }
  function nextMonth() {
    if (canGoNext)
      setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  return (
    <div>
      <PageHeader title="Historia" />

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="hidden md:flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-text-1">
              Historia
            </h1>
            <p className="text-sm text-text-2 mt-1">
              Spójrz wstecz. Zobacz wzorce. Świętuj dni, w których się
              pokazałeś.
            </p>
          </div>
          <select className="rounded-lg border border-border bg-surface text-sm text-text-1 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0">
            <option value="">Wszystkie nawyki</option>
            {habits.map((h) => (
              <option key={h.habit_id} value={h.habit_id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {!hasData ? (
          <>
            <div className="rounded-2xl border-2 border-dashed border-border p-10 md:p-16 flex flex-col items-center text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-accent-soft mb-6">
                <CalendarDays className="size-8 text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-text-1 mb-3">
                Twoja historia jeszcze się nie zaczęła
              </h2>
              <p className="text-sm text-text-2 max-w-sm leading-relaxed mb-8">
                Po wykonaniu pierwszego nawyku zobaczysz tutaj kalendarz,
                heatmapę 6 miesięcy wstecz i listę swoich wpisów. Każdy
                zaznaczony dzień to ślad, który zostawiasz.
              </p>
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-primary text-primary-fg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Przejdź do dzisiaj
              </Link>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-1 mb-0.5">
                Podgląd
              </h3>
              <p className="text-xs text-text-3 mb-4">
                Tak będzie wyglądać ta strona, gdy zaczniesz odhaczać nawyki.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 pointer-events-none select-none">
                <MonthCalendar
                  year={year}
                  month={month}
                  dailyByDate={new Map()}
                  habits={[]}
                  preview
                />
                <div className="flex flex-col gap-4">
                  <SixMonthHeatmap
                    dailyByDate={new Map()}
                    habits={[]}
                    preview
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard label="Całkowita Passa" preview />
                    <StatCard label="Najlepsza Passa" preview />
                    <StatCard label="Skuteczność 30d" preview />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
              <MonthCalendar
                year={year}
                month={month}
                dailyByDate={dailyByDate}
                habits={allHabits}
                onPrev={prevMonth}
                onNext={nextMonth}
                canGoNext={canGoNext}
              />
              <div className="flex flex-col gap-4">
                <SixMonthHeatmap dailyByDate={dailyByDate} habits={allHabits} />
                <div className="grid grid-cols-3 gap-2">
                  <StatCard
                    label="Całkowita Passa"
                    value={String(currentStreak)}
                    sub="dni z rzędu"
                    subColor={currentStreak > 0 ? "accent" : undefined}
                  />
                  <StatCard
                    label="Najlepsza Passa"
                    value={
                      bestStreakHabit ? String(bestStreakHabit.streak) : "0"
                    }
                    sub={
                      bestStreakHabit && bestStreakHabit.streak > 0
                        ? `dni · ${bestStreakHabit.name}`
                        : undefined
                    }
                  />
                  <StatCard
                    label="Skuteczność 30d"
                    value={`${effectiveness30}%`}
                    sub={
                      delta !== null
                        ? `${delta >= 0 ? "↑" : "↓"} ${Math.abs(delta)}% vs poprzedni`
                        : undefined
                    }
                    subColor={
                      delta !== null
                        ? delta >= 0
                          ? "accent"
                          : "red"
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>

            {sortedRecentLogs.length > 0 && (
              <section>
                <h2 className="font-heading text-lg font-semibold text-text-1 mb-3">
                  Ostatnie wpisy
                </h2>
                <div className="rounded-xl bg-surface border border-border overflow-hidden divide-y divide-border">
                  {sortedRecentLogs.map((log) => {
                    const habit = habitMap.get(log.habit_id);
                    if (!habit) return null;
                    const Icon = getIcon(habit.icon);
                    const cat = getCategoryById(
                      (habit.category ?? "inne") as CategoryId,
                    );
                    const iconColor = habit.color ?? cat.color;
                    const iconBg = habit.color ? `${habit.color}22` : cat.bg;
                    const dateLabel = getDayLabel(log.date.slice(0, 10));
                    const displayName = log.note
                      ? `${habit.name} — ${log.note}`
                      : habit.name;

                    return (
                      <div
                        key={log.habit_log_id}
                        className="flex items-center gap-4 px-4 py-3.5"
                      >
                        <span
                          className="flex size-9 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: iconBg, color: iconColor }}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-1 truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-text-3">{dateLabel}</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium text-accent shrink-0">
                          <Check className="size-3" />
                          Wykonane
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
