"use client";
import { jsxDEV as jsxDEV_7x81h0kn } from "react/jsx-dev-runtime";
import React from "react";
import { cn } from "@/lib/utils";
const SIZE_MAP = {
  sm: { px: 28, src: "/logo/icon-64.png" },
  md: { px: 36, src: "/logo/header-80.png" },
  lg: { px: 56, src: "/logo/header-80.png" },
  xl: { px: 120, src: "/logo/hero-220.png" }
};
export function BrandLogo({ size = "md", className }) {
  const { px, src } = SIZE_MAP[size];
  return jsxDEV_7x81h0kn("img", {
    src,
    alt: "Singhal FinRAG logo — AI-driven financial intelligence",
    width: px,
    height: px,
    className: cn("object-contain select-none", className),
    draggable: false
  }, undefined, false, undefined, this);
}
export function BrandTile({ size = "md", className }) {
  const { px } = SIZE_MAP[size];
  return jsxDEV_7x81h0kn("span", {
    className: cn("relative inline-grid place-items-center rounded-2xl bg-gradient-to-br from-sky-500 via-emerald-500 to-emerald-600 p-[2px] shadow-lg shadow-emerald-600/20", className),
    style: { width: px + 8, height: px + 8 },
    children: jsxDEV_7x81h0kn("span", {
      className: "grid h-full w-full place-items-center rounded-[14px] bg-background",
      children: jsxDEV_7x81h0kn(BrandLogo, {
        size
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}
export function BrandWordmark({
  size = "md",
  withTagline = false,
  className
}) {
  const text = size === "sm" ? "text-base" : size === "md" ? "text-lg" : size === "lg" ? "text-xl" : "text-3xl";
  return jsxDEV_7x81h0kn("span", {
    className: cn("inline-flex items-center gap-2.5", className),
    children: [
      jsxDEV_7x81h0kn(BrandLogo, {
        size
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("span", {
        className: "flex flex-col leading-none",
        children: [
          jsxDEV_7x81h0kn("span", {
            className: cn("font-bold tracking-tight", text),
            children: [
              "Singhal ",
              jsxDEV_7x81h0kn("span", {
                className: "bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent",
                children: "FinRAG"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          withTagline && jsxDEV_7x81h0kn("span", {
            className: "text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1",
            children: "Evidence-grounded research"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
