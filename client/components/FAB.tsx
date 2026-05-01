"use client";

import { useState } from "react";
import { Plus, CheckSquare, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

export default function FAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg hover:bg-primary/90 transition-colors z-40 cursor-pointer"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="sm:max-w-xs rounded-2xl bg-surface border-border"
        >
          <DialogHeader>
            <DialogTitle className="text-text-1">Co chcesz dodać?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-surface-alt transition-colors text-left cursor-pointer"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                <CheckSquare className="size-5 text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text-1">
                  Utwórz nawyk
                </p>
                <p className="text-xs text-text-3">
                  Codziennie lub kilka razy w tygodniu
                </p>
              </div>
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-surface-alt transition-colors text-left cursor-pointer"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                <Target className="size-5 text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text-1">Utwórz cel</p>
                <p className="text-xs text-text-3">
                  Określona liczba dni do osiągnięcia
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
