"use client";
import { jsxDEV as jsxDEV_7x81h0kn } from "react/jsx-dev-runtime";
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";
function Label({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(LabelPrimitive.Root, {
    "data-slot": "label",
    className: cn("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50", className),
    ...props
  }, undefined, false, undefined, this);
}

export { Label };
