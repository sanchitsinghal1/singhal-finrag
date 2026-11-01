"use client";
// Companies view — searchable directory + per-company intelligence page.
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { Company, CompanyListEntry, Snapshot } from "@/lib/types";
import { fmtPrice, fmtPct, fmtCompact, timeAgo } from "@/lib/format";
import type { NavState } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowLeft, RefreshCw, Loader2, Building2, Star, GitCompare } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts";

interface Props {
  go: (n: NavState) => void;
  nav: NavState;
}

export function CompaniesView({ go, nav }: Props) {
  // When a companyId is in nav, render the detail page; otherwise the list.
  if (nav.companyId) {
    return <CompanyDetail go={go} companyId={nav.companyId} symbol={nav.companySymbol} />;
  }
  return <CompanyList go={go} />;
}

// ---------------------------------------------------------------------
// Directory list
// ---------------------------------------------------------------------
function CompanyList({ go }: { go: (n: NavState) => void }) {
  const [q, setQ] = useState("");
  const [companies, setCompanies] = useState<CompanyListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const data = await api.get<{ companies: CompanyListEntry[] }>(`/api/companies${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      setCompanies(data.companies);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(""); }, [load]);

  // Debounced search by typing a ticker (creates the company lazily on submit).
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(q);
  };

  const resolveTicker = async () => {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const c = await api.post<{ id: string; symbol: string }>("/api/companies", { symbol: q.trim() });
      go({ view: "companies", companyId: c.id, companySymbol: c.symbol });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse the directory or resolve any ticker symbol.</p>
      </div>

      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or symbol (e.g. Apple, AAPL, RELIANCE)"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">Search</Button>
        <Button type="button" onClick={resolveTicker} disabled={searching} className="bg-emerald-600 hover:bg-emerald-700">
          {searching ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
          Resolve ticker
        </Button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : companies.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No companies match “{q}”. Try resolving the ticker directly.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {companies.map((c) => {
            const snap = c.snapshots?.[0];
            const inr = c.symbol.endsWith(".NS");
            return (
              <button key={c.id} onClick={() => go({ view: "companies", companyId: c.id, companySymbol: c.symbol })} className="text-left">
                <Card className="hover:border-emerald-500/60 hover:shadow-md transition-all h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{c.symbol}</span>
                          {c.exchange && <Badge variant="outline" className="text-[10px]">{c.exchange}</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{c.name}</div>
                        {c.sector && <div className="text-[11px] text-muted-foreground mt-1">{c.sector}</div>}
                      </div>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div className="text-lg font-bold">{snap?.price ? fmtPrice(snap.price, inr ? "INR" : "USD") : "—"}</div>
                      {snap?.changePercent != null && (() => { const p = fmtPct(snap.changePercent); return <span className={`text-xs font-medium ${p.className}`}>{p.text}</span>; })()}
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Company detail
// ---------------------------------------------------------------------
function CompanyDetail({ go, companyId, symbol }: { go: (n: NavState) => void; companyId: string; symbol?: string }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [series, setSeries] = useState<{ date: string; close: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const detail = await api.get<{ company: Company; snapshot: Snapshot | null }>(`/api/companies/${encodeURIComponent(companyId)}`);
      setCompany(detail.company);
      setSnap(detail.snapshot);
      // fetch series for chart
      const m = await api.get<{ series: { date: string; close: number }[] }>(`/api/market/${encodeURIComponent(companyId)}${force ? "?force=1" : ""}`);
      setCompany(m.company ? detail.company : detail.company);
      setSnap(m.snapshot ?? detail.snapshot);
      setSeries(m.series ?? []);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(false); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const m = await api.get<{ snapshot: Snapshot; series: { date: string; close: number }[]; company: { symbol: string; name: string } }>(`/api/market/${encodeURIComponent(companyId)}?force=1`);
      setSnap(m.snapshot);
      setSeries(m.series ?? []);
      toast.success("Market data refreshed");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-64" /></div>;

  const inr = (symbol ?? company?.symbol ?? "").endsWith(".NS");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => go({ view: "companies" })}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{company?.name}</h1>
              <Badge variant="outline">{company?.symbol}</Badge>
              {company?.exchange && <Badge variant="secondary" className="text-xs">{company.exchange}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{[company?.sector, company?.industry].filter(Boolean).join(" · ") || "Sector data unavailable"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => go({ view: "analysis" })}><GitCompare className="h-4 w-4 mr-1" /> Compare</Button>
          <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />} Refresh
          </Button>
        </div>
      </div>

      {snap?.stale && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          Showing cached data from {timeAgo(snap.fetchedAt)} (refresh failed or rate-limited). Click Refresh to retry.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Price + chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-end justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Price</CardTitle>
                <div className="text-3xl font-bold mt-1">{snap?.price ? fmtPrice(snap.price, inr ? "INR" : "USD") : "—"}</div>
              </div>
              {snap?.changePercent != null && (() => { const p = fmtPct(snap.changePercent); return <span className={`text-sm font-medium ${p.className}`}>{p.text}</span>; })()}
            </div>
          </CardHeader>
          <CardContent>
            {series.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="px" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={40} tickFormatter={(v) => fmtPrice(v as number, inr ? "INR" : "USD")} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      formatter={(v: number) => [fmtPrice(v, inr ? "INR" : "USD"), "Close"]}
                    />
                    <Area type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} fill="url(#px)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 grid place-items-center text-sm text-muted-foreground">No price series available.</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">
              {snap ? `Source: ${snap.source} · fetched ${timeAgo(snap.fetchedAt)}` : "No snapshot yet."}
              {series.length > 0 && " · Chart series is illustrative (derived from the latest price) when no OHLC feed is configured."}
            </p>
          </CardContent>
        </Card>

        {/* Fundamentals */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Fundamentals</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
            <Metric label="Market cap" value={snap?.marketCap ? fmtCompact(snap.marketCap, inr ? "INR" : "USD") : "—"} />
            <Metric label="P/E ratio" value={snap?.peRatio != null ? snap.peRatio.toFixed(2) : "—"} />
            <Metric label="EPS" value={snap?.eps != null ? fmtPrice(snap.eps, inr ? "INR" : "USD") : "—"} />
            <Metric label="52w high" value={snap?.week52High != null ? fmtPrice(snap.week52High, inr ? "INR" : "USD") : "—"} />
            <Metric label="52w low" value={snap?.week52Low != null ? fmtPrice(snap.week52Low, inr ? "INR" : "USD") : "—"} />
            <Metric label="1d change" value={fmtPct(snap?.changePercent).text} className={fmtPct(snap?.changePercent).className} />
          </CardContent>
        </Card>
      </div>

      {snap?.summary && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Snapshot summary</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{snap.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Card>
        <CardContent className="py-4 flex flex-wrap gap-2">
          <Button onClick={() => go({ view: "research", conversationId: undefined })} variant="outline">
            Ask research about {company?.symbol}
          </Button>
          <Button onClick={() => go({ view: "watchlists" })} variant="outline">
            <Star className="h-4 w-4 mr-1" /> Add to watchlist
          </Button>
          <Button onClick={() => go({ view: "documents" })} variant="outline">
            <Building2 className="h-4 w-4 mr-1" /> Upload report for {company?.symbol}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`font-semibold ${className ?? ""}`}>{value}</div>
    </div>
  );
}
