"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Star,
  CalendarDays,
  CheckSquare,
  Target,
  Clock,
  BarChart2,
  Settings,
} from "lucide-react";
import { useUser, useDisplayName } from "./UserContext";

const mainNav = [
  { name: "Dzisiaj", icon: CalendarDays, href: "/" },
  { name: "Nawyki", icon: CheckSquare, href: "/nawyki" },
  { name: "Cele", icon: Target, href: "/cele" },
  { name: "Historia", icon: Clock, href: "/historia" },
  { name: "Statystyki", icon: BarChart2, href: "/statystyki" },
];

const accountNav = [
  { name: "Ustawienia", icon: Settings, href: "/ustawienia" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 18) return "Dzień dobry";
  if (h >= 18) return "Dobry wieczór";
  return "Dobranoc";
}

function getPolishDate() {
  const s = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getInitials(name: string) {
  const words = name.split(/[\s_]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getFirstName(name: string) {
  const first = name.split(/[\s_]+/)[0] ?? name;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default function Sidebar() {
  const pathname = usePathname();
  const user = useUser();
  const displayName = useDisplayName();
  const firstName = displayName ? getFirstName(displayName) : "";

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col bg-surface border-r border-border">
      <div className="px-4 pt-5 pb-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
            <Star className="size-[18px] text-primary-fg" fill="currentColor" />
          </div>
          <span className="font-heading font-semibold text-xl text-text-1">
            Sanctuary
          </span>
        </Link>
      </div>

      <div className="px-4 pb-3">
        <div className="h-px bg-border" />
      </div>

      <div className="px-3 pb-4">
        <div className="rounded-xl bg-accent-soft p-6">
          <p className="font-semibold text-xl text-primary leading-snug truncate">
            {`${getGreeting()},`} <br />
            <span>{firstName ? `${firstName}` : ""}</span>
          </p>
          <p className="text-sm text-text-2 mt-0.5">{getPolishDate()}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-3 px-2 mb-1">
            Główne
          </p>
          <nav className="space-y-5">
            {mainNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent-soft text-primary pl-[9px] pr-3"
                      : "px-3 text-text-2 hover:bg-surface-alt hover:text-text-1"
                  }`}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="flex-1">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-3 px-2 mb-1">
            Konto
          </p>
          <nav className="space-y-0.5">
            {accountNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent-soft pl-[9px] pr-3"
                      : "px-3 text-text-2 hover:bg-surface-alt hover:text-text-1"
                  }`}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-alt transition-colors cursor-pointer">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg text-xs font-bold">
            {displayName ? getInitials(displayName) : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-1 truncate">
              {displayName || "Użytkownik"}
            </p>
            <p className="text-xs text-text-3 truncate">{user?.email ?? ""}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
