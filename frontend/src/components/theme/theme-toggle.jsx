"use client";
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
export function ThemeToggle({ className }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = (mounted ? resolvedTheme || theme : "light") === "dark";
  return jsxDEV_7x81h0kn(Button, {
    variant: "ghost",
    size: "icon",
    "aria-label": "Toggle theme",
    className,
    onClick: () => setTheme(isDark ? "light" : "dark"),
    children: mounted && isDark ? jsxDEV_7x81h0kn(Sun, {
      className: "h-4 w-4"
    }, undefined, false, undefined, this) : jsxDEV_7x81h0kn(Moon, {
      className: "h-4 w-4"
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}
