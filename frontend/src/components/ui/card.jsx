import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/lib/utils";
function Card({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "card",
    className: cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className),
    ...props
  }, undefined, false, undefined, this);
}
function CardHeader({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "card-header",
    className: cn("@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6", className),
    ...props
  }, undefined, false, undefined, this);
}
function CardTitle({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "card-title",
    className: cn("leading-none font-semibold", className),
    ...props
  }, undefined, false, undefined, this);
}
function CardDescription({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "card-description",
    className: cn("text-muted-foreground text-sm", className),
    ...props
  }, undefined, false, undefined, this);
}
function CardAction({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "card-action",
    className: cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className),
    ...props
  }, undefined, false, undefined, this);
}
function CardContent({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "card-content",
    className: cn("px-6", className),
    ...props
  }, undefined, false, undefined, this);
}
function CardFooter({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "card-footer",
    className: cn("flex items-center px-6 [.border-t]:pt-6", className),
    ...props
  }, undefined, false, undefined, this);
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent
};
