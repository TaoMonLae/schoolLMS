"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "campusbloom-theme";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const initialized = useRef(false);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    queueMicrotask(() => {
      initialized.current = true;
      setTheme(initialTheme);
    });
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    window.localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
