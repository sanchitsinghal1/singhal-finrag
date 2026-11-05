"use client";
import { jsx as jsxDEV_7x81h0kn, Fragment as Fragment_8vg9x3sq } from "react/jsx-runtime";
import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { fmtPrice, fmtPct, timeAgo } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Star, Trash2, RefreshCw, Loader2, ArrowUpRight, Target } from "lucide-react";
export function WatchlistsView({ go }) {
  const [lists, setLists] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, c] = await Promise.all([
        api.get("/api/watchlists"),
        api.get("/api/companies")
      ]);
      setLists(w.watchlists);
      setCompanies(c.companies);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const createList = async (e) => {
    e.preventDefault();
    if (!newName.trim())
      return;
    setCreating(true);
    try {
      await api.post("/api/watchlists", { name: newName.trim() });
      setNewName("");
      await load();
      toast.success("Watchlist created");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };
  const deleteList = async (id) => {
    if (!confirm("Delete this watchlist?"))
      return;
    try {
      await api.del(`/api/watchlists/${id}`);
      setLists((l) => l.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };
  const removeItem = async (listId, itemId) => {
    try {
      await api.del(`/api/watchlists/${listId}/items?itemId=${itemId}`);
      await load();
      toast.success("Removed");
    } catch (err) {
      toast.error(err.message);
    }
  };
  return jsxDEV_7x81h0kn("div", {
    className: "space-y-5",
    children: [
      jsxDEV_7x81h0kn("div", {
        children: [
          jsxDEV_7x81h0kn("h1", {
            className: "text-2xl font-bold tracking-tight",
            children: "Watchlists"
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn("p", {
            className: "text-sm text-muted-foreground mt-1",
            children: "Track companies, attach notes, and set price targets. Snapshots are cached & web-sourced."
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      jsxDEV_7x81h0kn(Card, {
        children: [
          jsxDEV_7x81h0kn(CardHeader, {
            className: "pb-3",
            children: jsxDEV_7x81h0kn(CardTitle, {
              className: "text-base flex items-center gap-2",
              children: [
                jsxDEV_7x81h0kn(Plus, {
                  className: "h-4 w-4"
                }, undefined, false, undefined, this),
                " New watchlist"
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn(CardContent, {
            children: jsxDEV_7x81h0kn("form", {
              onSubmit: createList,
              className: "flex gap-2",
              children: [
                jsxDEV_7x81h0kn(Input, {
                  value: newName,
                  onChange: (e) => setNewName(e.target.value),
                  placeholder: "e.g. Megacap tech"
                }, undefined, false, undefined, this),
                jsxDEV_7x81h0kn(Button, {
                  type: "submit",
                  disabled: creating,
                  className: "bg-emerald-600 hover:bg-emerald-700",
                  children: [
                    creating ? jsxDEV_7x81h0kn(Loader2, {
                      className: "h-4 w-4 animate-spin"
                    }, undefined, false, undefined, this) : jsxDEV_7x81h0kn(Plus, {
                      className: "h-4 w-4"
                    }, undefined, false, undefined, this),
                    " Create"
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      loading ? jsxDEV_7x81h0kn("div", {
        className: "grid grid-cols-1 md:grid-cols-2 gap-4",
        children: Array.from({ length: 2 }).map((_, i) => jsxDEV_7x81h0kn(Skeleton, {
          className: "h-48"
        }, i, false, undefined, this))
      }, undefined, false, undefined, this) : lists.length === 0 ? jsxDEV_7x81h0kn(Card, {
        children: jsxDEV_7x81h0kn(CardContent, {
          className: "py-10 text-center text-sm text-muted-foreground",
          children: "No watchlists yet. Create one above."
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this) : jsxDEV_7x81h0kn("div", {
        className: "grid grid-cols-1 md:grid-cols-2 gap-4",
        children: lists.map((l) => jsxDEV_7x81h0kn(WatchlistCard, {
          list: l,
          companies,
          go,
          onRemoveItem: removeItem,
          onDeleteList: deleteList,
          onChanged: load
        }, l.id, false, undefined, this))
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function WatchlistCard({ list, companies, go, onRemoveItem, onDeleteList, onChanged }) {
  const [companyId, setCompanyId] = useState("__none__");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("");
  const [adding, setAdding] = useState(false);
  const add = async (e) => {
    e.preventDefault();
    if (companyId === "__none__") {
      toast.error("Pick a company first.");
      return;
    }
    setAdding(true);
    try {
      await api.post(`/api/watchlists/${list.id}/items`, {
        companyId,
        note: note || undefined,
        targetPrice: target ? Number(target) : undefined
      });
      setCompanyId("__none__");
      setNote("");
      setTarget("");
      onChanged();
      toast.success("Added");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };
  return jsxDEV_7x81h0kn(Card, {
    children: [
      jsxDEV_7x81h0kn(CardHeader, {
        className: "pb-2",
        children: jsxDEV_7x81h0kn("div", {
          className: "flex items-center justify-between gap-2",
          children: [
            jsxDEV_7x81h0kn("div", {
              className: "min-w-0",
              children: [
                jsxDEV_7x81h0kn(CardTitle, {
                  className: "text-base flex items-center gap-2 truncate",
                  children: [
                    jsxDEV_7x81h0kn(Star, {
                      className: "h-4 w-4 text-amber-500"
                    }, undefined, false, undefined, this),
                    " ",
                    list.name
                  ]
                }, undefined, true, undefined, this),
                list.description && jsxDEV_7x81h0kn(CardDescription, {
                  className: "truncate",
                  children: list.description
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            jsxDEV_7x81h0kn(Button, {
              size: "icon",
              variant: "ghost",
              onClick: () => onDeleteList(list.id),
              "aria-label": "Delete list",
              children: jsxDEV_7x81h0kn(Trash2, {
                className: "h-4 w-4 text-red-500"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn(CardContent, {
        className: "space-y-3",
        children: [
          list.items.length === 0 ? jsxDEV_7x81h0kn("p", {
            className: "text-xs text-muted-foreground",
            children: "No companies tracked yet."
          }, undefined, false, undefined, this) : jsxDEV_7x81h0kn("ul", {
            className: "divide-y",
            children: list.items.map((it) => {
              const s = it.snapshot;
              const inr = it.company.symbol.endsWith(".NS");
              const hitTarget = it.targetPrice && s?.price ? s.price >= it.targetPrice : false;
              return jsxDEV_7x81h0kn("li", {
                className: "py-2 flex items-center justify-between gap-2",
                children: [
                  jsxDEV_7x81h0kn("button", {
                    onClick: () => go({ view: "companies", companyId: it.company.id, companySymbol: it.company.symbol }),
                    className: "min-w-0 text-left",
                    children: [
                      jsxDEV_7x81h0kn("div", {
                        className: "text-sm font-medium truncate flex items-center gap-1",
                        children: [
                          it.company.symbol,
                          jsxDEV_7x81h0kn(ArrowUpRight, {
                            className: "h-3 w-3 text-muted-foreground"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      jsxDEV_7x81h0kn("div", {
                        className: "text-[11px] text-muted-foreground truncate",
                        children: it.company.name
                      }, undefined, false, undefined, this),
                      it.note && jsxDEV_7x81h0kn("div", {
                        className: "text-[11px] text-muted-foreground truncate italic",
                        children: [
                          "“",
                          it.note,
                          "”"
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  jsxDEV_7x81h0kn("div", {
                    className: "flex items-center gap-3 shrink-0",
                    children: [
                      jsxDEV_7x81h0kn("div", {
                        className: "text-right",
                        children: s ? jsxDEV_7x81h0kn(Fragment_8vg9x3sq, {
                          children: [
                            jsxDEV_7x81h0kn("div", {
                              className: "text-sm font-semibold",
                              children: fmtPrice(s.price, inr ? "INR" : "USD")
                            }, undefined, false, undefined, this),
                            s.changePercent != null && (() => {
                              const p = fmtPct(s.changePercent);
                              return jsxDEV_7x81h0kn("div", {
                                className: `text-[11px] ${p.className}`,
                                children: p.text
                              }, undefined, false, undefined, this);
                            })(),
                            it.targetPrice && jsxDEV_7x81h0kn("div", {
                              className: `text-[10px] flex items-center gap-0.5 ${hitTarget ? "text-emerald-600" : "text-muted-foreground"}`,
                              children: [
                                jsxDEV_7x81h0kn(Target, {
                                  className: "h-2.5 w-2.5"
                                }, undefined, false, undefined, this),
                                " ",
                                fmtPrice(it.targetPrice, inr ? "INR" : "USD"),
                                hitTarget && jsxDEV_7x81h0kn(Badge, {
                                  className: "text-[9px] ml-1 bg-emerald-600 text-white",
                                  children: "hit"
                                }, undefined, false, undefined, this)
                              ]
                            }, undefined, true, undefined, this),
                            jsxDEV_7x81h0kn("div", {
                              className: "text-[10px] text-muted-foreground",
                              children: timeAgo(s.fetchedAt)
                            }, undefined, false, undefined, this)
                          ]
                        }, undefined, true, undefined, this) : jsxDEV_7x81h0kn("span", {
                          className: "text-xs text-muted-foreground",
                          children: "no data"
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn("button", {
                        onClick: () => onRemoveItem(list.id, it.id),
                        className: "text-red-500 hover:text-red-700",
                        "aria-label": "Remove",
                        children: jsxDEV_7x81h0kn(Trash2, {
                          className: "h-4 w-4"
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, it.id, true, undefined, this);
            })
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn("form", {
            onSubmit: add,
            className: "grid grid-cols-[1fr_auto] gap-2 pt-1",
            children: [
              jsxDEV_7x81h0kn(Select, {
                value: companyId,
                onValueChange: setCompanyId,
                children: [
                  jsxDEV_7x81h0kn(SelectTrigger, {
                    className: "h-8 text-xs",
                    children: jsxDEV_7x81h0kn(SelectValue, {
                      placeholder: "Add company"
                    }, undefined, false, undefined, this)
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn(SelectContent, {
                    children: [
                      jsxDEV_7x81h0kn(SelectItem, {
                        value: "__none__",
                        children: "— Select —"
                      }, undefined, false, undefined, this),
                      companies.map((c) => jsxDEV_7x81h0kn(SelectItem, {
                        value: c.id,
                        children: [
                          c.symbol,
                          " · ",
                          c.name
                        ]
                      }, c.id, true, undefined, this))
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn(Button, {
                type: "submit",
                size: "sm",
                disabled: adding,
                className: "bg-emerald-600 hover:bg-emerald-700",
                children: adding ? jsxDEV_7x81h0kn(Loader2, {
                  className: "h-3.5 w-3.5 animate-spin"
                }, undefined, false, undefined, this) : jsxDEV_7x81h0kn(Plus, {
                  className: "h-3.5 w-3.5"
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn("div", {
            className: "grid grid-cols-2 gap-2",
            children: [
              jsxDEV_7x81h0kn(Input, {
                value: note,
                onChange: (e) => setNote(e.target.value),
                placeholder: "Note (optional)",
                className: "h-8 text-xs"
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn(Input, {
                value: target,
                onChange: (e) => setTarget(e.target.value),
                type: "number",
                placeholder: "Target price",
                className: "h-8 text-xs"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
