"use client";
// Watchlists view — create lists, track companies, set simple price targets.
import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { CompanyListEntry, WatchlistData } from "@/lib/types";
import { fmtPrice, fmtPct, timeAgo } from "@/lib/format";
import type { NavState } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Star, Trash2, RefreshCw, Loader2, ArrowUpRight, Target } from "lucide-react";

interface Props {
  go: (n: NavState) => void;
}

export function WatchlistsView({ go }: Props) {
  const [lists, setLists] = useState<WatchlistData[]>([]);
  const [companies, setCompanies] = useState<CompanyListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, c] = await Promise.all([
        api.get<{ watchlists: WatchlistData[] }>("/api/watchlists"),
        api.get<{ companies: CompanyListEntry[] }>("/api/companies"),
      ]);
      setLists(w.watchlists);
      setCompanies(c.companies);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post("/api/watchlists", { name: newName.trim() });
      setNewName("");
      await load();
      toast.success("Watchlist created");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const deleteList = async (id: string) => {
    if (!confirm("Delete this watchlist?")) return;
    try {
      await api.del(`/api/watchlists/${id}`);
      setLists((l) => l.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch (err) { toast.error((err as Error).message); }
  };

  const removeItem = async (listId: string, itemId: string) => {
    try {
      await api.del(`/api/watchlists/${listId}/items?itemId=${itemId}`);
      await load();
      toast.success("Removed");
    } catch (err) { toast.error((err as Error).message); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Watchlists</h1>
        <p className="text-sm text-muted-foreground mt-1">Track companies, attach notes, and set price targets. Snapshots are cached &amp; web-sourced.</p>
      </div>

      {/* Create new list */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" /> New watchlist</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createList} className="flex gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Megacap tech" />
            <Button type="submit" disabled={creating} className="bg-emerald-600 hover:bg-emerald-700">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : lists.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No watchlists yet. Create one above.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((l) => (
            <WatchlistCard key={l.id} list={l} companies={companies} go={go} onRemoveItem={removeItem} onDeleteList={deleteList} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function WatchlistCard({ list, companies, go, onRemoveItem, onDeleteList, onChanged }: {
  list: WatchlistData;
  companies: CompanyListEntry[];
  go: (n: NavState) => void;
  onRemoveItem: (listId: string, itemId: string) => void;
  onDeleteList: (id: string) => void;
  onChanged: () => void;
}) {
  const [companyId, setCompanyId] = useState("__none__");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("");
  const [adding, setAdding] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (companyId === "__none__") { toast.error("Pick a company first."); return; }
    setAdding(true);
    try {
      await api.post(`/api/watchlists/${list.id}/items`, {
        companyId,
        note: note || undefined,
        targetPrice: target ? Number(target) : undefined,
      });
      setCompanyId("__none__"); setNote(""); setTarget("");
      onChanged(); // refresh all lists from the server
      toast.success("Added");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base flex items-center gap-2 truncate"><Star className="h-4 w-4 text-amber-500" /> {list.name}</CardTitle>
            {list.description && <CardDescription className="truncate">{list.description}</CardDescription>}
          </div>
          <Button size="icon" variant="ghost" onClick={() => onDeleteList(list.id)} aria-label="Delete list"><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {list.items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No companies tracked yet.</p>
        ) : (
          <ul className="divide-y">
            {list.items.map((it) => {
              const s = it.snapshot;
              const inr = it.company.symbol.endsWith(".NS");
              const hitTarget = it.targetPrice && s?.price ? (s.price >= it.targetPrice) : false;
              return (
                <li key={it.id} className="py-2 flex items-center justify-between gap-2">
                  <button onClick={() => go({ view: "companies", companyId: it.company.id, companySymbol: it.company.symbol })} className="min-w-0 text-left">
                    <div className="text-sm font-medium truncate flex items-center gap-1">
                      {it.company.symbol}
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{it.company.name}</div>
                    {it.note && <div className="text-[11px] text-muted-foreground truncate italic">“{it.note}”</div>}
                  </button>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {s ? (
                        <>
                          <div className="text-sm font-semibold">{fmtPrice(s.price, inr ? "INR" : "USD")}</div>
                          {s.changePercent != null && (() => { const p = fmtPct(s.changePercent); return <div className={`text-[11px] ${p.className}`}>{p.text}</div>; })()}
                          {it.targetPrice && (
                            <div className={`text-[10px] flex items-center gap-0.5 ${hitTarget ? "text-emerald-600" : "text-muted-foreground"}`}>
                              <Target className="h-2.5 w-2.5" /> {fmtPrice(it.targetPrice, inr ? "INR" : "USD")}
                              {hitTarget && <Badge className="text-[9px] ml-1 bg-emerald-600 text-white">hit</Badge>}
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground">{timeAgo(s.fetchedAt)}</div>
                        </>
                      ) : <span className="text-xs text-muted-foreground">no data</span>}
                    </div>
                    <button onClick={() => onRemoveItem(list.id, it.id)} className="text-red-500 hover:text-red-700" aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={add} className="grid grid-cols-[1fr_auto] gap-2 pt-1">
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Add company" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Select —</SelectItem>
              {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.symbol} · {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" disabled={adding} className="bg-emerald-600 hover:bg-emerald-700">
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </form>
        <div className="grid grid-cols-2 gap-2">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="h-8 text-xs" />
          <Input value={target} onChange={(e) => setTarget(e.target.value)} type="number" placeholder="Target price" className="h-8 text-xs" />
        </div>
      </CardContent>
    </Card>
  );
}
