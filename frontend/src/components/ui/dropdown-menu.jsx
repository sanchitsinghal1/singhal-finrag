"use client";
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
function DropdownMenu({
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.Root, {
    "data-slot": "dropdown-menu",
    ...props
  }, undefined, false, undefined, this);
}
function DropdownMenuPortal({
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.Portal, {
    "data-slot": "dropdown-menu-portal",
    ...props
  }, undefined, false, undefined, this);
}
function DropdownMenuTrigger({
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.Trigger, {
    "data-slot": "dropdown-menu-trigger",
    ...props
  }, undefined, false, undefined, this);
}
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.Portal, {
    children: jsxDEV_7x81h0kn(DropdownMenuPrimitive.Content, {
      "data-slot": "dropdown-menu-content",
      sideOffset,
      className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md", className),
      ...props
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}
function DropdownMenuGroup({
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.Group, {
    "data-slot": "dropdown-menu-group",
    ...props
  }, undefined, false, undefined, this);
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.Item, {
    "data-slot": "dropdown-menu-item",
    "data-inset": inset,
    "data-variant": variant,
    className: cn("focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
    ...props
  }, undefined, false, undefined, this);
}
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.CheckboxItem, {
    "data-slot": "dropdown-menu-checkbox-item",
    className: cn("focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
    checked,
    ...props,
    children: [
      jsxDEV_7x81h0kn("span", {
        className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center",
        children: jsxDEV_7x81h0kn(DropdownMenuPrimitive.ItemIndicator, {
          children: jsxDEV_7x81h0kn(CheckIcon, {
            className: "size-4"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      children
    ]
  }, undefined, true, undefined, this);
}
function DropdownMenuRadioGroup({
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.RadioGroup, {
    "data-slot": "dropdown-menu-radio-group",
    ...props
  }, undefined, false, undefined, this);
}
function DropdownMenuRadioItem({
  className,
  children,
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.RadioItem, {
    "data-slot": "dropdown-menu-radio-item",
    className: cn("focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
    ...props,
    children: [
      jsxDEV_7x81h0kn("span", {
        className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center",
        children: jsxDEV_7x81h0kn(DropdownMenuPrimitive.ItemIndicator, {
          children: jsxDEV_7x81h0kn(CircleIcon, {
            className: "size-2 fill-current"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      children
    ]
  }, undefined, true, undefined, this);
}
function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.Label, {
    "data-slot": "dropdown-menu-label",
    "data-inset": inset,
    className: cn("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className),
    ...props
  }, undefined, false, undefined, this);
}
function DropdownMenuSeparator({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.Separator, {
    "data-slot": "dropdown-menu-separator",
    className: cn("bg-border -mx-1 my-1 h-px", className),
    ...props
  }, undefined, false, undefined, this);
}
function DropdownMenuShortcut({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn("span", {
    "data-slot": "dropdown-menu-shortcut",
    className: cn("text-muted-foreground ml-auto text-xs tracking-widest", className),
    ...props
  }, undefined, false, undefined, this);
}
function DropdownMenuSub({
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.Sub, {
    "data-slot": "dropdown-menu-sub",
    ...props
  }, undefined, false, undefined, this);
}
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.SubTrigger, {
    "data-slot": "dropdown-menu-sub-trigger",
    "data-inset": inset,
    className: cn("focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8", className),
    ...props,
    children: [
      children,
      jsxDEV_7x81h0kn(ChevronRightIcon, {
        className: "ml-auto size-4"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function DropdownMenuSubContent({
  className,
  ...props
}) {
  return jsxDEV_7x81h0kn(DropdownMenuPrimitive.SubContent, {
    "data-slot": "dropdown-menu-sub-content",
    className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg", className),
    ...props
  }, undefined, false, undefined, this);
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
};
