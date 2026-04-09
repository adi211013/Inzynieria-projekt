"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Calendar,
  LayoutGrid,
  BarChart3,
  Settings,
  Plus,
  Target,
  PlusCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"habit" | "goal" | null>(null);

  const navItems = [
    { name: "Dzisiaj", icon: <Calendar size={20} />, href: "/" },
    { name: "Nawyki", icon: <LayoutGrid size={20} />, href: "/nawyki" },
    { name: "Statystyki", icon: <BarChart3 size={20} />, href: "/statystyki" },
    { name: "Ustawienia", icon: <Settings size={20} />, href: "/ustawienia" },
  ];

  const menuOptions = [
    {
      name: "Utwórz nawyk",
      icon: <PlusCircle size={18} />,
      color: "bg-[#1d5c3d]",
      type: "habit" as const,
    },
    {
      name: "Utwórz cel",
      icon: <Target size={18} />,
      color: "bg-[#3db46d]",
      type: "goal" as const,
    },
  ];

  const handleOpenDialog = (type: "habit" | "goal") => {
    setDialogType(type);
    setIsMenuOpen(false);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex h-screen w-64 shrink-0 flex-col bg-[#f8faf9] p-6 font-sans border-r border-gray-100 relative">
      <Link
        href="/"
        className="mb-12 flex items-center gap-3 px-2 transition-opacity hover:opacity-80"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d5c3d] text-white shadow-sm">
          <Leaf size={22} fill="currentColor" />
        </div>
        <span className="text-xl font-bold tracking-tight text-[#1a1a1a]">
          jakaś nazwa
        </span>
      </Link>

      <div className="mb-10 px-2">
        <h3 className="font-bold text-[#1d5c3d]">Dzień dobry, ktoś!</h3>
        <p className="text-xs text-[#8c9a92]">Stay Mindful</p>
      </div>

      <nav className="flex-1 space-y-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              onClick={() => setIsMenuOpen(false)}
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all duration-200 group ${
                isActive
                  ? "bg-white text-[#1d5c3d] shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]"
                  : "text-[#8c9a92] hover:bg-white/60 hover:text-[#1d5c3d]"
              }`}
            >
              <span
                className={`transition-colors ${isActive ? "text-[#1d5c3d]" : "group-hover:text-[#1d5c3d]"}`}
              >
                {item.icon}
              </span>
              <span className="text-[14px] font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto relative">
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute bottom-full left-0 right-0 mb-4 space-y-2"
            >
              {menuOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => handleOpenDialog(option.type)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-white p-4 text-[14px] font-bold text-[#1d5c3d] shadow-[0_4px_15px_-3px_rgba(0,0,0,0.08)] transition-all hover:bg-gray-50 active:scale-[0.98]"
                >
                  <span
                    className={`text-white p-1.5 rounded-lg ${option.color}`}
                  >
                    {option.icon}
                  </span>
                  {option.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex w-full cursor-pointer items-center justify-center rounded-xl py-4 text-[14px] font-bold text-white shadow-[0_4px_15px_-3px_rgba(29,92,61,0.3)] transition-all ${
            isMenuOpen
              ? "bg-linear-to-r from-gray-800 to-gray-600 hover:scale-[1.02] hover:brightness-110"
              : "bg-linear-to-r from-[#1d5c3d] to-[#3db46d] hover:scale-[1.02] hover:brightness-110"
          }`}
        >
          <motion.div
            animate={{ rotate: isMenuOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={18} strokeWidth={3} />
          </motion.div>
          <div className="w-16 h-5 overflow-hidden">
            {isMenuOpen ? "Zamknij" : "Dodaj"}
          </div>
        </button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="sm:max-w-[425px] rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-[#1d5c3d] text-xl font-bold">
              {dialogType === "habit" ? "Nowy nawyk" : "Nowy cel"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-[#8c9a92]">
            Tutaj pojawi się formularz tworzenia.
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-linear-to-r from-[#1d5c3d] to-[#3db46d] hover:scale-[1.02] hover:brightness-110 rounded-xl font-bold py-6 cursor-pointer"
              onClick={() => setIsDialogOpen(false)}
            >
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sidebar;
