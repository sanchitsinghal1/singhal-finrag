"use client";
// Light/dark theme toggle.
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // next-themes needs a mounted gate to avoid SSR/client hydration mismatch
  // on the icon. This is the documented pattern; the rule is disabled for
  // this one line because the setState genuinely must run once on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = (mounted ? (resolvedTheme || theme) : "light") === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      className={className}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
