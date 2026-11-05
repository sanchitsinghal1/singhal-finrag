"use client";
import { jsxDEV as jsxDEV_7x81h0kn } from "react/jsx-dev-runtime";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { fmtPrice, fmtPct, fmtCompact, timeAgo, fmtBytes } from "@/lib/format";
import { useAuth } from "@/context/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, FileText, MessagesSquare, Star, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
export function DashboardView({ go }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [docs, setDocs] = useState([]);
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [c, d, ch] = await Promise.all([
          api.get("/api/companies"),
          api.get("/api/documents?limit=5").catch(() => ({ items: [] })),
          api.get("/api/conversations?limit=5").catch(() => ({ conversations: [] }))
        ]);
        setCompanies(c.companies.slice(0, 8));
        setDocs(d.items);
        setConvs(ch.conversations);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return jsxDEV_7x81h0kn("div", {
    className: "space-y-6",
    children: [
      jsxDEV_7x81h0kn("section", {
        className: "rounded-xl border bg-gradient-to-br from-sky-600/10 via-emerald-600/5 to-background p-5 sm:p-6",
        children: jsxDEV_7x81h0kn("div", {
          className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
          children: [
            jsxDEV_7x81h0kn("div", {
              children: [
                jsxDEV_7x81h0kn("h1", {
                  className: "text-2xl font-bold tracking-tight",
                  children: user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Research Workspace"
                }, undefined, false, undefined, this),
                jsxDEV_7x81h0kn("p", {
                  className: "text-sm text-muted-foreground mt-1 max-w-xl",
                  children: "Upload financial reports, ask evidence-grounded questions, and compare companies using real retrieved context — not invented answers."
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            jsxDEV_7x81h0kn("div", {
              className: "flex flex-wrap gap-2",
              children: [
                jsxDEV_7x81h0kn(Button, {
                  onClick: () => go({ view: "documents" }),
                  className: "bg-emerald-600 hover:bg-emerald-700",
                  children: [
                    jsxDEV_7x81h0kn(FileText, {
                      className: "h-4 w-4 mr-1.5"
                    }, undefined, false, undefined, this),
                    " Upload report"
                  ]
                }, undefined, true, undefined, this),
                jsxDEV_7x81h0kn(Button, {
                  variant: "outline",
                  onClick: () => go({ view: "research" }),
                  children: [
                    jsxDEV_7x81h0kn(MessagesSquare, {
                      className: "h-4 w-4 mr-1.5"
                    }, undefined, false, undefined, this),
                    " Ask research"
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      error && jsxDEV_7x81h0kn(Card, {
        className: "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900",
        children: jsxDEV_7x81h0kn(CardContent, {
          className: "py-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-300",
          children: [
            jsxDEV_7x81h0kn(AlertTriangle, {
              className: "h-4 w-4"
            }, undefined, false, undefined, this),
            " ",
            error
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("section", {
        children: [
          jsxDEV_7x81h0kn("div", {
            className: "flex items-center justify-between mb-3",
            children: [
              jsxDEV_7x81h0kn("h2", {
                className: "text-lg font-semibold flex items-center gap-2",
                children: [
                  jsxDEV_7x81h0kn(TrendingUp, {
                    className: "h-5 w-5 text-emerald-600"
                  }, undefined, false, undefined, this),
                  " Market overview"
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn(Button, {
                variant: "ghost",
                size: "sm",
                onClick: () => go({ view: "companies" }),
                children: [
                  "Browse all ",
                  jsxDEV_7x81h0kn(ArrowUpRight, {
                    className: "h-4 w-4"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn("div", {
            className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",
            children: loading ? Array.from({ length: 8 }).map((_, i) => jsxDEV_7x81h0kn(Skeleton, {
              className: "h-28 rounded-xl"
            }, i, false, undefined, this)) : companies.map((c) => {
              const snap = c.snapshots?.[0];
              return jsxDEV_7x81h0kn("button", {
                onClick: () => go({ view: "companies", companyId: c.id, companySymbol: c.symbol }),
                className: "text-left",
                children: jsxDEV_7x81h0kn(Card, {
                  className: "hover:border-emerald-500/60 hover:shadow-md transition-all h-full",
                  children: jsxDEV_7x81h0kn(CardContent, {
                    className: "p-4",
                    children: [
                      jsxDEV_7x81h0kn("div", {
                        className: "flex items-start justify-between gap-2",
                        children: [
                          jsxDEV_7x81h0kn("div", {
                            className: "min-w-0",
                            children: [
                              jsxDEV_7x81h0kn("div", {
                                className: "font-semibold truncate",
                                children: c.symbol
                              }, undefined, false, undefined, this),
                              jsxDEV_7x81h0kn("div", {
                                className: "text-xs text-muted-foreground truncate",
                                children: c.name
                              }, undefined, false, undefined, this)
                            ]
                          }, undefined, true, undefined, this),
                          snap ? jsxDEV_7x81h0kn(Badge, {
                            variant: "outline",
                            className: "text-[10px] shrink-0",
                            children: snap.changePercent != null ? snap.changePercent >= 0 ? "▲" : "▼" : "•"
                          }, undefined, false, undefined, this) : null
                        ]
                      }, undefined, true, undefined, this),
                      jsxDEV_7x81h0kn("div", {
                        className: "mt-3 flex items-end justify-between",
                        children: [
                          jsxDEV_7x81h0kn("div", {
                            className: "text-lg font-bold",
                            children: snap?.price ? fmtPrice(snap.price, c.symbol.endsWith(".NS") ? "INR" : "USD") : "—"
                          }, undefined, false, undefined, this),
                          snap?.changePercent != null && (() => {
                            const p = fmtPct(snap.changePercent);
                            return jsxDEV_7x81h0kn("span", {
                              className: `text-xs font-medium ${p.className}`,
                              children: p.text
                            }, undefined, false, undefined, this);
                          })()
                        ]
                      }, undefined, true, undefined, this),
                      jsxDEV_7x81h0kn("div", {
                        className: "text-[10px] text-muted-foreground mt-1",
                        children: snap?.fetchedAt ? timeAgo(snap.fetchedAt) : "no data yet"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                }, undefined, false, undefined, this)
              }, c.id, false, undefined, this);
            })
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      jsxDEV_7x81h0kn("section", {
        className: "grid grid-cols-1 lg:grid-cols-2 gap-4",
        children: [
          jsxDEV_7x81h0kn(Card, {
            children: [
              jsxDEV_7x81h0kn(CardHeader, {
                className: "pb-3",
                children: [
                  jsxDEV_7x81h0kn("div", {
                    className: "flex items-center justify-between",
                    children: [
                      jsxDEV_7x81h0kn(CardTitle, {
                        className: "text-base flex items-center gap-2",
                        children: [
                          jsxDEV_7x81h0kn(FileText, {
                            className: "h-4 w-4"
                          }, undefined, false, undefined, this),
                          " Recent documents"
                        ]
                      }, undefined, true, undefined, this),
                      jsxDEV_7x81h0kn(Button, {
                        variant: "ghost",
                        size: "sm",
                        onClick: () => go({ view: "documents" }),
                        children: "Open library"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  jsxDEV_7x81h0kn(CardDescription, {
                    children: "Latest uploaded reports and processing status."
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn(CardContent, {
                className: "space-y-2",
                children: loading ? jsxDEV_7x81h0kn(Skeleton, {
                  className: "h-16"
                }, undefined, false, undefined, this) : docs.length === 0 ? jsxDEV_7x81h0kn(EmptyRow, {
                  text: "No documents yet. Upload a PDF or text report to start.",
                  actionLabel: "Upload",
                  onAction: () => go({ view: "documents" })
                }, undefined, false, undefined, this) : docs.map((d) => jsxDEV_7x81h0kn("div", {
                  className: "flex items-center justify-between gap-2 py-2 border-b last:border-0",
                  children: [
                    jsxDEV_7x81h0kn("div", {
                      className: "min-w-0",
                      children: [
                        jsxDEV_7x81h0kn("div", {
                          className: "text-sm font-medium truncate",
                          children: d.originalName
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("div", {
                          className: "text-xs text-muted-foreground",
                          children: [
                            fmtBytes(d.size),
                            " · ",
                            d.chunkCount,
                            " chunks"
                          ]
                        }, undefined, true, undefined, this)
                      ]
                    }, undefined, true, undefined, this),
                    jsxDEV_7x81h0kn(StatusBadge, {
                      status: d.status
                    }, undefined, false, undefined, this)
                  ]
                }, d.id, true, undefined, this))
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn(Card, {
            children: [
              jsxDEV_7x81h0kn(CardHeader, {
                className: "pb-3",
                children: [
                  jsxDEV_7x81h0kn("div", {
                    className: "flex items-center justify-between",
                    children: [
                      jsxDEV_7x81h0kn(CardTitle, {
                        className: "text-base flex items-center gap-2",
                        children: [
                          jsxDEV_7x81h0kn(MessagesSquare, {
                            className: "h-4 w-4"
                          }, undefined, false, undefined, this),
                          " Recent research"
                        ]
                      }, undefined, true, undefined, this),
                      jsxDEV_7x81h0kn(Button, {
                        variant: "ghost",
                        size: "sm",
                        onClick: () => go({ view: "research" }),
                        children: "Open chat"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  jsxDEV_7x81h0kn(CardDescription, {
                    children: "Your latest RAG conversations."
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn(CardContent, {
                className: "space-y-2",
                children: loading ? jsxDEV_7x81h0kn(Skeleton, {
                  className: "h-16"
                }, undefined, false, undefined, this) : convs.length === 0 ? jsxDEV_7x81h0kn(EmptyRow, {
                  text: "No conversations yet. Ask your first research question.",
                  actionLabel: "Start",
                  onAction: () => go({ view: "research" })
                }, undefined, false, undefined, this) : convs.map((c) => jsxDEV_7x81h0kn("button", {
                  onClick: () => go({ view: "research", conversationId: c.id }),
                  className: "w-full text-left flex items-center justify-between gap-2 py-2 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors",
                  children: [
                    jsxDEV_7x81h0kn("div", {
                      className: "min-w-0",
                      children: [
                        jsxDEV_7x81h0kn("div", {
                          className: "text-sm font-medium truncate",
                          children: c.title
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("div", {
                          className: "text-xs text-muted-foreground truncate",
                          children: c.lastMessage || "No messages yet"
                        }, undefined, false, undefined, this)
                      ]
                    }, undefined, true, undefined, this),
                    jsxDEV_7x81h0kn("span", {
                      className: "text-xs text-muted-foreground shrink-0",
                      children: timeAgo(c.lastMessageAt || c.updatedAt)
                    }, undefined, false, undefined, this)
                  ]
                }, c.id, true, undefined, this))
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function StatusBadge({ status }) {
  const map = {
    ready: { label: "Ready", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
    processing: { label: "Processing", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
    pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
    failed: { label: "Failed", cls: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" }
  };
  const s = map[status] ?? map.pending;
  return jsxDEV_7x81h0kn("span", {
    className: `text-[10px] px-1.5 py-0.5 rounded font-medium ${s.cls}`,
    children: s.label
  }, undefined, false, undefined, this);
}
function EmptyRow({ text, actionLabel, onAction }) {
  return jsxDEV_7x81h0kn("div", {
    className: "flex items-center justify-between gap-3 py-3",
    children: [
      jsxDEV_7x81h0kn("p", {
        className: "text-sm text-muted-foreground",
        children: text
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn(Button, {
        size: "sm",
        variant: "outline",
        onClick: onAction,
        children: actionLabel
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
