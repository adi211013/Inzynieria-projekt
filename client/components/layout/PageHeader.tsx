"use client";

import { useDisplayName } from "@/components/UserContext";

function getInitials(name: string) {
  const words = name.split(/[\s_]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  const displayName = useDisplayName();

  return (
    <header className="sticky top-0 bg-bg/80 backdrop-blur-sm border-b border-border z-30 h-14 flex items-center justify-between px-4 md:hidden">
      <h1 className="text-base font-semibold text-text-1">{title}</h1>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg text-xs font-bold">
        {displayName ? getInitials(displayName) : "?"}
      </div>
    </header>
  );
}