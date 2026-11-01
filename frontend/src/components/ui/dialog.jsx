"use client";
import { jsxDEV as jsxDEV_7x81h0kn } from "react/jsx-dev-runtime";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
function Dialog({
  ...props
}) {
  return jsxDEV_7x81h0kn(DialogPrimitive.Root, {
    "data-slot": "dialog",
    ...props
  }, undefined, false, undefined, this);
}
function DialogTrigger({
  ...props
}) {
  return jsxDEV_7x81h0kn(DialogPrimitive.Trigger, {
    "data-slot": "dialog-trigger",
    ...props
  }, undefined, false, undefined, this);
}
function DialogPortal({
  ...props
}) {
  return jsxDEV_7x81h0kn(DialogPrimitive.Portal, {
    "data-slot": "dialog-portal",
    ...props
  }, undefined, false, undefined, this);
}
function DialogClose({
  ...props
}) {
  return jsxDEV_7x81h0kn(DialogPrimitive.Close, {
    "data-slot": "dialog-close",
    ...props
  }, undefined, false, undefined, this);
}
function DialogOverlay({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(DialogPrimitive.Overlay, {
    "data-slot": "dialog-overlay",
    className: cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50", className),
    ...props
  }, undefined, false, undefined, this);
}
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  return jsxDEV_7x81h0kn(DialogPortal, {
    "data-slot": "dialog-portal",
    children: [
      jsxDEV_7x81h0kn(DialogOverlay, {}, undefined, false, undefined, this),
      jsxDEV_7x81h0kn(DialogPrimitive.Content, {
        "data-slot": "dialog-content",
        className: cn("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg", className),
        ...props,
        children: [
          children,
          showCloseButton && jsxDEV_7x81h0kn(DialogPrimitive.Close, {
            "data-slot": "dialog-close",
            className: "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            children: [
              jsxDEV_7x81h0kn(XIcon, {}, undefined, false, undefined, this),
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
function DialogHeader({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "dialog-header",
    className: cn("flex flex-col gap-2 text-center sm:text-left", className),
    ...props
  }, undefined, false, undefined, this);
}
function DialogFooter({ className, ...props }) {
  return jsxDEV_7x81h0kn("div", {
    "data-slot": "dialog-footer",
    className: cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className),
    ...props
  }, undefined, false, undefined, this);
}
function DialogTitle({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(DialogPrimitive.Title, {
    "data-slot": "dialog-title",
    className: cn("text-lg leading-none font-semibold", className),
    ...props
  }, undefined, false, undefined, this);
}
function DialogDescription({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(DialogPrimitive.Description, {
    "data-slot": "dialog-description",
    className: cn("text-muted-foreground text-sm", className),
    ...props
  }, undefined, false, undefined, this);
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger
};
