"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Label } from "recharts";
import PageHeader from "@/components/layout/PageHeader";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useStatsOverview, useStatsHistory } from "@/hooks/useStats";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

type Period = 7 | 30 | 365;

const PERIODS: { label: string; value: Period }[] = [
  { label: "7 dni", value: 7 },
  { label: "30 dni", value: 30 },
  { label: "Rok", value: 365 },
];

const barConfig = {
  completed: { label: "Wykonane", color: "#22C55E" },
} satisfies ChartConfig;

const emptyPieConfig = {} satisfies ChartConfig;

const MONTHS_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
const DAYS_SHORT = ["nd", "pon", "wt", "śr", "czw", "pt", "sob"];

function fmtDayLabel(dateStr: string, period: Period): string {
  const parts = dateStr.split("-").map(Number);
  const [y, m, d] = parts;
  if (period === 7) {
    return `${DAYS_SHORT[new Date(y, m - 1, d).getDay()]} ${d}`;
  }
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

function StatCard({
  label,
  value,
  sub,
  accentSub,
}: {
  label: string;
  value: string;
  sub?: string;
  accentSub?: boolean;
}) {
  const isEmpty = value === "—";
  return (
    <div className="rounded-xl bg-surface border border-border p-4 flex flex-col gap-1.5 min-w-0 overflow-hidden">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-3 leading-tight break-words">
        {label}
      </p>
      <p
        className={cn(
          "font-heading text-3xl font-bold leading-none",
          isEmpty ? "text-text-3" : "text-text-1",
        )}
      >
        {value}
      </p>
      {sub && (
        <p
          className={cn(
            "text-xs leading-tight break-words",
            accentSub ? "text-accent" : "text-text-2",
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function BarEmpty() {
  return (
    <div className="h-full min-h-[200px] relative flex flex-col justify-between py-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="w-full h-px bg-border" />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-sm text-text-3 bg-surface px-4 py-2 rounded-lg border border-border">
          Wykres pojawi się po pierwszych wpisach
        </p>
      </div>
    </div>
  );
}

function DonutEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-4">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r="46"
          fill="none"
          stroke="#D6D2C6"
          strokeWidth="18"
          strokeDasharray="9 5"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-xs text-text-3 text-center max-w-[200px] leading-relaxed">
        Po wykonaniu nawyków z różnych kategorii zobaczysz tutaj rozkład
      </p>
    </div>
  );
}

export default function StatystykiPage() {
  const [period, setPeriod] = useState<Period>(30);
  const { data: overview } = useStatsOverview();
  const { data: history } = useStatsHistory(period);

  const effectiveness = useMemo(() => {
    if (!history?.daily.length) return null;
    const scheduled = history.daily.filter((d) => d.total > 0);
    if (!scheduled.length) return null;
    const avg =
      scheduled.reduce((s, d) => s + d.completed / d.total, 0) / scheduled.length;
    return Math.round(avg * 100);
  }, [history]);

  const barData = useMemo(() => {
    const daily = history?.daily ?? [];
    if (period === 365) {
      const monthMap = new Map<string, number>();
      for (const d of daily) {
        const [y, m] = d.date.split("-");
        const key = `${y}-${m}`;
        monthMap.set(key, (monthMap.get(key) ?? 0) + d.completed);
      }
      return Array.from(monthMap.entries()).map(([key, completed]) => ({
        day: MONTHS_SHORT[parseInt(key.split("-")[1]) - 1],
        completed,
      }));
    }
    return daily.map((d) => ({ day: fmtDayLabel(d.date, period), completed: d.completed }));
  }, [history, period]);

  const pieData = useMemo(() => {
    const raw = (history?.by_category ?? []).filter((c) => c.completed > 0);
    const total = raw.reduce((s, c) => s + c.completed, 0);
    return raw.map((c) => {
      const cat = CATEGORIES.find((ca) => ca.id === c.category) ?? CATEGORIES[6];
      return {
        name: cat.label,
        value: c.completed,
        color: cat.color,
        pct: total > 0 ? Math.round((c.completed / total) * 100) : 0,
      };
    });
  }, [history]);

  const totalPie = pieData.reduce((s, d) => s + d.value, 0);
  const hasData = (overview?.total_logs ?? 0) > 0;
  const xInterval = period === 7 ? 0 : period === 30 ? 3 : 0;

  const periodSwitcher = (
    <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 shrink-0">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => setPeriod(p.value)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors",
            period === p.value
              ? "bg-primary text-primary-fg font-medium"
              : "text-text-2 hover:text-text-1",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Statystyki" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 md:gap-5 p-4 md:p-6 h-full">
          <div className="shrink-0 flex items-start justify-between gap-4">
            <div className="hidden md:block">
              <h1 className="font-heading text-3xl font-bold text-text-1">Statystyki</h1>
              <p className="text-sm text-text-2 mt-1">
                Twoje liczby i wzorce w jednym miejscu.
              </p>
            </div>
            {periodSwitcher}
          </div>

          <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Skuteczność"
              value={effectiveness !== null ? `${effectiveness}%` : "—"}
              sub={
                effectiveness !== null
                  ? `za ostatnie ${period} dni`
                  : "brak danych"
              }
              accentSub={effectiveness !== null && effectiveness >= 70}
            />
            <StatCard
              label="Aktualny Streak"
              value={String(overview?.longest_current_streak ?? 0)}
              sub="dni z rzędu"
            />
            <StatCard
              label="Łącznie Wpisów"
              value={String(overview?.total_logs ?? 0)}
              sub="wszystkich wpisów"
            />
            <StatCard
              label="Aktywne Nawyki"
              value={String(overview?.total_habits ?? 0)}
              sub="śledzonych nawyków"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 lg:flex-1 lg:min-h-0">
            <div className="rounded-2xl bg-surface border border-border p-5 flex flex-col min-h-[360px] lg:min-h-0">
              <p className="shrink-0 font-heading text-base font-semibold text-text-1 mb-0.5">
                Wykonane rytuały — ostatnie {period === 365 ? "12 miesięcy" : `${period} dni`}
              </p>
              <p className="shrink-0 text-xs text-text-3 mb-4">Suma wszystkich nawyków per dzień</p>
              <div className="flex-1 min-h-0">
              {!hasData ? (
                <BarEmpty />
              ) : (
                <ChartContainer config={barConfig} className="h-full w-full">
                  <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="var(--color-border, #E8E5DD)"
                    />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "var(--color-text-3, #8B8A7F)" }}
                      interval={xInterval}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "var(--color-text-3, #8B8A7F)" }}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
              </div>
            </div>

            <div className="rounded-2xl bg-surface border border-border p-5 flex flex-col min-h-[340px] lg:min-h-0">
              <p className="shrink-0 font-heading text-base font-semibold text-text-1 mb-0.5">
                Podział per kategoria
              </p>
              <p className="shrink-0 text-xs text-text-3 mb-4">Ostatnie {period} dni</p>
              <div className="flex-1 min-h-0 flex flex-col justify-evenly">
                {!hasData || pieData.length === 0 ? (
                  <DonutEmpty />
                ) : (
                  <>
                    <ChartContainer config={emptyPieConfig} className="h-[220px] w-full">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={66}
                          outerRadius={92}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          strokeWidth={2}
                          stroke="var(--color-surface, #fff)"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                          <Label
                            content={({ viewBox }) => {
                              const vb = viewBox as { cx: number; cy: number };
                              return (
                                <text textAnchor="middle">
                                  <tspan
                                    x={vb.cx}
                                    y={vb.cy - 6}
                                    style={{ fontSize: 24, fontWeight: 700, fill: "#1C1C18" }}
                                  >
                                    {totalPie}
                                  </tspan>
                                  <tspan
                                    x={vb.cx}
                                    y={vb.cy + 14}
                                    style={{ fontSize: 10, fill: "#8B8A7F", letterSpacing: "0.06em" }}
                                  >
                                    WYKONAŃ
                                  </tspan>
                                </text>
                              );
                            }}
                          />
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="space-y-2 mt-4">
                      {pieData.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-text-2 truncate">{entry.name}</span>
                          </div>
                          <span className="text-text-3 tabular-nums shrink-0 ml-2">
                            {entry.value} · {entry.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}