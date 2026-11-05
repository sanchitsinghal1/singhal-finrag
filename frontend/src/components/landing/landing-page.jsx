"use client";
import { jsxDEV as jsxDEV_7x81h0kn } from "react/jsx-dev-runtime";
import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandLogo, BrandWordmark, BrandTile } from "@/components/brand/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  TrendingUp,
  FileText,
  MessagesSquare,
  Sparkles,
  ShieldCheck,
  GitCompare,
  Brain,
  Search,
  Database,
  ArrowRight,
  CheckCircle2,
  Quote,
  Star,
  Github,
  Linkedin,
  Twitter
} from "lucide-react";
export function LandingPage({ onSignIn, onRegister }) {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return jsxDEV_7x81h0kn("div", {
    className: "min-h-screen flex flex-col bg-background text-foreground",
    children: [
      jsxDEV_7x81h0kn("header", {
        className: `sticky top-0 z-50 transition-all ${scrolled ? "border-b bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"}`,
        children: jsxDEV_7x81h0kn("div", {
          className: "mx-auto max-w-7xl px-4",
          children: jsxDEV_7x81h0kn("div", {
            className: "flex h-16 items-center justify-between",
            children: [
              jsxDEV_7x81h0kn(BrandWordmark, {
                size: "md"
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn("nav", {
                className: "hidden md:flex items-center gap-6 text-sm",
                children: [
                  jsxDEV_7x81h0kn("a", {
                    href: "#features",
                    className: "text-muted-foreground hover:text-foreground transition-colors",
                    children: "Features"
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn("a", {
                    href: "#how",
                    className: "text-muted-foreground hover:text-foreground transition-colors",
                    children: "How it works"
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn("a", {
                    href: "#why",
                    className: "text-muted-foreground hover:text-foreground transition-colors",
                    children: "Why FinRAG"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn("div", {
                className: "flex items-center gap-2",
                children: [
                  jsxDEV_7x81h0kn(ThemeToggle, {}, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn(Button, {
                    variant: "ghost",
                    size: "sm",
                    onClick: onSignIn,
                    className: "hidden sm:inline-flex",
                    children: "Sign in"
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn(Button, {
                    size: "sm",
                    onClick: onRegister,
                    className: "bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white",
                    children: [
                      "Get started ",
                      jsxDEV_7x81h0kn(ArrowRight, {
                        className: "h-4 w-4 ml-1"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("section", {
        className: "relative overflow-hidden",
        children: [
          jsxDEV_7x81h0kn("div", {
            className: "absolute inset-0 -z-10",
            children: [
              jsxDEV_7x81h0kn("div", {
                className: "absolute inset-0 bg-gradient-to-b from-sky-500/10 via-emerald-500/5 to-background"
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn("div", {
                className: "absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.12),transparent_50%),radial-gradient(circle_at_75%_30%,rgba(16,185,129,0.12),transparent_50%)]"
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn("div", {
                className: "absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn("div", {
            className: "mx-auto max-w-7xl px-4 py-16 sm:py-24",
            children: jsxDEV_7x81h0kn("div", {
              className: "grid lg:grid-cols-2 gap-10 items-center",
              children: [
                jsxDEV_7x81h0kn(motion.div, {
                  initial: reduce ? {} : { opacity: 0, y: 24 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.6, ease: "easeOut" },
                  className: "text-center lg:text-left",
                  children: [
                    jsxDEV_7x81h0kn(Badge, {
                      variant: "secondary",
                      className: "mb-4 gap-1.5 py-1",
                      children: [
                        jsxDEV_7x81h0kn(Sparkles, {
                          className: "h-3 w-3 text-emerald-600"
                        }, undefined, false, undefined, this),
                        "Evidence-grounded equity research"
                      ]
                    }, undefined, true, undefined, this),
                    jsxDEV_7x81h0kn("h1", {
                      className: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]",
                      children: [
                        "Ask your financial reports.",
                        jsxDEV_7x81h0kn("br", {}, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("span", {
                          className: "bg-gradient-to-r from-sky-500 via-emerald-500 to-emerald-600 bg-clip-text text-transparent",
                          children: "Get cited, grounded answers."
                        }, undefined, false, undefined, this)
                      ]
                    }, undefined, true, undefined, this),
                    jsxDEV_7x81h0kn("p", {
                      className: "mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed",
                      children: [
                        "Singhal FinRAG is a multi-user research workspace that ingests your PDFs & reports, chunks and embeds them, and answers your questions",
                        jsxDEV_7x81h0kn("strong", {
                          className: "text-foreground",
                          children: " only from the retrieved text"
                        }, undefined, false, undefined, this),
                        " — with clickable citations and an honest refusal when evidence is missing."
                      ]
                    }, undefined, true, undefined, this),
                    jsxDEV_7x81h0kn("div", {
                      className: "mt-7 flex flex-wrap gap-3 justify-center lg:justify-start",
                      children: [
                        jsxDEV_7x81h0kn(Button, {
                          size: "lg",
                          onClick: onRegister,
                          className: "bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white",
                          children: [
                            "Start researching free ",
                            jsxDEV_7x81h0kn(ArrowRight, {
                              className: "h-4 w-4 ml-1.5"
                            }, undefined, false, undefined, this)
                          ]
                        }, undefined, true, undefined, this),
                        jsxDEV_7x81h0kn(Button, {
                          size: "lg",
                          variant: "outline",
                          onClick: onSignIn,
                          children: "Sign in"
                        }, undefined, false, undefined, this)
                      ]
                    }, undefined, true, undefined, this),
                    jsxDEV_7x81h0kn("div", {
                      className: "mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start text-xs text-muted-foreground",
                      children: [
                        jsxDEV_7x81h0kn("span", {
                          className: "inline-flex items-center gap-1.5",
                          children: [
                            jsxDEV_7x81h0kn(CheckCircle2, {
                              className: "h-3.5 w-3.5 text-emerald-600"
                            }, undefined, false, undefined, this),
                            " No fake numbers, ever"
                          ]
                        }, undefined, true, undefined, this),
                        jsxDEV_7x81h0kn("span", {
                          className: "inline-flex items-center gap-1.5",
                          children: [
                            jsxDEV_7x81h0kn(ShieldCheck, {
                              className: "h-3.5 w-3.5 text-emerald-600"
                            }, undefined, false, undefined, this),
                            " Per-user document isolation"
                          ]
                        }, undefined, true, undefined, this),
                        jsxDEV_7x81h0kn("span", {
                          className: "inline-flex items-center gap-1.5",
                          children: [
                            jsxDEV_7x81h0kn(Database, {
                              className: "h-3.5 w-3.5 text-emerald-600"
                            }, undefined, false, undefined, this),
                            " Runs fully offline"
                          ]
                        }, undefined, true, undefined, this)
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                jsxDEV_7x81h0kn(motion.div, {
                  initial: reduce ? {} : { opacity: 0, scale: 0.95 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { duration: 0.7, ease: "easeOut", delay: 0.1 },
                  className: "relative",
                  children: [
                    jsxDEV_7x81h0kn(motion.div, {
                      animate: reduce ? {} : { y: [0, -14, 0] },
                      transition: { duration: 6, repeat: 1 / 0, ease: "easeInOut" },
                      className: "absolute -top-6 right-2 z-10 hidden sm:block",
                      children: jsxDEV_7x81h0kn(BrandTile, {
                        size: "lg"
                      }, undefined, false, undefined, this)
                    }, undefined, false, undefined, this),
                    jsxDEV_7x81h0kn(Card, {
                      className: "shadow-2xl shadow-emerald-600/10 border-border/60 overflow-hidden",
                      children: [
                        jsxDEV_7x81h0kn("div", {
                          className: "bg-gradient-to-r from-sky-600 to-emerald-600 px-4 py-3 text-white",
                          children: jsxDEV_7x81h0kn("div", {
                            className: "flex items-center gap-2 text-sm font-medium",
                            children: [
                              jsxDEV_7x81h0kn(MessagesSquare, {
                                className: "h-4 w-4"
                              }, undefined, false, undefined, this),
                              "Sanchit's Apple research"
                            ]
                          }, undefined, true, undefined, this)
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn(CardContent, {
                          className: "p-4 space-y-3",
                          children: [
                            jsxDEV_7x81h0kn("div", {
                              className: "rounded-lg bg-muted/60 px-3 py-2 text-sm",
                              children: "“What was Apple's FY2023 net income and operating income?”"
                            }, undefined, false, undefined, this),
                            jsxDEV_7x81h0kn("div", {
                              className: "text-sm leading-relaxed",
                              children: [
                                jsxDEV_7x81h0kn("p", {
                                  className: "font-medium mb-1",
                                  children: "According to the documents:"
                                }, undefined, false, undefined, this),
                                jsxDEV_7x81h0kn("ul", {
                                  className: "space-y-1 text-muted-foreground",
                                  children: [
                                    jsxDEV_7x81h0kn("li", {
                                      children: [
                                        "• Net income was ",
                                        jsxDEV_7x81h0kn("strong", {
                                          className: "text-foreground",
                                          children: "97.0 billion USD"
                                        }, undefined, false, undefined, this),
                                        " ",
                                        jsxDEV_7x81h0kn(CiteTag, {
                                          n: 1
                                        }, undefined, false, undefined, this)
                                      ]
                                    }, undefined, true, undefined, this),
                                    jsxDEV_7x81h0kn("li", {
                                      children: [
                                        "• Operating income was ",
                                        jsxDEV_7x81h0kn("strong", {
                                          className: "text-foreground",
                                          children: "114.3 billion USD"
                                        }, undefined, false, undefined, this),
                                        " ",
                                        jsxDEV_7x81h0kn(CiteTag, {
                                          n: 1
                                        }, undefined, false, undefined, this)
                                      ]
                                    }, undefined, true, undefined, this)
                                  ]
                                }, undefined, true, undefined, this)
                              ]
                            }, undefined, true, undefined, this),
                            jsxDEV_7x81h0kn("div", {
                              className: "pt-2 border-t",
                              children: [
                                jsxDEV_7x81h0kn(Badge, {
                                  className: "text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                                  children: "from documents"
                                }, undefined, false, undefined, this),
                                jsxDEV_7x81h0kn("div", {
                                  className: "mt-2 rounded-md border bg-background/60 px-2 py-1.5 text-[11px] flex gap-1.5",
                                  children: [
                                    jsxDEV_7x81h0kn(Quote, {
                                      className: "h-3 w-3 mt-0.5 text-emerald-600 shrink-0"
                                    }, undefined, false, undefined, this),
                                    jsxDEV_7x81h0kn("span", {
                                      className: "text-muted-foreground",
                                      children: "apple_10k.txt · chunk #1 · “…operating income was 114.3 billion USD and net income was 97.0 billion…”"
                                    }, undefined, false, undefined, this)
                                  ]
                                }, undefined, true, undefined, this)
                              ]
                            }, undefined, true, undefined, this)
                          ]
                        }, undefined, true, undefined, this)
                      ]
                    }, undefined, true, undefined, this),
                    jsxDEV_7x81h0kn(motion.div, {
                      animate: reduce ? {} : { y: [0, 10, 0] },
                      transition: { duration: 5, repeat: 1 / 0, ease: "easeInOut", delay: 1 },
                      className: "absolute -bottom-4 -left-2 hidden sm:flex items-center gap-2 rounded-xl border bg-background/90 backdrop-blur px-3 py-2 shadow-lg",
                      children: [
                        jsxDEV_7x81h0kn(TrendingUp, {
                          className: "h-4 w-4 text-emerald-600"
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("div", {
                          className: "text-xs",
                          children: [
                            jsxDEV_7x81h0kn("div", {
                              className: "font-semibold",
                              children: "AAPL"
                            }, undefined, false, undefined, this),
                            jsxDEV_7x81h0kn("div", {
                              className: "text-muted-foreground",
                              children: "$343.91"
                            }, undefined, false, undefined, this)
                          ]
                        }, undefined, true, undefined, this)
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      jsxDEV_7x81h0kn("section", {
        id: "features",
        className: "py-16 sm:py-20 border-t",
        children: jsxDEV_7x81h0kn("div", {
          className: "mx-auto max-w-7xl px-4",
          children: [
            jsxDEV_7x81h0kn(SectionHeading, {
              eyebrow: "Capabilities",
              title: "Everything you need to research a company",
              subtitle: "From document ingestion to cited answers — a complete, working pipeline. No mockups."
            }, undefined, false, undefined, this),
            jsxDEV_7x81h0kn("div", {
              className: "mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
              children: FEATURES.map((f, i) => jsxDEV_7x81h0kn(FeatureCard, {
                feature: f,
                index: i
              }, f.title, false, undefined, this))
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("section", {
        id: "how",
        className: "py-16 sm:py-20 border-t bg-muted/20",
        children: jsxDEV_7x81h0kn("div", {
          className: "mx-auto max-w-7xl px-4",
          children: [
            jsxDEV_7x81h0kn(SectionHeading, {
              eyebrow: "The pipeline",
              title: "How your question becomes a cited answer",
              subtitle: "A real Retrieval-Augmented Generation pipeline, built from scratch — no LangChain, no vector-DB dependency."
            }, undefined, false, undefined, this),
            jsxDEV_7x81h0kn("div", {
              className: "mt-12 grid md:grid-cols-3 gap-4 relative",
              children: [
                jsxDEV_7x81h0kn("div", {
                  className: "hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-sky-400/40 via-emerald-400/40 to-emerald-500/40"
                }, undefined, false, undefined, this),
                PIPELINE.map((step, i) => jsxDEV_7x81h0kn(motion.div, {
                  initial: reduce ? {} : { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: "-60px" },
                  transition: { duration: 0.5, delay: i * 0.1 },
                  children: jsxDEV_7x81h0kn(Card, {
                    className: "h-full text-center relative",
                    children: jsxDEV_7x81h0kn(CardContent, {
                      className: "pt-8 pb-6 px-6",
                      children: [
                        jsxDEV_7x81h0kn("div", {
                          className: "mx-auto mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 via-emerald-500 to-emerald-600 grid place-items-center text-white shadow-lg shadow-emerald-600/20",
                          children: jsxDEV_7x81h0kn(step.icon, {
                            className: "h-6 w-6"
                          }, undefined, false, undefined, this)
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("div", {
                          className: "text-[11px] uppercase tracking-widest text-muted-foreground mb-1",
                          children: [
                            "Step ",
                            i + 1
                          ]
                        }, undefined, true, undefined, this),
                        jsxDEV_7x81h0kn("h3", {
                          className: "font-semibold mb-1.5",
                          children: step.title
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("p", {
                          className: "text-sm text-muted-foreground leading-relaxed",
                          children: step.desc
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("code", {
                          className: "mt-3 inline-block text-[10px] rounded bg-muted px-2 py-1 text-muted-foreground",
                          children: step.file
                        }, undefined, false, undefined, this)
                      ]
                    }, undefined, true, undefined, this)
                  }, undefined, false, undefined, this)
                }, step.title, false, undefined, this))
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("section", {
        id: "why",
        className: "py-16 sm:py-20 border-t",
        children: jsxDEV_7x81h0kn("div", {
          className: "mx-auto max-w-5xl px-4",
          children: [
            jsxDEV_7x81h0kn(SectionHeading, {
              eyebrow: "Why it matters",
              title: "Not another chatbot calling an LLM",
              subtitle: "The difference between a demo and something you'd trust with a financial decision."
            }, undefined, false, undefined, this),
            jsxDEV_7x81h0kn("div", {
              className: "mt-10 grid md:grid-cols-2 gap-4",
              children: [
                jsxDEV_7x81h0kn(Card, {
                  className: "border-red-300/40",
                  children: jsxDEV_7x81h0kn(CardContent, {
                    className: "pt-6",
                    children: [
                      jsxDEV_7x81h0kn("h3", {
                        className: "font-semibold mb-3 text-red-600 dark:text-red-400",
                        children: "Generic chatbot"
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn("ul", {
                        className: "space-y-2 text-sm text-muted-foreground",
                        children: [
                          jsxDEV_7x81h0kn("li", {
                            className: "flex gap-2",
                            children: [
                              jsxDEV_7x81h0kn("span", {
                                className: "text-red-500",
                                children: "✗"
                              }, undefined, false, undefined, this),
                              " LLM answers from training data — possibly outdated or wrong"
                            ]
                          }, undefined, true, undefined, this),
                          jsxDEV_7x81h0kn("li", {
                            className: "flex gap-2",
                            children: [
                              jsxDEV_7x81h0kn("span", {
                                className: "text-red-500",
                                children: "✗"
                              }, undefined, false, undefined, this),
                              " No source citations — can't verify a figure"
                            ]
                          }, undefined, true, undefined, this),
                          jsxDEV_7x81h0kn("li", {
                            className: "flex gap-2",
                            children: [
                              jsxDEV_7x81h0kn("span", {
                                className: "text-red-500",
                                children: "✗"
                              }, undefined, false, undefined, this),
                              " Hallucinates numbers when evidence is missing"
                            ]
                          }, undefined, true, undefined, this),
                          jsxDEV_7x81h0kn("li", {
                            className: "flex gap-2",
                            children: [
                              jsxDEV_7x81h0kn("span", {
                                className: "text-red-500",
                                children: "✗"
                              }, undefined, false, undefined, this),
                              " One global corpus — no per-user privacy"
                            ]
                          }, undefined, true, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                }, undefined, false, undefined, this),
                jsxDEV_7x81h0kn(Card, {
                  className: "border-emerald-400/50 bg-emerald-500/5",
                  children: jsxDEV_7x81h0kn(CardContent, {
                    className: "pt-6",
                    children: [
                      jsxDEV_7x81h0kn("h3", {
                        className: "font-semibold mb-3 text-emerald-700 dark:text-emerald-400",
                        children: "Singhal FinRAG"
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn("ul", {
                        className: "space-y-2 text-sm",
                        children: [
                          jsxDEV_7x81h0kn("li", {
                            className: "flex gap-2",
                            children: [
                              jsxDEV_7x81h0kn(CheckCircle2, {
                                className: "h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
                              }, undefined, false, undefined, this),
                              " Answers only from your uploaded documents"
                            ]
                          }, undefined, true, undefined, this),
                          jsxDEV_7x81h0kn("li", {
                            className: "flex gap-2",
                            children: [
                              jsxDEV_7x81h0kn(CheckCircle2, {
                                className: "h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
                              }, undefined, false, undefined, this),
                              " Every claim cites the exact chunk it came from"
                            ]
                          }, undefined, true, undefined, this),
                          jsxDEV_7x81h0kn("li", {
                            className: "flex gap-2",
                            children: [
                              jsxDEV_7x81h0kn(CheckCircle2, {
                                className: "h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
                              }, undefined, false, undefined, this),
                              " Says “I don't have enough information” when evidence is missing"
                            ]
                          }, undefined, true, undefined, this),
                          jsxDEV_7x81h0kn("li", {
                            className: "flex gap-2",
                            children: [
                              jsxDEV_7x81h0kn(CheckCircle2, {
                                className: "h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
                              }, undefined, false, undefined, this),
                              " Per-user ownership enforced at the database query layer"
                            ]
                          }, undefined, true, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("section", {
        className: "py-16 sm:py-20 border-t",
        children: jsxDEV_7x81h0kn("div", {
          className: "mx-auto max-w-4xl px-4",
          children: jsxDEV_7x81h0kn(motion.div, {
            initial: reduce ? {} : { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.6 },
            className: "relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-emerald-600 to-emerald-700 p-8 sm:p-12 text-center text-white shadow-2xl shadow-emerald-600/30",
            children: [
              jsxDEV_7x81h0kn("div", {
                className: "absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent_60%)]"
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn("div", {
                className: "relative",
                children: [
                  jsxDEV_7x81h0kn(BrandLogo, {
                    size: "lg",
                    className: "mx-auto mb-4 drop-shadow-lg"
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn("h2", {
                    className: "text-3xl sm:text-4xl font-bold tracking-tight",
                    children: "Start researching with evidence"
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn("p", {
                    className: "mt-3 text-white/80 max-w-xl mx-auto",
                    children: "Upload a report, ask a question, and watch the assistant cite its sources. Free, runs locally, no API keys required."
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn("div", {
                    className: "mt-6 flex flex-wrap gap-3 justify-center",
                    children: [
                      jsxDEV_7x81h0kn(Button, {
                        size: "lg",
                        variant: "secondary",
                        onClick: onRegister,
                        className: "bg-white text-emerald-700 hover:bg-white/90",
                        children: [
                          "Create your account ",
                          jsxDEV_7x81h0kn(ArrowRight, {
                            className: "h-4 w-4 ml-1.5"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      jsxDEV_7x81h0kn(Button, {
                        size: "lg",
                        variant: "outline",
                        onClick: onSignIn,
                        className: "border-white/40 text-white hover:bg-white/10 hover:text-white",
                        children: "Sign in"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("footer", {
        className: "mt-auto border-t bg-muted/20",
        children: jsxDEV_7x81h0kn("div", {
          className: "mx-auto max-w-7xl px-4 py-10",
          children: [
            jsxDEV_7x81h0kn("div", {
              className: "grid md:grid-cols-3 gap-8",
              children: [
                jsxDEV_7x81h0kn("div", {
                  children: [
                    jsxDEV_7x81h0kn(BrandWordmark, {
                      size: "md"
                    }, undefined, false, undefined, this),
                    jsxDEV_7x81h0kn("p", {
                      className: "mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed",
                      children: "A multi-user, evidence-grounded equity research workspace with a from-scratch RAG pipeline."
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                jsxDEV_7x81h0kn("div", {
                  children: [
                    jsxDEV_7x81h0kn("h4", {
                      className: "text-sm font-semibold mb-3",
                      children: "Product"
                    }, undefined, false, undefined, this),
                    jsxDEV_7x81h0kn("ul", {
                      className: "space-y-2 text-sm text-muted-foreground",
                      children: [
                        jsxDEV_7x81h0kn("li", {
                          children: jsxDEV_7x81h0kn("a", {
                            href: "#features",
                            className: "hover:text-foreground transition-colors",
                            children: "Features"
                          }, undefined, false, undefined, this)
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("li", {
                          children: jsxDEV_7x81h0kn("a", {
                            href: "#how",
                            className: "hover:text-foreground transition-colors",
                            children: "How it works"
                          }, undefined, false, undefined, this)
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("li", {
                          children: jsxDEV_7x81h0kn("a", {
                            href: "#why",
                            className: "hover:text-foreground transition-colors",
                            children: "Why FinRAG"
                          }, undefined, false, undefined, this)
                        }, undefined, false, undefined, this)
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                jsxDEV_7x81h0kn("div", {
                  children: [
                    jsxDEV_7x81h0kn("h4", {
                      className: "text-sm font-semibold mb-3",
                      children: "Crafted by"
                    }, undefined, false, undefined, this),
                    jsxDEV_7x81h0kn("div", {
                      className: "flex items-center gap-3",
                      children: [
                        jsxDEV_7x81h0kn("div", {
                          className: "h-11 w-11 rounded-full bg-gradient-to-br from-sky-500 to-emerald-600 grid place-items-center text-white font-bold text-sm shadow-md",
                          children: "SS"
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("div", {
                          children: [
                            jsxDEV_7x81h0kn("div", {
                              className: "font-semibold text-sm",
                              children: "Sanchit Singhal"
                            }, undefined, false, undefined, this),
                            jsxDEV_7x81h0kn("div", {
                              className: "text-xs text-muted-foreground",
                              children: "Full-stack engineer"
                            }, undefined, false, undefined, this),
                            jsxDEV_7x81h0kn("div", {
                              className: "flex gap-3 mt-1.5",
                              children: [
                                jsxDEV_7x81h0kn("a", {
                                  href: "#",
                                  "aria-label": "GitHub",
                                  className: "text-muted-foreground hover:text-foreground",
                                  children: jsxDEV_7x81h0kn(Github, {
                                    className: "h-3.5 w-3.5"
                                  }, undefined, false, undefined, this)
                                }, undefined, false, undefined, this),
                                jsxDEV_7x81h0kn("a", {
                                  href: "#",
                                  "aria-label": "LinkedIn",
                                  className: "text-muted-foreground hover:text-foreground",
                                  children: jsxDEV_7x81h0kn(Linkedin, {
                                    className: "h-3.5 w-3.5"
                                  }, undefined, false, undefined, this)
                                }, undefined, false, undefined, this),
                                jsxDEV_7x81h0kn("a", {
                                  href: "#",
                                  "aria-label": "Twitter",
                                  className: "text-muted-foreground hover:text-foreground",
                                  children: jsxDEV_7x81h0kn(Twitter, {
                                    className: "h-3.5 w-3.5"
                                  }, undefined, false, undefined, this)
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
            }, undefined, true, undefined, this),
            jsxDEV_7x81h0kn("div", {
              className: "mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground",
              children: [
                jsxDEV_7x81h0kn("p", {
                  children: [
                    "© ",
                    new Date().getFullYear(),
                    " Singhal FinRAG. Built by Sanchit Singhal."
                  ]
                }, undefined, true, undefined, this),
                jsxDEV_7x81h0kn("p", {
                  className: "flex items-center gap-1.5",
                  children: "Market data is web-sourced & may be delayed. Not investment advice."
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function CiteTag({ n }) {
  return jsxDEV_7x81h0kn("span", {
    className: "inline-flex items-center gap-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1 py-0.5 font-medium",
    children: [
      "[Doc ",
      n,
      "]"
    ]
  }, undefined, true, undefined, this);
}
function SectionHeading({ eyebrow, title, subtitle }) {
  return jsxDEV_7x81h0kn(motion.div, {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.5 },
    className: "text-center max-w-2xl mx-auto",
    children: [
      jsxDEV_7x81h0kn("div", {
        className: "text-xs uppercase tracking-[0.2em] text-emerald-600 font-semibold mb-2",
        children: eyebrow
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("h2", {
        className: "text-3xl sm:text-4xl font-bold tracking-tight",
        children: title
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("p", {
        className: "mt-3 text-muted-foreground leading-relaxed",
        children: subtitle
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function FeatureCard({ feature, index }) {
  const reduce = useReducedMotion();
  const Icon = feature.icon;
  return jsxDEV_7x81h0kn(motion.div, {
    initial: reduce ? {} : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.45, delay: index * 0.06 },
    children: jsxDEV_7x81h0kn(Card, {
      className: "h-full hover:shadow-lg hover:border-emerald-500/40 transition-all group",
      children: jsxDEV_7x81h0kn(CardContent, {
        className: "pt-6",
        children: [
          jsxDEV_7x81h0kn("div", {
            className: "h-11 w-11 rounded-xl bg-gradient-to-br from-sky-500/10 to-emerald-500/10 grid place-items-center mb-3 group-hover:from-sky-500/20 group-hover:to-emerald-500/20 transition-colors",
            children: jsxDEV_7x81h0kn(Icon, {
              className: "h-5 w-5 text-emerald-600"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn("h3", {
            className: "font-semibold mb-1.5",
            children: feature.title
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn("p", {
            className: "text-sm text-muted-foreground leading-relaxed",
            children: feature.desc
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}
const FEATURES = [
  { icon: FileText, title: "Document ingestion", desc: "Upload PDF/TXT/MD reports. We extract, sentence-chunk with overlap, embed, and index — with sha256 duplicate detection." },
  { icon: MessagesSquare, title: "Cited RAG answers", desc: "Ask a question, get an answer grounded only in retrieved chunks, with clickable [Doc n] citations and source snippets." },
  { icon: TrendingUp, title: "Company intelligence", desc: "Browse 20+ tickers, view real web-sourced snapshots (price, P/E, EPS, 52w range) with refresh and stale-cache fallback." },
  { icon: Sparkles, title: "AI research briefs", desc: "Generate Bull/Bear, SWOT and equity summaries grounded in the latest market snapshot, with evidence-type tags." },
  { icon: GitCompare, title: "Side-by-side compare", desc: "Compare up to 5 companies on fundamentals in one table — fetched fresh per comparison." },
  { icon: ShieldCheck, title: "Multi-user & private", desc: "Per-user ownership enforced at the database query layer. Your documents are never in another user's retrieval." }
];
const PIPELINE = [
  { icon: FileText, title: "Ingest & chunk", desc: "Extract text, split on sentence boundaries into ~1200-char chunks with 200-char overlap for context continuity.", file: "src/lib/ingest.ts" },
  { icon: Brain, title: "Embed", desc: "Each chunk becomes a TF-IDF sparse vector — a real numeric embedding, stored as JSON, zero external dependencies.", file: "src/lib/embedding.ts" },
  { icon: Search, title: "Retrieve & answer", desc: "Cosine-similarity rank over the ownership-scoped chunks, then a grounded LLM prompt with strict citation rules.", file: "src/lib/rag.ts" }
];
