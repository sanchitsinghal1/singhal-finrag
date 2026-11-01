"use client";
// Dashboard view — market overview + quick links to recent activity.
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { CompanyListEntry, DocumentItem, ConversationItem, Snapshot } from "@/lib/types";
import { fmtPrice, fmtPct, fmtCompact, timeAgo, fmtBytes } from "@/lib/format";
import type { NavState, View } from "@/components/app/app-shell";
import { useAuth } from "@/context/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, FileText, MessagesSquare, Star, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  go: (n: NavState) => void;
}

export function DashboardView({ go }: Props) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyListEntry[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [convs, setConvs] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [c, d, ch] = await Promise.all([
          api.get<{ companies: CompanyListEntry[] }>("/api/companies"),
          api.get<{ items: DocumentItem[] }>("/api/documents?limit=5").catch(() => ({ items: [] as DocumentItem[] })),
          api.get<{ conversations: ConversationItem[] }>("/api/conversations?limit=5").catch(() => ({ conversations: [] as ConversationItem[] })),
        ]);
        setCompanies(c.companies.slice(0, 8));
        setDocs(d.items);
        setConvs(ch.conversations);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-xl border bg-gradient-to-br from-sky-600/10 via-emerald-600/5 to-background p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Research Workspace"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Upload financial reports, ask evidence-grounded questions, and compare companies using real retrieved context — not invented answers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => go({ view: "documents" })} className="bg-emerald-600 hover:bg-emerald-700">
              <FileText className="h-4 w-4 mr-1.5" /> Upload report
            </Button>
            <Button variant="outline" onClick={() => go({ view: "research" })}>
              <MessagesSquare className="h-4 w-4 mr-1.5" /> Ask research
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
          <CardContent className="py-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" /> {error}
          </CardContent>
        </Card>
      )}

      {/* Market overview — featured companies */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" /> Market overview
          </h2>
          <Button variant="ghost" size="sm" onClick={() => go({ view: "companies" })}>
            Browse all <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            : companies.map((c) => {
                const snap = c.snapshots?.[0];
                return (
                  <button
                    key={c.id}
                    onClick={() => go({ view: "companies", companyId: c.id, companySymbol: c.symbol })}
                    className="text-left"
                  >
                    <Card className="hover:border-emerald-500/60 hover:shadow-md transition-all h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{c.symbol}</div>
                            <div className="text-xs text-muted-foreground truncate">{c.name}</div>
                          </div>
                          {snap ? (
                            <Badge variant="outline" className="text-[10px] shrink-0">{snap.changePercent != null ? (snap.changePercent >= 0 ? "▲" : "▼") : "•"}</Badge>
                          ) : null}
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                          <div className="text-lg font-bold">{snap?.price ? fmtPrice(snap.price, c.symbol.endsWith(".NS") ? "INR" : "USD") : "—"}</div>
                          {snap?.changePercent != null && (() => {
                            const p = fmtPct(snap.changePercent);
                            return <span className={`text-xs font-medium ${p.className}`}>{p.text}</span>;
                          })()}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">{snap?.fetchedAt ? timeAgo(snap.fetchedAt) : "no data yet"}</div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
        </div>
      </section>

      {/* Recent activity */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Recent documents</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => go({ view: "documents" })}>Open library</Button>
            </div>
            <CardDescription>Latest uploaded reports and processing status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? <Skeleton className="h-16" /> : docs.length === 0 ? (
              <EmptyRow text="No documents yet. Upload a PDF or text report to start." actionLabel="Upload" onAction={() => go({ view: "documents" })} />
            ) : docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{d.originalName}</div>
                  <div className="text-xs text-muted-foreground">{fmtBytes(d.size)} · {d.chunkCount} chunks</div>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><MessagesSquare className="h-4 w-4" /> Recent research</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => go({ view: "research" })}>Open chat</Button>
            </div>
            <CardDescription>Your latest RAG conversations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? <Skeleton className="h-16" /> : convs.length === 0 ? (
              <EmptyRow text="No conversations yet. Ask your first research question." actionLabel="Start" onAction={() => go({ view: "research" })} />
            ) : convs.map((c) => (
              <button
                key={c.id}
                onClick={() => go({ view: "research", conversationId: c.id })}
                className="w-full text-left flex items-center justify-between gap-2 py-2 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.lastMessage || "No messages yet"}</div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(c.lastMessageAt || c.updatedAt)}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: DocumentItem["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    ready: { label: "Ready", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
    processing: { label: "Processing", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
    pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
    failed: { label: "Failed", cls: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
  };
  const s = map[status] ?? map.pending;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.cls}`}>{s.label}</span>;
}

function EmptyRow({ text, actionLabel, onAction }: { text: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button size="sm" variant="outline" onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}
