"use client";
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { fmtPrice, fmtPct, fmtCompact, timeAgo } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GitCompare, Loader2, Sparkles, Plus, X, ClipboardCopy, FileDown } from "lucide-react";
export function AnalysisView({ go }) {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState([]);
  const [picker, setPicker] = useState("__none__");
  const [comparing, setComparing] = useState(false);
  const [rows, setRows] = useState([]);
  const [briefCompany, setBriefCompany] = useState("__none__");
  const [briefKind, setBriefKind] = useState("bull_bear");
  const [brief, setBrief] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const d = await api.get("/api/companies");
        setCompanies(d.companies);
      } catch (err) {
        toast.error(err.message);
      }
    })();
  }, []);
  const addCompany = (id) => {
    if (id === "__none__")
      return;
    setSelected((s) => s.includes(id) || s.length >= 5 ? s : [...s, id]);
    setPicker("__none__");
  };
  const compare = async () => {
    if (selected.length === 0) {
      toast.error("Pick at least one company.");
      return;
    }
    setComparing(true);
    setRows([]);
    try {
      const res = await api.post("/api/analysis/compare", { companyIds: selected });
      setRows(res.rows);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setComparing(false);
    }
  };
  const generate = async () => {
    if (briefCompany === "__none__") {
      toast.error("Pick a company.");
      return;
    }
    setGenLoading(true);
    setBrief(null);
    try {
      const res = await api.post("/api/analysis/generate", { kind: briefKind, companyId: briefCompany });
      setBrief(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenLoading(false);
    }
  };
  const selectedCompanies = companies.filter((c) => selected.includes(c.id));
  return jsxDEV_7x81h0kn("div", {
    className: "space-y-5",
    children: [
      jsxDEV_7x81h0kn("div", {
        children: [
          jsxDEV_7x81h0kn("h1", {
            className: "text-2xl font-bold tracking-tight",
            children: "Analysis"
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn("p", {
            className: "text-sm text-muted-foreground mt-1",
            children: "Compare fundamentals across companies and generate evidence-grounded research briefs."
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      jsxDEV_7x81h0kn(Card, {
        children: [
          jsxDEV_7x81h0kn(CardHeader, {
            className: "pb-3",
            children: [
              jsxDEV_7x81h0kn(CardTitle, {
                className: "text-base flex items-center gap-2",
                children: [
                  jsxDEV_7x81h0kn(GitCompare, {
                    className: "h-4 w-4"
                  }, undefined, false, undefined, this),
                  " Compare companies"
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn(CardDescription, {
                children: "Select up to 5. Snapshots are fetched fresh per compare."
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn(CardContent, {
            className: "space-y-3",
            children: [
              jsxDEV_7x81h0kn("div", {
                className: "flex flex-wrap gap-2",
                children: [
                  selectedCompanies.map((c) => jsxDEV_7x81h0kn(Badge, {
                    variant: "secondary",
                    className: "gap-1 pr-1",
                    children: [
                      c.symbol,
                      jsxDEV_7x81h0kn("button", {
                        onClick: () => setSelected((s) => s.filter((x) => x !== c.id)),
                        className: "hover:text-red-500",
                        children: jsxDEV_7x81h0kn(X, {
                          className: "h-3 w-3"
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this)
                    ]
                  }, c.id, true, undefined, this)),
                  selected.length === 0 && jsxDEV_7x81h0kn("span", {
                    className: "text-xs text-muted-foreground",
                    children: "No companies selected yet."
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn("div", {
                className: "flex flex-wrap gap-2",
                children: [
                  jsxDEV_7x81h0kn(Select, {
                    value: picker,
                    onValueChange: addCompany,
                    children: [
                      jsxDEV_7x81h0kn(SelectTrigger, {
                        className: "w-[240px] h-9",
                        children: jsxDEV_7x81h0kn(SelectValue, {
                          placeholder: "Add a company"
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn(SelectContent, {
                        children: companies.filter((c) => !selected.includes(c.id)).map((c) => jsxDEV_7x81h0kn(SelectItem, {
                          value: c.id,
                          children: [
                            c.symbol,
                            " · ",
                            c.name
                          ]
                        }, c.id, true, undefined, this))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  jsxDEV_7x81h0kn(Button, {
                    onClick: compare,
                    disabled: comparing || selected.length === 0,
                    className: "bg-emerald-600 hover:bg-emerald-700",
                    children: [
                      comparing ? jsxDEV_7x81h0kn(Loader2, {
                        className: "h-4 w-4 mr-1 animate-spin"
                      }, undefined, false, undefined, this) : jsxDEV_7x81h0kn(GitCompare, {
                        className: "h-4 w-4 mr-1"
                      }, undefined, false, undefined, this),
                      " Compare"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              rows.length > 0 && jsxDEV_7x81h0kn("div", {
                className: "overflow-x-auto mt-2",
                children: jsxDEV_7x81h0kn("table", {
                  className: "w-full text-sm border-collapse",
                  children: [
                    jsxDEV_7x81h0kn("thead", {
                      children: jsxDEV_7x81h0kn("tr", {
                        className: "bg-muted/50",
                        children: [
                          jsxDEV_7x81h0kn("th", {
                            className: "text-left font-medium px-3 py-2",
                            children: "Metric"
                          }, undefined, false, undefined, this),
                          rows.map((r) => jsxDEV_7x81h0kn("th", {
                            className: "text-right font-medium px-3 py-2",
                            children: jsxDEV_7x81h0kn("button", {
                              onClick: () => go({ view: "companies", companyId: r.company.id, companySymbol: r.company.symbol }),
                              className: "hover:underline",
                              children: r.company.symbol
                            }, undefined, false, undefined, this)
                          }, r.company.id, false, undefined, this))
                        ]
                      }, undefined, true, undefined, this)
                    }, undefined, false, undefined, this),
                    jsxDEV_7x81h0kn("tbody", {
                      children: [
                        renderCompareRow("Sector", rows, (r) => r.company.sector || "—"),
                        renderCompareRow("Price", rows, (r, inr) => fmtPrice(r.snapshot?.price, inr ? "INR" : "USD"), true),
                        renderCompareRow("1d %", rows, (r) => fmtPct(r.snapshot?.changePercent).text, true, rows.map((r) => fmtPct(r.snapshot?.changePercent).className)),
                        renderCompareRow("Market cap", rows, (r, inr) => fmtCompact(r.snapshot?.marketCap, inr ? "INR" : "USD"), true),
                        renderCompareRow("P/E", rows, (r) => r.snapshot?.peRatio != null ? r.snapshot.peRatio.toFixed(2) : "—", true),
                        renderCompareRow("EPS", rows, (r, inr) => fmtPrice(r.snapshot?.eps, inr ? "INR" : "USD"), true),
                        renderCompareRow("52w high", rows, (r, inr) => fmtPrice(r.snapshot?.week52High, inr ? "INR" : "USD"), true),
                        renderCompareRow("52w low", rows, (r, inr) => fmtPrice(r.snapshot?.week52Low, inr ? "INR" : "USD"), true),
                        renderCompareRow("Updated", rows, (r) => r.snapshot?.fetchedAt ? timeAgo(r.snapshot.fetchedAt) : "—", true)
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      jsxDEV_7x81h0kn(Card, {
        children: [
          jsxDEV_7x81h0kn(CardHeader, {
            className: "pb-3",
            children: [
              jsxDEV_7x81h0kn(CardTitle, {
                className: "text-base flex items-center gap-2",
                children: [
                  jsxDEV_7x81h0kn(Sparkles, {
                    className: "h-4 w-4 text-emerald-600"
                  }, undefined, false, undefined, this),
                  " Generate research brief"
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn(CardDescription, {
                children: "Grounded in the company's latest market snapshot (and a list of your uploaded documents, if any)."
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn(CardContent, {
            className: "space-y-3",
            children: [
              jsxDEV_7x81h0kn("div", {
                className: "flex flex-wrap gap-2",
                children: [
                  jsxDEV_7x81h0kn(Select, {
                    value: briefCompany,
                    onValueChange: setBriefCompany,
                    children: [
                      jsxDEV_7x81h0kn(SelectTrigger, {
                        className: "w-[240px] h-9",
                        children: jsxDEV_7x81h0kn(SelectValue, {
                          placeholder: "Pick a company"
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn(SelectContent, {
                        children: companies.map((c) => jsxDEV_7x81h0kn(SelectItem, {
                          value: c.id,
                          children: [
                            c.symbol,
                            " · ",
                            c.name
                          ]
                        }, c.id, true, undefined, this))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  jsxDEV_7x81h0kn(Select, {
                    value: briefKind,
                    onValueChange: (v) => setBriefKind(v),
                    children: [
                      jsxDEV_7x81h0kn(SelectTrigger, {
                        className: "w-[200px] h-9",
                        children: jsxDEV_7x81h0kn(SelectValue, {}, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn(SelectContent, {
                        children: [
                          jsxDEV_7x81h0kn(SelectItem, {
                            value: "bull_bear",
                            children: "Bull / Bear case"
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn(SelectItem, {
                            value: "swot",
                            children: "SWOT analysis"
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn(SelectItem, {
                            value: "summary",
                            children: "Equity summary"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  jsxDEV_7x81h0kn(Button, {
                    onClick: generate,
                    disabled: genLoading || briefCompany === "__none__",
                    className: "bg-emerald-600 hover:bg-emerald-700",
                    children: [
                      genLoading ? jsxDEV_7x81h0kn(Loader2, {
                        className: "h-4 w-4 mr-1 animate-spin"
                      }, undefined, false, undefined, this) : jsxDEV_7x81h0kn(Sparkles, {
                        className: "h-4 w-4 mr-1"
                      }, undefined, false, undefined, this),
                      " Generate"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              genLoading && jsxDEV_7x81h0kn(Skeleton, {
                className: "h-64"
              }, undefined, false, undefined, this),
              brief && jsxDEV_7x81h0kn("div", {
                className: "border rounded-md p-4 space-y-3",
                children: [
                  jsxDEV_7x81h0kn("div", {
                    className: "flex items-center justify-between gap-2 flex-wrap",
                    children: [
                      jsxDEV_7x81h0kn("div", {
                        className: "flex items-center gap-2",
                        children: [
                          jsxDEV_7x81h0kn(Badge, {
                            variant: "outline",
                            className: "text-[10px] uppercase",
                            children: brief.kind.replace("_", " ")
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn("span", {
                            className: "text-sm font-medium",
                            children: brief.symbol
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      jsxDEV_7x81h0kn("div", {
                        className: "flex gap-1",
                        children: [
                          jsxDEV_7x81h0kn(Button, {
                            size: "sm",
                            variant: "ghost",
                            onClick: () => {
                              navigator.clipboard?.writeText(brief.content);
                              toast.success("Copied");
                            },
                            children: [
                              jsxDEV_7x81h0kn(ClipboardCopy, {
                                className: "h-3.5 w-3.5 mr-1"
                              }, undefined, false, undefined, this),
                              " Copy"
                            ]
                          }, undefined, true, undefined, this),
                          jsxDEV_7x81h0kn(Button, {
                            size: "sm",
                            variant: "ghost",
                            onClick: () => downloadBrief(brief),
                            children: [
                              jsxDEV_7x81h0kn(FileDown, {
                                className: "h-3.5 w-3.5 mr-1"
                              }, undefined, false, undefined, this),
                              " Export .md"
                            ]
                          }, undefined, true, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  jsxDEV_7x81h0kn("div", {
                    className: "prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed",
                    children: brief.content
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn("div", {
                    className: "pt-2 border-t text-[11px] text-muted-foreground",
                    children: [
                      "Grounded on: ",
                      brief.groundedOn.market ? "market snapshot" : "no market data",
                      brief.groundedOn.documents > 0 ? ` · ${brief.groundedOn.documents} uploaded doc(s): ${brief.groundedOn.documentNames.join(", ")}` : " · no uploaded documents",
                      brief.groundedOn.snapshotFetchedAt && ` · snapshot @ ${timeAgo(brief.groundedOn.snapshotFetchedAt)}`
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
function renderCompareRow(label, rows, fn, right = false, cellClasses) {
  return jsxDEV_7x81h0kn("tr", {
    className: "border-b last:border-0",
    children: [
      jsxDEV_7x81h0kn("td", {
        className: "px-3 py-2 text-muted-foreground",
        children: label
      }, undefined, false, undefined, this),
      rows.map((r, i) => {
        const inr = r.company.symbol.endsWith(".NS");
        return jsxDEV_7x81h0kn("td", {
          className: `px-3 py-2 ${right ? "text-right" : ""} ${cellClasses?.[i] ?? ""} ${cellClasses?.[i] ? "font-medium" : ""}`,
          children: fn(r, inr)
        }, r.company.id, false, undefined, this);
      })
    ]
  }, undefined, true, undefined, this);
}
function downloadBrief(b) {
  const md = `# ${b.kind.replace("_", " ").toUpperCase()} — ${b.symbol}

${b.content}

---
Grounded on: ${b.groundedOn.market ? "market snapshot" : "no market data"}${b.groundedOn.documents > 0 ? `; ${b.groundedOn.documents} doc(s): ${b.groundedOn.documentNames.join(", ")}` : ""}
Generated by Stock Intelligence RAG.
`;
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${b.symbol}-${b.kind}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
