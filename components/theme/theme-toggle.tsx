"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full items-center justify-between gap-3 rounded-md border border-hairline-strong bg-canvas px-sm py-xs text-sm font-medium text-slate transition hover:bg-surface hover:text-ink"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="flex items-center gap-3">
        {isDark ? <Sun className="h-4 w-4 text-brand-yellow" aria-hidden="true" /> : <Moon className="h-4 w-4 text-primary" aria-hidden="true" />}
        {isDark ? "Light mode" : "Dark mode"}
      </span>
      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate">
        {isDark ? "On" : "Off"}
      </span>
    </button>
  );
}
