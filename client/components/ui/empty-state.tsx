import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  children?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center py-16 px-6 text-center", className)}>
      <div className="flex size-16 items-center justify-center rounded-2xl bg-surface-alt text-primary mb-4">
        <Icon className="size-8" />
      </div>
      <h2 className="font-heading text-2xl font-semibold text-text-1 mb-2">{title}</h2>
      <p className="text-sm text-text-2 max-w-md mb-6 leading-relaxed">{description}</p>
      {(action || secondaryAction) && (
        <div className="flex gap-3 flex-wrap justify-center mb-6">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer",
                action.variant === "ghost"
                  ? "border border-border text-text-1 hover:bg-surface-alt"
                  : "bg-primary text-primary-fg hover:bg-primary/90",
              )}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-text-1 hover:bg-surface-alt transition-colors cursor-pointer"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}