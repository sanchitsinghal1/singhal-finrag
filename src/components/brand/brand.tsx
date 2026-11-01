"use client";
// Reusable brand logo + wordmark for Singhal FinRAG.
// The logo asset lives at /logo/<size>.png (transparent background).
import React from "react";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<LogoSize, { px: number; src: string }> = {
  sm: { px: 28, src: "/logo/icon-64.png" },
  md: { px: 36, src: "/logo/header-80.png" },
  lg: { px: 56, src: "/logo/header-80.png" },
  xl: { px: 120, src: "/logo/hero-220.png" },
};

export function BrandLogo({ size = "md", className }: { size?: LogoSize; className?: string }) {
  const { px, src } = SIZE_MAP[size];
  return (
    <img
      src={src}
      alt="Singhal FinRAG logo — AI-driven financial intelligence"
      width={px}
      height={px}
      className={cn("object-contain select-none", className)}
      draggable={false}
    />
  );
}

// Logo tile: the image inside a gradient-bordered rounded container. Used
// where we want a crisp branded badge on any background.
export function BrandTile({ size = "md", className }: { size?: LogoSize; className?: string }) {
  const { px } = SIZE_MAP[size];
  return (
    <span
      className={cn(
        "relative inline-grid place-items-center rounded-2xl bg-gradient-to-br from-sky-500 via-emerald-500 to-emerald-600 p-[2px] shadow-lg shadow-emerald-600/20",
        className
      )}
      style={{ width: px + 8, height: px + 8 }}
    >
      <span className="grid h-full w-full place-items-center rounded-[14px] bg-background">
        <BrandLogo size={size} />
      </span>
    </span>
  );
}

// Full wordmark: logo + "Singhal FinRAG" text.
export function BrandWordmark({
  size = "md",
  withTagline = false,
  className,
}: {
  size?: LogoSize;
  withTagline?: boolean;
  className?: string;
}) {
  const text =
    size === "sm" ? "text-base" : size === "md" ? "text-lg" : size === "lg" ? "text-xl" : "text-3xl";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandLogo size={size} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-bold tracking-tight", text)}>
          Singhal <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">FinRAG</span>
        </span>
        {withTagline && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            Evidence-grounded research
          </span>
        )}
      </span>
    </span>
  );
}
