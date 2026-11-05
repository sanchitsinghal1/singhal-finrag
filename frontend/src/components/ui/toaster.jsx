"use client";
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport
} from "@/components/ui/toast";
export function Toaster() {
  const { toasts } = useToast();
  return jsxDEV_7x81h0kn(ToastProvider, {
    children: [
      toasts.map(function({ id, title, description, action, ...props }) {
        return jsxDEV_7x81h0kn(Toast, {
          ...props,
          children: [
            jsxDEV_7x81h0kn("div", {
              className: "grid gap-1",
              children: [
                title && jsxDEV_7x81h0kn(ToastTitle, {
                  children: title
                }, undefined, false, undefined, this),
                description && jsxDEV_7x81h0kn(ToastDescription, {
                  children: description
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            action,
            jsxDEV_7x81h0kn(ToastClose, {}, undefined, false, undefined, this)
          ]
        }, id, true, undefined, this);
      }),
      jsxDEV_7x81h0kn(ToastViewport, {}, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
