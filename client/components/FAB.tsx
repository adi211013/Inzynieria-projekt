"use client";

import { useState } from "react";
import { Plus, CheckSquare, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { cn } from "@/lib/utils";
import HabitForm from "./features/HabitForm";
import GoalForm from "./features/GoalForm";
import { useHabits } from "@/hooks/useHabits";

type View = "pick" | "habit" | "goal";

export default function FAB() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("pick");
  const { data: habits } = useHabits(open);
  const hasHabits = (habits?.length ?? 0) > 0;

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) setView("pick");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg hover:bg-primary/90 transition-colors z-40 cursor-pointer"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          aria-describedby={undefined}
          showCloseButton={view === "pick"}
          className={cn(
            "rounded-2xl bg-surface border-border",
            view === "pick"
              ? "sm:max-w-fit"
              : "sm:max-w-130 p-0 gap-0 overflow-hidden",
          )}
        >
          {view === "pick" && (
            <>
              <DialogHeader>
                <DialogTitle
                  onClick={() => console.log(habits)}
                  className="text-text-1"
                >
                  Co chcesz dodać?
                </DialogTitle>
              </DialogHeader>
              <DialogDescription>
                Nawyk trwa bez końca, cel ma datę ukończenia
              </DialogDescription>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  onClick={() => setView("habit")}
                  className="flex w-full sm:w-64 items-center gap-3 p-4 rounded-xl border border-border hover:bg-surface-alt transition-colors text-left cursor-pointer"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                    <CheckSquare className="size-5 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text-1">
                      Utwórz nawyk
                    </p>
                    <p className="text-xs text-text-3">
                      Bezterminowa codzienna lub tygodniowa praktyka.
                    </p>
                  </div>
                </button>
                <button
                  disabled={!hasHabits}
                  onClick={() => setView("goal")}
                  className={cn(
                    "flex w-full sm:w-64 items-center gap-3 p-4 rounded-xl border transition-colors text-left",
                    hasHabits
                      ? "border-border hover:bg-surface-alt cursor-pointer"
                      : "border-border opacity-50 cursor-not-allowed",
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                    <Target className="size-5 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text-1">
                      Utwórz cel
                    </p>
                    <p className="text-xs text-text-3">
                      {hasHabits
                        ? "Wyzwanie na określoną liczbę dni."
                        : "Najpierw utwórz nawyk."}
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}

          {view === "habit" && (
            <HabitForm
              onBack={() => setView("pick")}
              onClose={() => handleOpenChange(false)}
            />
          )}

          {view === "goal" && (
            <GoalForm
              onBack={() => setView("pick")}
              onClose={() => handleOpenChange(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
