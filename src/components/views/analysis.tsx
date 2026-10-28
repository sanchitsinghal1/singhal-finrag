"use client";
// Analysis view — compare up to 5 companies and generate grounded
// research briefs (Bull/Bear, SWOT, Summary) with provenance tags.
import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { CompanyListEntry, Snapshot } from "@/lib/types";
import { fmtPrice, fmtPct, fmtCompact, timeAgo } from "@/lib/format";
import type { NavState } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GitCompare, Loader2, Sparkles, Plus, X, ClipboardCopy, FileDown } from "lucide-react";

interface Props {
  go: (n: NavState) => void;
}

interface CompareRow {
  company: { id: string; symbol: string; name: string; sector?: string | null; industry?: string | null; exchange?: string | null };
  snapshot: Snapshot | null;
}

interface Brief {
  kind: string;
  companyId: string;
  symbol: string;
  content: string;
  groundedOn: { market: boolean; documents: number; documentNames: string[]; snapshotFetchedAt: string | null };
}

export function AnalysisView({ go }: Props) {
  const [companies, setCompanies] = useState<CompanyListEntry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [picker, setPicker] = useState("__none__");
  const [comparing, setComparing] = useState(false);
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [briefCompany, setBriefCompany] = useState("__none__");
  const [briefKind, setBriefKind] = useState<"bull_bear" | "swot" | "summary">("bull_bear");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.get<{ companies: CompanyListEntry[] }>("/api/companies");
        setCompanies(d.companies);
      } catch (err) { toast.error((err as Error).message); }
    })();
  }, []);

  const addCompany = (id: string) => {
    if (id === "__none__") return;
    setSelected((s) => (s.includes(id) || s.length >= 5 ? s : [...s, id]));
    setPicker("__none__");
  };

  const compare = async () => {
    if (selected.length === 0) { toast.error("Pick at least one company."); return; }
    setComparing(true);
    setRows([]);
    try {
      const res = await api.post<{ rows: CompareRow[] }>("/api/analysis/compare", { companyIds: selected });
      setRows(res.rows);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setComparing(false);
    }
  };

  const generate = async () => {
    if (briefCompany === "__none__") { toast.error("Pick a company."); return; }
    setGenLoading(true);
    setBrief(null);
    try {
      const res = await api.post<Brief>("/api/analysis/generate", { kind: briefKind, companyId: briefCompany });
      setBrief(res);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenLoading(false);
    }
  };

  const selectedCompanies = companies.filter((c) => selected.includes(c.id));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">Compare fundamentals across companies and generate evidence-grounded research briefs.</p>
      </div>

      {/* Comparison builder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><GitCompare className="h-4 w-4" /> Compare companies</CardTitle>
          <CardDescription>Select up to 5. Snapshots are fetched fresh per compare.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {selectedCompanies.map((c) => (
              <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
                {c.symbol}
                <button onClick={() => setSelected((s) => s.filter((x) => x !== c.id))} className="hover:text-red-500"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
            {selected.length === 0 && <span className="text-xs text-muted-foreground">No companies selected yet.</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={picker} onValueChange={addCompany}>
              <SelectTrigger className="w-[240px] h-9"><SelectValue placeholder="Add a company" /></SelectTrigger>
              <SelectContent>
                {companies.filter((c) => !selected.includes(c.id)).map((c) => <SelectItem key={c.id} value={c.id}>{c.symbol} · {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={compare} disabled={comparing || selected.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
              {comparing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <GitCompare className="h-4 w-4 mr-1" />} Compare
            </Button>
          </div>

          {rows.length > 0 && (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left font-medium px-3 py-2">Metric</th>
                    {rows.map((r) => (
                      <th key={r.company.id} className="text-right font-medium px-3 py-2">
                        <button onClick={() => go({ view: "companies", companyId: r.company.id, companySymbol: r.company.symbol })} className="hover:underline">
                          {r.company.symbol}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renderCompareRow("Sector", rows, (r) => r.company.sector || "—")}
                  {renderCompareRow("Price", rows, (r, inr) => fmtPrice(r.snapshot?.price, inr ? "INR" : "USD"), true)}
                  {renderCompareRow("1d %", rows, (r) => fmtPct(r.snapshot?.changePercent).text, true, rows.map((r) => fmtPct(r.snapshot?.changePercent).className))}
                  {renderCompareRow("Market cap", rows, (r, inr) => fmtCompact(r.snapshot?.marketCap, inr ? "INR" : "USD"), true)}
                  {renderCompareRow("P/E", rows, (r) => r.snapshot?.peRatio != null ? r.snapshot!.peRatio!.toFixed(2) : "—", true)}
                  {renderCompareRow("EPS", rows, (r, inr) => fmtPrice(r.snapshot?.eps, inr ? "INR" : "USD"), true)}
                  {renderCompareRow("52w high", rows, (r, inr) => fmtPrice(r.snapshot?.week52High, inr ? "INR" : "USD"), true)}
                  {renderCompareRow("52w low", rows, (r, inr) => fmtPrice(r.snapshot?.week52Low, inr ? "INR" : "USD"), true)}
                  {renderCompareRow("Updated", rows, (r) => r.snapshot?.fetchedAt ? timeAgo(r.snapshot.fetchedAt) : "—", true)}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brief generator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-600" /> Generate research brief</CardTitle>
          <CardDescription>Grounded in the company's latest market snapshot (and a list of your uploaded documents, if any).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select value={briefCompany} onValueChange={setBriefCompany}>
              <SelectTrigger className="w-[240px] h-9"><SelectValue placeholder="Pick a company" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.symbol} · {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={briefKind} onValueChange={(v) => setBriefKind(v as typeof briefKind)}>
              <SelectTrigger className="w-[200px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bull_bear">Bull / Bear case</SelectItem>
                <SelectItem value="swot">SWOT analysis</SelectItem>
                <SelectItem value="summary">Equity summary</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generate} disabled={genLoading || briefCompany === "__none__"} className="bg-emerald-600 hover:bg-emerald-700">
              {genLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />} Generate
            </Button>
          </div>

          {genLoading && <Skeleton className="h-64" />}
          {brief && (
            <div className="border rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">{brief.kind.replace("_", " ")}</Badge>
                  <span className="text-sm font-medium">{brief.symbol}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(brief.content); toast.success("Copied"); }}>
                    <ClipboardCopy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => downloadBrief(brief)}>
                    <FileDown className="h-3.5 w-3.5 mr-1" /> Export .md
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">{brief.content}</div>
              <div className="pt-2 border-t text-[11px] text-muted-foreground">
                Grounded on: {brief.groundedOn.market ? "market snapshot" : "no market data"}
                {brief.groundedOn.documents > 0 ? ` · ${brief.groundedOn.documents} uploaded doc(s): ${brief.groundedOn.documentNames.join(", ")}` : " · no uploaded documents"}
                {brief.groundedOn.snapshotFetchedAt && ` · snapshot @ ${timeAgo(brief.groundedOn.snapshotFetchedAt)}`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function renderCompareRow(
  label: string,
  rows: CompareRow[],
  fn: (r: CompareRow, inr: boolean) => string,
  right = false,
  cellClasses?: string[]
) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-3 py-2 text-muted-foreground">{label}</td>
      {rows.map((r, i) => {
        const inr = r.company.symbol.endsWith(".NS");
        return (
          <td key={r.company.id} className={`px-3 py-2 ${right ? "text-right" : ""} ${cellClasses?.[i] ?? ""} ${cellClasses?.[i] ? "font-medium" : ""}`}>
            {fn(r, inr)}
          </td>
        );
      })}
    </tr>
  );
}

function downloadBrief(b: Brief) {
  const md = `# ${b.kind.replace("_", " ").toUpperCase()} — ${b.symbol}\n\n${b.content}\n\n---\nGrounded on: ${b.groundedOn.market ? "market snapshot" : "no market data"}${b.groundedOn.documents > 0 ? `; ${b.groundedOn.documents} doc(s): ${b.groundedOn.documentNames.join(", ")}` : ""}\nGenerated by Stock Intelligence RAG.\n`;
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${b.symbol}-${b.kind}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
