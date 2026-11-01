"use client";
import { jsxDEV as jsxDEV_7x81h0kn } from "react/jsx-dev-runtime";
import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";
function ScrollArea({
  className,
  children,
  ...props
}) {
  return jsxDEV_7x81h0kn(ScrollAreaPrimitive.Root, {
    "data-slot": "scroll-area",
    className: cn("relative", className),
    ...props,
    children: [
      jsxDEV_7x81h0kn(ScrollAreaPrimitive.Viewport, {
        "data-slot": "scroll-area-viewport",
        className: "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
        children
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn(ScrollBar, {}, undefined, false, undefined, this),
      jsxDEV_7x81h0kn(ScrollAreaPrimitive.Corner, {}, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}) {
  return jsxDEV_7x81h0kn(ScrollAreaPrimitive.ScrollAreaScrollbar, {
    "data-slot": "scroll-area-scrollbar",
    orientation,
    className: cn("flex touch-none p-px transition-colors select-none", orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent", orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent", className),
    ...props,
    children: jsxDEV_7x81h0kn(ScrollAreaPrimitive.ScrollAreaThumb, {
      "data-slot": "scroll-area-thumb",
      className: "bg-border relative flex-1 rounded-full"
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

export { ScrollArea, ScrollBar };
