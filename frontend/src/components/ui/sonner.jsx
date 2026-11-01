"use client";
import { jsxDEV as jsxDEV_7x81h0kn } from "react/jsx-dev-runtime";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";
const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return jsxDEV_7x81h0kn(Sonner, {
    theme,
    className: "toaster group",
    style: {
      "--normal-bg": "var(--popover)",
      "--normal-text": "var(--popover-foreground)",
      "--normal-border": "var(--border)"
    },
    ...props
  }, undefined, false, undefined, this);
};

export { Toaster };
