"use client";
// Documents view — upload financial reports, browse the library, inspect chunks.
import React, { useEffect, useState, useCallback, useRef } from "react";
import { api, uploadFile } from "@/lib/api-client";
import type { CompanyListEntry, DocumentItem } from "@/lib/types";
import { fmtBytes, fmtCompact, timeAgo } from "@/lib/format";
import type { NavState } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Loader2, AlertTriangle, CheckCircle2, ArrowLeft, FileSearch } from "lucide-react";

interface Props {
  go: (n: NavState) => void;
  nav: NavState;
}

export function DocumentsView({ go, nav }: Props) {
  if (nav.documentId) {
    return <DocumentDetail go={go} documentId={nav.documentId} />;
  }
  return <DocumentLibrary go={go} />;
}

// ---------------------------------------------------------------------
// Library + uploader
// ---------------------------------------------------------------------
function DocumentLibrary({ go }: { go: (n: NavState) => void }) {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [companies, setCompanies] = useState<CompanyListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState<string>("__none__");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([
        api.get<{ items: DocumentItem[] }>("/api/documents?limit=50"),
        api.get<{ companies: CompanyListEntry[] }>("/api/companies"),
      ]);
      setDocs(d.items);
      setCompanies(c.companies);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Choose a file first."); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (companyId !== "__none__") fd.append("companyId", companyId);
      const res = await uploadFile<{ status: string; chunkCount: number; charCount: number; message: string; duplicateOf?: string }>("/api/documents", fd);
      toast.success(res.message);
      setFile(null);
      setCompanyId("__none__");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this document and all its chunks?")) return;
    try {
      await api.del(`/api/documents/${id}`);
      toast.success("Deleted");
      setDocs((d) => d.filter((x) => x.id !== id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload PDF / TXT / MD reports. We extract, chunk, embed and index them for RAG.</p>
      </div>

      {/* Uploader */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" /> Upload report</CardTitle>
          <CardDescription>Max 10 MB · PDF, TXT, MD. Scanned PDFs without OCR will report “no extractable text”.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onUpload} className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && <p className="text-xs text-muted-foreground">{file.name} · {fmtBytes(file.size)}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company (optional)</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger id="company"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.symbol} · {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={uploading || !file} className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto">
                {uploading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
                {uploading ? "Processing…" : "Upload"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Library */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Library</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : docs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No documents yet. Upload your first report above.</div>
          ) : (
            <ul className="divide-y">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 p-3 hover:bg-muted/40 transition-colors">
                  <button onClick={() => go({ view: "documents", documentId: d.id })} className="flex items-start gap-3 min-w-0 text-left flex-1">
                    <FileText className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{d.originalName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {fmtBytes(d.size)} · {d.status === "ready" ? `${d.chunkCount} chunks · ${d.charCount.toLocaleString()} chars` : d.status}
                        {d.company ? ` · ${d.company.symbol}` : ""}
                        {" · "}{timeAgo(d.uploadedAt)}
                      </div>
                      {d.status === "failed" && d.errorMessage && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {d.errorMessage}</div>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill status={d.status} />
                    <Button size="icon" variant="ghost" onClick={() => onDelete(d.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------
// Document detail — inspect chunks
// ---------------------------------------------------------------------
function DocumentDetail({ go, documentId }: { go: (n: NavState) => void; documentId: string }) {
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [chunks, setChunks] = useState<{ id: string; chunkIndex: number; page?: number | null; text: string; tokenCount: number; charCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.get<{ document: DocumentItem; chunks: typeof chunks }>(`/api/documents/${documentId}?chunkLimit=50`);
        setDoc(data.document);
        setChunks(data.chunks);
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId]);

  if (loading) return <Skeleton className="h-64" />;
  if (!doc) return <div>Not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => go({ view: "documents" })}><ArrowLeft className="h-4 w-4 mr-1" /> Back to library</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> {doc.originalName}</CardTitle>
          <CardDescription>
            {fmtBytes(doc.size)} · {doc.mimeType} · {doc.chunkCount} chunks · {doc.charCount.toLocaleString()} chars · uploaded {timeAgo(doc.uploadedAt)}
            {doc.company ? ` · ${doc.company.symbol}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <StatusPill status={doc.status} />
            {doc.status === "ready" && <Badge variant="outline" className="text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Indexed for retrieval</Badge>}
          </div>
          {doc.errorMessage && <div className="text-xs text-red-600 dark:text-red-400">{doc.errorMessage}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileSearch className="h-4 w-4" /> Chunks ({chunks.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {chunks.length === 0 ? <p className="text-sm text-muted-foreground">No chunks.</p> : chunks.map((c) => (
            <div key={c.id} className="border rounded-md p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-[10px]">#{c.chunkIndex}</Badge>
                {c.page != null && <Badge variant="outline" className="text-[10px]">p.{c.page}</Badge>}
                <span className="text-[10px] text-muted-foreground">{c.charCount} chars · ~{c.tokenCount} tokens</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-6">{c.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <Button onClick={() => go({ view: "research", conversationId: undefined })} variant="outline">
            Ask a question about this document
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusPill({ status }: { status: DocumentItem["status"] }) {
  const map: Record<string, { label: string; cls: string; icon?: React.ElementType }> = {
    ready: { label: "Ready", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", icon: CheckCircle2 },
    processing: { label: "Processing", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
    pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
    failed: { label: "Failed", cls: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300", icon: AlertTriangle },
  };
  const s = map[status] ?? map.pending;
  const Icon = s.icon;
  return <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${s.cls}`}>{Icon && <Icon className="h-3 w-3" />}{s.label}</span>;
}
