"use client";
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
function Select({
  ...props
}) {
  return jsxDEV_7x81h0kn(SelectPrimitive.Root, {
    "data-slot": "select",
    ...props
  }, undefined, false, undefined, this);
}
function SelectGroup({
  ...props
}) {
  return jsxDEV_7x81h0kn(SelectPrimitive.Group, {
    "data-slot": "select-group",
    ...props
  }, undefined, false, undefined, this);
}
function SelectValue({
  ...props
}) {
  return jsxDEV_7x81h0kn(SelectPrimitive.Value, {
    "data-slot": "select-value",
    ...props
  }, undefined, false, undefined, this);
}
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}) {
  return jsxDEV_7x81h0kn(SelectPrimitive.Trigger, {
    "data-slot": "select-trigger",
    "data-size": size,
    className: cn("border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
    ...props,
    children: [
      children,
      jsxDEV_7x81h0kn(SelectPrimitive.Icon, {
        asChild: true,
        children: jsxDEV_7x81h0kn(ChevronDownIcon, {
          className: "size-4 opacity-50"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}) {
  return jsxDEV_7x81h0kn(SelectPrimitive.Portal, {
    children: jsxDEV_7x81h0kn(SelectPrimitive.Content, {
      "data-slot": "select-content",
      className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
      position,
      ...props,
      children: [
        jsxDEV_7x81h0kn(SelectScrollUpButton, {}, undefined, false, undefined, this),
        jsxDEV_7x81h0kn(SelectPrimitive.Viewport, {
          className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"),
          children
        }, undefined, false, undefined, this),
        jsxDEV_7x81h0kn(SelectScrollDownButton, {}, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function SelectLabel({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(SelectPrimitive.Label, {
    "data-slot": "select-label",
    className: cn("text-muted-foreground px-2 py-1.5 text-xs", className),
    ...props
  }, undefined, false, undefined, this);
}
function SelectItem({
  className,
  children,
  ...props
}) {
  return jsxDEV_7x81h0kn(SelectPrimitive.Item, {
    "data-slot": "select-item",
    className: cn("focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2", className),
    ...props,
    children: [
      jsxDEV_7x81h0kn("span", {
        className: "absolute right-2 flex size-3.5 items-center justify-center",
        children: jsxDEV_7x81h0kn(SelectPrimitive.ItemIndicator, {
          children: jsxDEV_7x81h0kn(CheckIcon, {
            className: "size-4"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn(SelectPrimitive.ItemText, {
        children
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function SelectSeparator({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(SelectPrimitive.Separator, {
    "data-slot": "select-separator",
    className: cn("bg-border pointer-events-none -mx-1 my-1 h-px", className),
    ...props
  }, undefined, false, undefined, this);
}
function SelectScrollUpButton({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(SelectPrimitive.ScrollUpButton, {
    "data-slot": "select-scroll-up-button",
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: jsxDEV_7x81h0kn(ChevronUpIcon, {
      className: "size-4"
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}
function SelectScrollDownButton({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(SelectPrimitive.ScrollDownButton, {
    "data-slot": "select-scroll-down-button",
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: jsxDEV_7x81h0kn(ChevronDownIcon, {
      className: "size-4"
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue
};
