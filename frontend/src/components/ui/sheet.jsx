"use client";
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
function Sheet({ ...props }) {
  return jsxDEV_7x81h0kn(SheetPrimitive.Root, {
    "data-slot": "sheet",
    ...props
  }, undefined, false, undefined, this);
}
function SheetTrigger({
  ...props
}) {
  return jsxDEV_7x81h0kn(SheetPrimitive.Trigger, {
    "data-slot": "sheet-trigger",
    ...props
  }, undefined, false, undefined, this);
}
function SheetClose({
  ...props
}) {
  return jsxDEV_7x81h0kn(SheetPrimitive.Close, {
    "data-slot": "sheet-close",
    ...props
  }, undefined, false, undefined, this);
}
function SheetPortal({
  ...props
}) {
  return jsxDEV_7x81h0kn(SheetPrimitive.Portal, {
    "data-slot": "sheet-portal",
    ...props
  }, undefined, false, undefined, this);
}
function SheetOverlay({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(SheetPrimitive.Overlay, {
    "data-slot": "sheet-overlay",
    className: cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50", className),
    ...props
  }, undefined, false, undefined, this);
}
function SheetContent({
  className,
  children,
  side = "right",
  ...props
}) {
  return jsxDEV_7x81h0kn(SheetPortal, {
    children: [
      jsxDEV_7x81h0kn(SheetOverlay, {}, undefined, false, undefined, this),
      jsxDEV_7x81h0kn(SheetPrimitive.Content, {
        "data-slot": "sheet-content",
        className: cn("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500", side === "right" && "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm", side === "left" && "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm", side === "top" && "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b", side === "bottom" && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t", className),
        ...props,
        children: [
          children,
          jsxDEV_7x81h0kn(SheetPrimitive.Close, {
            className: "ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
            children: [
              jsxDEV_7x81h0kn(XIcon, {
                className: "size-4"
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn("span", {
                className: "sr-only",
                children: "Close"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function SheetHeader({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "sheet-header",
    className: cn("flex flex-col gap-1.5 p-4", className),
    ...props
  }, undefined, false, undefined, this);
}
function SheetFooter({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "sheet-footer",
    className: cn("mt-auto flex flex-col gap-2 p-4", className),
    ...props
  }, undefined, false, undefined, this);
}
function SheetTitle({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(SheetPrimitive.Title, {
    "data-slot": "sheet-title",
    className: cn("text-foreground font-semibold", className),
    ...props
  }, undefined, false, undefined, this);
}
function SheetDescription({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(SheetPrimitive.Description, {
    "data-slot": "sheet-description",
    className: cn("text-muted-foreground text-sm", className),
    ...props
  }, undefined, false, undefined, this);
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription
};
