"use client";
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { fmtPrice, fmtPct, fmtCompact, timeAgo } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowLeft, RefreshCw, Loader2, Building2, Star, GitCompare, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts";
export function CompaniesView({ go, nav }) {
  if (nav.companyId) {
    return jsxDEV_7x81h0kn(CompanyDetail, {
      go,
      companyId: nav.companyId,
      symbol: nav.companySymbol
    }, undefined, false, undefined, this);
  }
  return jsxDEV_7x81h0kn(CompanyList, {
    go
  }, undefined, false, undefined, this);
}
function CompanyList({ go }) {
  const [q, setQ] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const load = useCallback(async (query) => {
    setLoading(true);
    try {
      const data = await api.get(`/api/companies${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      setCompanies(data.companies);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load("");
  }, [load]);
  const onSearch = (e) => {
    e.preventDefault();
    load(q);
  };
  const resolveTicker = async () => {
    if (!q.trim())
      return;
    setSearching(true);
    try {
      const c = await api.post("/api/companies", { symbol: q.trim() });
      go({ view: "companies", companyId: c.id, companySymbol: c.symbol });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSearching(false);
    }
  };
  return jsxDEV_7x81h0kn("div", {
    className: "space-y-5",
    children: [
      jsxDEV_7x81h0kn("div", {
        children: [
          jsxDEV_7x81h0kn("h1", {
            className: "text-2xl font-bold tracking-tight",
            children: "Companies"
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn("p", {
            className: "text-sm text-muted-foreground mt-1",
            children: "Browse the directory or resolve any ticker symbol."
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      jsxDEV_7x81h0kn("form", {
        onSubmit: onSearch,
        className: "flex gap-2",
        children: [
          jsxDEV_7x81h0kn("div", {
            className: "relative flex-1",
            children: [
              jsxDEV_7x81h0kn(Search, {
                className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn(Input, {
                value: q,
                onChange: (e) => setQ(e.target.value),
                placeholder: "Search by name or symbol (e.g. Apple, AAPL, RELIANCE)",
                className: "pl-9"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn(Button, {
            type: "submit",
            variant: "outline",
            children: "Search"
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn(Button, {
            type: "button",
            onClick: resolveTicker,
            disabled: searching,
            className: "bg-emerald-600 hover:bg-emerald-700",
            children: [
              searching ? jsxDEV_7x81h0kn(Loader2, {
                className: "h-4 w-4 mr-1.5 animate-spin"
              }, undefined, false, undefined, this) : null,
              "Resolve ticker"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      loading ? jsxDEV_7x81h0kn("div", {
        className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
        children: Array.from({ length: 9 }).map((_, i) => jsxDEV_7x81h0kn(Skeleton, {
          className: "h-28 rounded-xl"
        }, i, false, undefined, this))
      }, undefined, false, undefined, this) : companies.length === 0 ? jsxDEV_7x81h0kn(Card, {
        children: jsxDEV_7x81h0kn(CardContent, {
          className: "py-10 text-center text-sm text-muted-foreground",
          children: [
            "No companies match “",
            q,
            "”. Try resolving the ticker directly."
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this) : jsxDEV_7x81h0kn("div", {
        className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
        children: companies.map((c) => {
          const snap = c.snapshots?.[0];
          const inr = c.symbol.endsWith(".NS");
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
                    children: jsxDEV_7x81h0kn("div", {
                      className: "min-w-0",
                      children: [
                        jsxDEV_7x81h0kn("div", {
                          className: "flex items-center gap-2",
                          children: [
                            jsxDEV_7x81h0kn("span", {
                              className: "font-semibold",
                              children: c.symbol
                            }, undefined, false, undefined, this),
                            c.exchange && jsxDEV_7x81h0kn(Badge, {
                              variant: "outline",
                              className: "text-[10px]",
                              children: c.exchange
                            }, undefined, false, undefined, this)
                          ]
                        }, undefined, true, undefined, this),
                        jsxDEV_7x81h0kn("div", {
                          className: "text-xs text-muted-foreground truncate",
                          children: c.name
                        }, undefined, false, undefined, this),
                        c.sector && jsxDEV_7x81h0kn("div", {
                          className: "text-[11px] text-muted-foreground mt-1",
                          children: c.sector
                        }, undefined, false, undefined, this)
                      ]
                    }, undefined, true, undefined, this)
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn("div", {
                    className: "mt-3 flex items-end justify-between",
                    children: [
                      jsxDEV_7x81h0kn("div", {
                        className: "text-lg font-bold",
                        children: snap?.price ? fmtPrice(snap.price, inr ? "INR" : "USD") : "—"
                      }, undefined, false, undefined, this),
                      snap?.changePercent != null && (() => {
                        const p = fmtPct(snap.changePercent);
                        return jsxDEV_7x81h0kn("span", {
                          className: `text-xs font-medium ${p.className}`,
                          children: p.text
                        }, undefined, false, undefined, this);
                      })()
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this)
          }, c.id, false, undefined, this);
        })
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function CompanyDetail({ go, companyId, symbol }) {
  const [company, setCompany] = useState(null);
  const [snap, setSnap] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const detail = await api.get(`/api/companies/${encodeURIComponent(companyId)}`);
      setCompany(detail.company);
      setSnap(detail.snapshot);
      const m = await api.get(`/api/market/${encodeURIComponent(companyId)}${force ? "?force=1" : ""}`);
      setSnap(m.snapshot ?? detail.snapshot);
      setHistory(m.history ?? []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);
  useEffect(() => {
    load(false);
  }, [load]);
  const refresh = async () => {
    setRefreshing(true);
    try {
      const m = await api.get(`/api/market/${encodeURIComponent(companyId)}?force=1`);
      setSnap(m.snapshot);
      setHistory(m.history ?? []);
      toast.success("Market data refreshed");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRefreshing(false);
    }
  };
  if (loading)
    return jsxDEV_7x81h0kn("div", {
      className: "space-y-3",
      children: [
        jsxDEV_7x81h0kn(Skeleton, {
          className: "h-10 w-1/3"
        }, undefined, false, undefined, this),
        jsxDEV_7x81h0kn(Skeleton, {
          className: "h-64"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  const inr = (symbol ?? company?.symbol ?? "").endsWith(".NS");
  return jsxDEV_7x81h0kn("div", {
    className: "space-y-5",
    children: [
      jsxDEV_7x81h0kn("div", {
        className: "flex items-center justify-between gap-3 flex-wrap",
        children: [
          jsxDEV_7x81h0kn("div", {
            className: "flex items-center gap-3",
            children: [
              jsxDEV_7x81h0kn(Button, {
                variant: "ghost",
                size: "sm",
                onClick: () => go({ view: "companies" }),
                children: [
                  jsxDEV_7x81h0kn(ArrowLeft, {
                    className: "h-4 w-4 mr-1"
                  }, undefined, false, undefined, this),
                  " Back"
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn("div", {
                children: [
                  jsxDEV_7x81h0kn("div", {
                    className: "flex items-center gap-2 flex-wrap",
                    children: [
                      jsxDEV_7x81h0kn("h1", {
                        className: "text-2xl font-bold tracking-tight",
                        children: company?.name
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn(Badge, {
                        variant: "outline",
                        children: company?.symbol
                      }, undefined, false, undefined, this),
                      company?.exchange && jsxDEV_7x81h0kn(Badge, {
                        variant: "secondary",
                        className: "text-xs",
                        children: company.exchange
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  jsxDEV_7x81h0kn("p", {
                    className: "text-xs text-muted-foreground mt-0.5",
                    children: [company?.sector, company?.industry].filter(Boolean).join(" · ") || "Sector data unavailable"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn("div", {
            className: "flex gap-2",
            children: [
              jsxDEV_7x81h0kn(Button, {
                variant: "outline",
                size: "sm",
                onClick: () => go({ view: "analysis" }),
                children: [
                  jsxDEV_7x81h0kn(GitCompare, {
                    className: "h-4 w-4 mr-1"
                  }, undefined, false, undefined, this),
                  " Compare"
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn(Button, {
                variant: "outline",
                size: "sm",
                onClick: refresh,
                disabled: refreshing,
                children: [
                  refreshing ? jsxDEV_7x81h0kn(Loader2, {
                    className: "h-4 w-4 mr-1 animate-spin"
                  }, undefined, false, undefined, this) : jsxDEV_7x81h0kn(RefreshCw, {
                    className: "h-4 w-4 mr-1"
                  }, undefined, false, undefined, this),
                  " Refresh"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      snap?.stale && jsxDEV_7x81h0kn("div", {
        className: "rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-200",
        children: [
          "Showing cached data from ",
          timeAgo(snap.fetchedAt),
          " (refresh failed or rate-limited). Click Refresh to retry."
        ]
      }, undefined, true, undefined, this),
      jsxDEV_7x81h0kn("div", {
        className: "grid grid-cols-1 lg:grid-cols-3 gap-4",
        children: [
          jsxDEV_7x81h0kn(Card, {
            className: "lg:col-span-2",
            children: [
              jsxDEV_7x81h0kn(CardHeader, {
                className: "pb-2",
                children: jsxDEV_7x81h0kn("div", {
                  className: "flex items-end justify-between",
                  children: [
                    jsxDEV_7x81h0kn("div", {
                      children: [
                        jsxDEV_7x81h0kn(CardTitle, {
                          className: "text-sm font-medium text-muted-foreground",
                          children: "Price"
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("div", {
                          className: "text-3xl font-bold mt-1",
                          children: snap?.price ? fmtPrice(snap.price, inr ? "INR" : "USD") : "—"
                        }, undefined, false, undefined, this)
                      ]
                    }, undefined, true, undefined, this),
                    snap?.changePercent != null && (() => {
                      const p = fmtPct(snap.changePercent);
                      return jsxDEV_7x81h0kn("span", {
                        className: `text-sm font-medium ${p.className}`,
                        children: p.text
                      }, undefined, false, undefined, this);
                    })()
                  ]
                }, undefined, true, undefined, this)
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn(CardContent, {
                children: [
                  history.length >= 2 ? jsxDEV_7x81h0kn("div", {
                    className: "h-64",
                    children: jsxDEV_7x81h0kn(ResponsiveContainer, {
                      width: "100%",
                      height: "100%",
                      children: jsxDEV_7x81h0kn(AreaChart, {
                        data: history,
                        margin: { top: 5, right: 5, left: 0, bottom: 5 },
                        children: [
                          jsxDEV_7x81h0kn("defs", {
                            children: jsxDEV_7x81h0kn("linearGradient", {
                              id: "px",
                              x1: "0",
                              y1: "0",
                              x2: "0",
                              y2: "1",
                              children: [
                                jsxDEV_7x81h0kn("stop", {
                                  offset: "0%",
                                  stopColor: "#10b981",
                                  stopOpacity: 0.35
                                }, undefined, false, undefined, this),
                                jsxDEV_7x81h0kn("stop", {
                                  offset: "100%",
                                  stopColor: "#10b981",
                                  stopOpacity: 0
                                }, undefined, false, undefined, this)
                              ]
                            }, undefined, true, undefined, this)
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn(CartesianGrid, {
                            strokeDasharray: "3 3",
                            stroke: "hsl(var(--border))",
                            opacity: 0.4
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn(XAxis, {
                            dataKey: "date",
                            tickFormatter: (d) => new Date(d).toLocaleDateString(),
                            tick: { fontSize: 10 },
                            tickLine: false,
                            axisLine: false,
                            minTickGap: 30
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn(YAxis, {
                            tick: { fontSize: 10 },
                            tickLine: false,
                            axisLine: false,
                            domain: ["auto", "auto"],
                            width: 48,
                            tickFormatter: (v) => fmtPrice(v, inr ? "INR" : "USD")
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn(Tooltip, {
                            labelFormatter: (d) => new Date(d).toLocaleString(),
                            contentStyle: { borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 },
                            formatter: (v) => [fmtPrice(v, inr ? "INR" : "USD"), "Price"]
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn(Area, {
                            type: "monotone",
                            dataKey: "close",
                            stroke: "#10b981",
                            strokeWidth: 2,
                            fill: "url(#px)"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    }, undefined, false, undefined, this)
                  }, undefined, false, undefined, this) : jsxDEV_7x81h0kn("div", {
                    className: "h-64 grid place-items-center text-center px-6",
                    children: jsxDEV_7x81h0kn("div", {
                      className: "space-y-1.5",
                      children: [
                        jsxDEV_7x81h0kn(TrendingUp, {
                          className: "h-6 w-6 mx-auto text-muted-foreground/60"
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("p", {
                          className: "text-sm text-muted-foreground",
                          children: "Price history builds as you refresh."
                        }, undefined, false, undefined, this),
                        jsxDEV_7x81h0kn("p", {
                          className: "text-xs text-muted-foreground/80",
                          children: [
                            "Each refresh appends a real data point. Click ",
                            jsxDEV_7x81h0kn("span", {
                              className: "font-medium text-foreground",
                              children: "Refresh"
                            }, undefined, false, undefined, this),
                            " a few times to grow the chart."
                          ]
                        }, undefined, true, undefined, this)
                      ]
                    }, undefined, true, undefined, this)
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn("p", {
                    className: "text-[10px] text-muted-foreground mt-2",
                    children: snap ? `Source: ${snap.source} · fetched ${timeAgo(snap.fetchedAt)}${history.length >= 2 ? ` · ${history.length} real data points` : ""}` : "No snapshot yet."
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn(Card, {
            children: [
              jsxDEV_7x81h0kn(CardHeader, {
                className: "pb-2",
                children: jsxDEV_7x81h0kn(CardTitle, {
                  className: "text-base",
                  children: "Fundamentals"
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn(CardContent, {
                className: "grid grid-cols-2 gap-y-3 gap-x-2 text-sm",
                children: [
                  jsxDEV_7x81h0kn(Metric, {
                    label: "Market cap",
                    value: snap?.marketCap ? fmtCompact(snap.marketCap, inr ? "INR" : "USD") : "—"
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn(Metric, {
                    label: "P/E ratio",
                    value: snap?.peRatio != null ? snap.peRatio.toFixed(2) : "—"
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn(Metric, {
                    label: "EPS",
                    value: snap?.eps != null ? fmtPrice(snap.eps, inr ? "INR" : "USD") : "—"
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn(Metric, {
                    label: "52w high",
                    value: snap?.week52High != null ? fmtPrice(snap.week52High, inr ? "INR" : "USD") : "—"
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn(Metric, {
                    label: "52w low",
                    value: snap?.week52Low != null ? fmtPrice(snap.week52Low, inr ? "INR" : "USD") : "—"
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn(Metric, {
                    label: "1d change",
                    value: fmtPct(snap?.changePercent).text,
                    className: fmtPct(snap?.changePercent).className
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      snap?.summary && jsxDEV_7x81h0kn(Card, {
        children: [
          jsxDEV_7x81h0kn(CardHeader, {
            className: "pb-2",
            children: jsxDEV_7x81h0kn(CardTitle, {
              className: "text-base",
              children: "Snapshot summary"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn(CardContent, {
            children: jsxDEV_7x81h0kn("p", {
              className: "text-sm text-muted-foreground leading-relaxed",
              children: snap.summary
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      jsxDEV_7x81h0kn(Card, {
        children: jsxDEV_7x81h0kn(CardContent, {
          className: "py-4 flex flex-wrap gap-2",
          children: [
            jsxDEV_7x81h0kn(Button, {
              onClick: () => go({ view: "research", conversationId: undefined }),
              variant: "outline",
              children: [
                "Ask research about ",
                company?.symbol
              ]
            }, undefined, true, undefined, this),
            jsxDEV_7x81h0kn(Button, {
              onClick: () => go({ view: "watchlists" }),
              variant: "outline",
              children: [
                jsxDEV_7x81h0kn(Star, {
                  className: "h-4 w-4 mr-1"
                }, undefined, false, undefined, this),
                " Add to watchlist"
              ]
            }, undefined, true, undefined, this),
            jsxDEV_7x81h0kn(Button, {
              onClick: () => go({ view: "documents" }),
              variant: "outline",
              children: [
                jsxDEV_7x81h0kn(Building2, {
                  className: "h-4 w-4 mr-1"
                }, undefined, false, undefined, this),
                " Upload report for ",
                company?.symbol
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function Metric({ label, value, className }) {
  return jsxDEV_7x81h0kn("div", {
    children: [
      jsxDEV_7x81h0kn("div", {
        className: "text-[11px] text-muted-foreground",
        children: label
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("div", {
        className: `font-semibold ${className ?? ""}`,
        children: value
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
