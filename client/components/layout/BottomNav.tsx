"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CheckSquare, Target, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { name: "Dzisiaj", icon: CalendarDays, href: "/" },
  { name: "Nawyki", icon: CheckSquare, href: "/nawyki" },
  { name: "Cele", icon: Target, href: "/cele" },
  { name: "Historia", icon: Clock, href: "/historia" },
  { name: "Ustawienia", icon: Settings, href: "/ustawienia" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border z-40 flex md:hidden">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-text-3 hover:text-text-2",
            )}
          >
            <Icon className="size-5" />
            <span className="text-[10px] leading-none">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}