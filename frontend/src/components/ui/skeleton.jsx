import { jsxDEV as jsxDEV_7x81h0kn } from "react/jsx-dev-runtime";
import { cn } from "@/lib/utils";
function Skeleton({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "skeleton",
    className: cn("bg-accent animate-pulse rounded-md", className),
    ...props
  }, undefined, false, undefined, this);
}

export { Skeleton };
