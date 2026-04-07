"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf,
  Calendar,
  LayoutGrid,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dzisiaj", icon: <Calendar size={20} />, href: "/" },
    { name: "Nawyki", icon: <LayoutGrid size={20} />, href: "/nawyki" },
    { name: "Statystyki", icon: <BarChart3 size={20} />, href: "/statystyki" },
    { name: "Ustawienia", icon: <Settings size={20} />, href: "/ustawienia" },
  ];

  return (
    <div className="flex h-screen w-64 shrink-0 flex-col bg-[#f8faf9] p-6 font-sans border-r border-gray-100">
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
        <h3 className="font-bold text-[#1d5c3d]">Good Morning ktoś</h3>
        <p className="text-xs text-[#8c9a92]">Stay Mindful</p>
      </div>

      <nav className="flex-1 space-y-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
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

      <div className="mt-auto pt-6">
        <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#1d5c3d] to-[#3db46d] py-4 text-[14px] font-bold text-white shadow-[0_4px_15px_-3px_rgba(29,92,61,0.3)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]">
          <Plus size={18} strokeWidth={3} /> Add Habit
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
