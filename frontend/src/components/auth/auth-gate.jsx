"use client";
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import React, { useState } from "react";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, ShieldCheck, Quote, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo, BrandWordmark } from "@/components/brand/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
export function AuthView({ initialMode = "login", onBackHome }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back to Singhal FinRAG");
      } else {
        await register(email, password, name || undefined);
        toast.success("Account created — welcome to Singhal FinRAG!");
      }
    } catch (err) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }
  return jsxDEV_7x81h0kn("div", {
    className: "min-h-screen flex flex-col bg-gradient-to-b from-sky-500/5 via-background to-emerald-500/5",
    children: [
      jsxDEV_7x81h0kn("header", {
        className: "border-b bg-background/80 backdrop-blur",
        children: jsxDEV_7x81h0kn("div", {
          className: "mx-auto max-w-7xl px-4 flex h-14 items-center justify-between",
          children: [
            jsxDEV_7x81h0kn("button", {
              onClick: onBackHome,
              className: "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
              children: [
                jsxDEV_7x81h0kn(ArrowLeft, {
                  className: "h-4 w-4"
                }, undefined, false, undefined, this),
                " Back to home"
              ]
            }, undefined, true, undefined, this),
            jsxDEV_7x81h0kn(BrandWordmark, {
              size: "sm"
            }, undefined, false, undefined, this),
            jsxDEV_7x81h0kn(ThemeToggle, {}, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("main", {
        className: "flex-1 grid lg:grid-cols-2",
        children: [
          jsxDEV_7x81h0kn("div", {
            className: "flex items-center justify-center p-4 sm:p-8",
            children: jsxDEV_7x81h0kn("div", {
              className: "w-full max-w-md",
              children: [
                jsxDEV_7x81h0kn("div", {
                  className: "mb-6 text-center lg:text-left",
                  children: [
                    jsxDEV_7x81h0kn("h1", {
                      className: "text-2xl font-bold tracking-tight",
                      children: mode === "login" ? "Welcome back" : "Create your account"
                    }, undefined, false, undefined, this),
                    jsxDEV_7x81h0kn("p", {
                      className: "text-sm text-muted-foreground mt-1",
                      children: mode === "login" ? "Sign in to your Singhal FinRAG workspace." : "Start uploading reports and asking evidence-grounded questions."
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                jsxDEV_7x81h0kn(Card, {
                  className: "shadow-xl border-border/60",
                  children: [
                    jsxDEV_7x81h0kn(CardHeader, {
                      children: [
                        jsxDEV_7x81h0kn(CardTitle, {
                          className: "text-base flex items-center gap-2",
                          children: [
                            jsxDEV_7x81h0kn(BrandLogo, {
                              size: "sm"
                            }, undefined, false, undefined, this),
                            " ",
                            mode === "login" ? "Sign in" : "Register"
                          ]
                        }, undefined, true, undefined, this),
                        jsxDEV_7x81h0kn(CardDescription, {
                          children: mode === "login" ? "Access your research workspace." : "It takes less than a minute."
                        }, undefined, false, undefined, this)
                      ]
                    }, undefined, true, undefined, this),
                    jsxDEV_7x81h0kn(CardContent, {
                      children: jsxDEV_7x81h0kn("form", {
                        onSubmit: submit,
                        className: "space-y-3",
                        children: [
                          mode === "register" && jsxDEV_7x81h0kn("div", {
                            className: "space-y-1.5",
                            children: [
                              jsxDEV_7x81h0kn(Label, {
                                htmlFor: "name",
                                children: "Name (optional)"
                              }, undefined, false, undefined, this),
                              jsxDEV_7x81h0kn(Input, {
                                id: "name",
                                value: name,
                                onChange: (e) => setName(e.target.value),
                                placeholder: "Sanchit Singhal",
                                autoComplete: "name"
                              }, undefined, false, undefined, this)
                            ]
                          }, undefined, true, undefined, this),
                          jsxDEV_7x81h0kn("div", {
                            className: "space-y-1.5",
                            children: [
                              jsxDEV_7x81h0kn(Label, {
                                htmlFor: "email",
                                children: "Email"
                              }, undefined, false, undefined, this),
                              jsxDEV_7x81h0kn(Input, {
                                id: "email",
                                type: "email",
                                required: true,
                                value: email,
                                onChange: (e) => setEmail(e.target.value),
                                placeholder: "you@example.com",
                                autoComplete: "email"
                              }, undefined, false, undefined, this)
                            ]
                          }, undefined, true, undefined, this),
                          jsxDEV_7x81h0kn("div", {
                            className: "space-y-1.5",
                            children: [
                              jsxDEV_7x81h0kn(Label, {
                                htmlFor: "password",
                                children: "Password"
                              }, undefined, false, undefined, this),
                              jsxDEV_7x81h0kn(Input, {
                                id: "password",
                                type: "password",
                                required: true,
                                value: password,
                                onChange: (e) => setPassword(e.target.value),
                                placeholder: "At least 8 characters",
                                autoComplete: mode === "login" ? "current-password" : "new-password"
                              }, undefined, false, undefined, this)
                            ]
                          }, undefined, true, undefined, this),
                          jsxDEV_7x81h0kn(Button, {
                            type: "submit",
                            disabled: busy,
                            className: "w-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white",
                            children: [
                              busy && jsxDEV_7x81h0kn(Loader2, {
                                className: "h-4 w-4 mr-2 animate-spin"
                              }, undefined, false, undefined, this),
                              mode === "login" ? "Sign in" : "Create account"
                            ]
                          }, undefined, true, undefined, this),
                          jsxDEV_7x81h0kn("div", {
                            className: "text-center text-sm pt-1",
                            children: jsxDEV_7x81h0kn("button", {
                              type: "button",
                              onClick: () => setMode(mode === "login" ? "register" : "login"),
                              className: "text-emerald-700 hover:underline dark:text-emerald-400",
                              children: mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"
                            }, undefined, false, undefined, this)
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                jsxDEV_7x81h0kn("p", {
                  className: "text-[11px] text-muted-foreground text-center mt-4 leading-relaxed",
                  children: "By continuing you agree that market data is web-sourced & may be delayed, and that this is not investment advice."
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn("div", {
            className: "hidden lg:flex relative items-center justify-center bg-gradient-to-br from-sky-600 via-emerald-600 to-emerald-700 p-12 overflow-hidden",
            children: [
              jsxDEV_7x81h0kn("div", {
                className: "absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.12),transparent_50%)]"
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn("div", {
                className: "relative max-w-md text-white",
                children: [
                  jsxDEV_7x81h0kn(FloatWrap, {
                    children: jsxDEV_7x81h0kn(BrandLogo, {
                      size: "xl",
                      className: "drop-shadow-2xl"
                    }, undefined, false, undefined, this)
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn("h2", {
                    className: "mt-6 text-2xl font-bold",
                    children: "Evidence over invention."
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn("p", {
                    className: "mt-2 text-white/85 leading-relaxed",
                    children: "Singhal FinRAG answers your questions only from the documents you upload — and tells you exactly which paragraph it used."
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn("ul", {
                    className: "mt-6 space-y-3 text-sm",
                    children: [
                      jsxDEV_7x81h0kn("li", {
                        className: "flex items-start gap-2",
                        children: [
                          jsxDEV_7x81h0kn(CheckCircle2, {
                            className: "h-4 w-4 mt-0.5 shrink-0"
                          }, undefined, false, undefined, this),
                          " Cited answers with clickable sources"
                        ]
                      }, undefined, true, undefined, this),
                      jsxDEV_7x81h0kn("li", {
                        className: "flex items-start gap-2",
                        children: [
                          jsxDEV_7x81h0kn(ShieldCheck, {
                            className: "h-4 w-4 mt-0.5 shrink-0"
                          }, undefined, false, undefined, this),
                          " Your documents stay private to you"
                        ]
                      }, undefined, true, undefined, this),
                      jsxDEV_7x81h0kn("li", {
                        className: "flex items-start gap-2",
                        children: [
                          jsxDEV_7x81h0kn(Quote, {
                            className: "h-4 w-4 mt-0.5 shrink-0"
                          }, undefined, false, undefined, this),
                          " Honest refusal when evidence is missing"
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  jsxDEV_7x81h0kn("div", {
                    className: "mt-8 pt-6 border-t border-white/20 text-xs text-white/70",
                    children: [
                      "Crafted by ",
                      jsxDEV_7x81h0kn("span", {
                        className: "font-semibold text-white",
                        children: "Sanchit Singhal"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
import { motion, useReducedMotion } from "framer-motion";
function FloatWrap({ children }) {
  const reduce = useReducedMotion();
  return jsxDEV_7x81h0kn(motion.div, {
    animate: reduce ? {} : { y: [0, -12, 0] },
    transition: { duration: 6, repeat: 1 / 0, ease: "easeInOut" },
    children
  }, undefined, false, undefined, this);
}
