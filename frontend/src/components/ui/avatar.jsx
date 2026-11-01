"use client";
import { jsxDEV as jsxDEV_7x81h0kn } from "react/jsx-dev-runtime";
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";
function Avatar({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(AvatarPrimitive.Root, {
    "data-slot": "avatar",
    className: cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className),
    ...props
  }, undefined, false, undefined, this);
}
function AvatarImage({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(AvatarPrimitive.Image, {
    "data-slot": "avatar-image",
    className: cn("aspect-square size-full", className),
    ...props
  }, undefined, false, undefined, this);
}
function AvatarFallback({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(AvatarPrimitive.Fallback, {
    "data-slot": "avatar-fallback",
    className: cn("bg-muted flex size-full items-center justify-center rounded-full", className),
    ...props
  }, undefined, false, undefined, this);
}

export { Avatar, AvatarImage, AvatarFallback };
