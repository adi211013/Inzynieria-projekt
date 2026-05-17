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
import { cn } from "@/lib/utils";
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
    <aside className="hidden md:flex h-screen md:w-16 lg:w-[240px] shrink-0 flex-col bg-surface border-r border-border">
      {/* Logo */}
      <div className="flex items-center md:justify-center lg:justify-start px-2 lg:px-4 pt-5 pb-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary">
            <Star className="size-[18px] text-primary-fg" fill="currentColor" />
          </div>
          <span className="hidden lg:block font-heading font-semibold text-xl text-text-1">
            Sanctuary
          </span>
        </Link>
      </div>

      {/* Divider — visible only on lg */}
      <div className="hidden lg:block px-4 pb-3">
        <div className="h-px bg-border" />
      </div>

      {/* Greeting — visible only on lg */}
      <div className="hidden lg:block px-3 pb-4">
        <div className="rounded-xl bg-accent-soft p-6">
          <p className="font-semibold text-xl text-primary leading-snug truncate">
            {`${getGreeting()},`} <br />
            <span>{firstName}</span>
          </p>
          <p className="text-sm text-text-2 mt-0.5">{getPolishDate()}</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto space-y-4 md:px-2 lg:px-3">
        <div>
          <p className="hidden lg:block text-[10px] font-semibold uppercase tracking-widest text-text-3 px-2 mb-1">
            Główne
          </p>
          <nav className="space-y-0.5">
            {mainNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors",
                    "md:size-10 md:mx-auto md:justify-center md:rounded-xl",
                    "lg:size-auto lg:mx-0 lg:w-full lg:gap-3 lg:py-2.5 lg:justify-start lg:rounded-lg",
                    isActive
                      ? cn(
                          "bg-accent-soft text-primary font-semibold",
                          "lg:pl-[9px] lg:pr-3",
                        )
                      : cn(
                          "text-text-2 hover:bg-surface-alt hover:text-text-1",
                          "lg:px-3",
                        ),
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="hidden lg:block flex-1">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="hidden lg:block text-[10px] font-semibold uppercase tracking-widest text-text-3 px-2 mb-1">
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
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors",
                    "md:size-10 md:mx-auto md:justify-center md:rounded-xl",
                    "lg:size-auto lg:mx-0 lg:w-full lg:gap-3 lg:py-2.5 lg:justify-start lg:rounded-lg",
                    isActive
                      ? cn(
                          "bg-accent-soft text-primary font-semibold",
                          "lg:pl-[9px] lg:pr-3",
                        )
                      : cn(
                          "text-text-2 hover:bg-surface-alt hover:text-text-1",
                          "lg:px-3",
                        ),
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="hidden lg:block">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User section */}
      <div className="p-3 border-t border-border">
        <div
          className={cn(
            "flex items-center rounded-lg hover:bg-surface-alt transition-colors cursor-pointer",
            "md:justify-center md:p-1",
            "lg:justify-start lg:gap-3 lg:px-2 lg:py-2",
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg text-xs font-bold">
            {displayName ? getInitials(displayName) : "?"}
          </div>
          <div className="hidden lg:block min-w-0 flex-1">
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
