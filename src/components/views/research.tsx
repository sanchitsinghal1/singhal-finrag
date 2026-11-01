"use client";
// Research view — multi-turn RAG chat with citations, source provenance,
// and conversation management. New conversations can be scoped to a
// company or a document.
import React, { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { ChatMessage, Citation, CompanyListEntry, ConversationItem, DocumentItem, RagResult } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import type { NavState } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Plus, Send, Loader2, MessagesSquare, Trash2, FileText, ChevronRight, Quote, Copy, PanelLeft } from "lucide-react";

interface Props {
  go: (n: NavState) => void;
  initialConversationId?: string;
}

const EVIDENCE_BADGE: Record<string, { label: string; cls: string }> = {
  documents: { label: "from documents", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  market_data: { label: "from market data", cls: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  both: { label: "documents + market", cls: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
  none: { label: "no evidence", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
};

export function ResearchView({ go, initialConversationId }: Props) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  // New-conversation scope
  const [companies, setCompanies] = useState<CompanyListEntry[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [scopeCompany, setScopeCompany] = useState("__none__");
  const [scopeDoc, setScopeDoc] = useState("__none__");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load sidebar + scope options
  const loadConversations = useCallback(async () => {
    setLoadingConv(true);
    try {
      const [c, d, dc] = await Promise.all([
        api.get<{ conversations: ConversationItem[] }>("/api/conversations"),
        api.get<{ companies: CompanyListEntry[] }>("/api/companies"),
        api.get<{ items: DocumentItem[] }>("/api/documents?limit=50&status=ready"),
      ]);
      setConversations(c.conversations);
      setCompanies(d.companies);
      setDocs(dc.items);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoadingConv(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    (async () => {
      setLoadingMsgs(true);
      try {
        const data = await api.get<{ messages: ChatMessage[] }>(`/api/conversations/${activeId}`);
        setMessages(data.messages);
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setLoadingMsgs(false);
      }
    })();
  }, [activeId]);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const createConversation = async () => {
    try {
      const body: { title?: string; companyId?: string; documentId?: string } = {};
      if (scopeCompany !== "__none__") body.companyId = scopeCompany;
      if (scopeDoc !== "__none__") body.documentId = scopeDoc;
      const res = await api.post<{ id: string }>("/api/conversations", body);
      await loadConversations();
      setActiveId(res.id);
      setScopeCompany("__none__");
      setScopeDoc("__none__");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    let conversationId = activeId;
    // Auto-create a conversation if none is active yet.
    if (!conversationId) {
      try {
        const body: { title?: string; companyId?: string; documentId?: string } = {};
        if (scopeCompany !== "__none__") body.companyId = scopeCompany;
        if (scopeDoc !== "__none__") body.documentId = scopeDoc;
        const res = await api.post<{ id: string }>("/api/conversations", body);
        conversationId = res.id;
        setActiveId(res.id);
        await loadConversations();
      } catch (err) {
        toast.error((err as Error).message);
        return;
      }
    }

    // Optimistically show the user message
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content: question, createdAt: new Date().toISOString() }]);
    setInput("");
    setBusy(true);
    try {
      const body: { question: string; conversationId: string; companyId?: string; documentId?: string } = {
        question,
        conversationId: conversationId!,
      };
      if (scopeCompany !== "__none__") body.companyId = scopeCompany;
      if (scopeDoc !== "__none__") body.documentId = scopeDoc;

      const res = await api.post<RagResult>("/api/rag/query", body);
      setMessages((m) => [
        ...m.filter((x) => x.id !== tempId),
        { id: "u-" + tempId, role: "user", content: question, createdAt: new Date().toISOString() },
        { id: res.messageId ?? "a-" + tempId, role: "assistant", content: res.answer, citations: res.citations, evidenceType: res.evidenceType, createdAt: new Date().toISOString() },
      ]);
      await loadConversations();
    } catch (err) {
      // Roll back the optimistic user message and show the error inline.
      setMessages((m) => m.filter((x) => x.id !== tempId));
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const deleteConv = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await api.del(`/api/conversations/${id}`);
      if (activeId === id) { setActiveId(null); setMessages([]); }
      setConversations((c) => c.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch (err) { toast.error((err as Error).message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Research</h1>
          <p className="text-sm text-muted-foreground mt-1">Ask evidence-grounded questions. Answers cite the exact chunks they used.</p>
        </div>
        <Button onClick={createConversation} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-1" /> New conversation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Sidebar — conversation list (also collapsible on small screens) */}
        <Card className="hidden lg:block">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessagesSquare className="h-4 w-4" /> Conversations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              loading={loadingConv}
              onSelect={setActiveId}
              onDelete={deleteConv}
            />
          </CardContent>
        </Card>

        {/* Mobile sidebar trigger */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm"><PanelLeft className="h-4 w-4 mr-1" /> Conversations</Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <div className="mt-4">
                <ConversationList
                  conversations={conversations}
                  activeId={activeId}
                  loading={loadingConv}
                  onSelect={(id) => { setActiveId(id); }}
                  onDelete={deleteConv}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Chat panel */}
        <Card className="flex flex-col h-[72vh] min-h-[420px]">
          {/* Scope controls */}
          <div className="border-b p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Scope to company (optional)</Label>
              <Select value={scopeCompany} onValueChange={setScopeCompany}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.symbol} · {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Scope to document (optional)</Label>
              <Select value={scopeDoc} onValueChange={setScopeDoc}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {docs.map((d) => <SelectItem key={d.id} value={d.id}>{d.originalName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingMsgs ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : messages.length === 0 ? (
              <EmptyChat onPick={(q) => setInput(q)} />
            ) : (
              messages.map((m) => <MessageBubble key={m.id} m={m} go={go} />)
            )}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Retrieving relevant chunks &amp; generating an answer…
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="border-t p-3 flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question grounded in your documents…"
              disabled={busy}
            />
            <Button type="submit" disabled={busy || !input.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function ConversationList({ conversations, activeId, loading, onSelect, onDelete }: {
  conversations: ConversationItem[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) return <div className="p-3 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;
  if (conversations.length === 0) return <div className="p-4 text-xs text-muted-foreground">No conversations yet. Ask a question to start one.</div>;
  return (
    <ul className="max-h-[60vh] overflow-y-auto">
      {conversations.map((c) => (
        <li key={c.id} className={`group flex items-center gap-2 px-3 py-2 border-b cursor-pointer hover:bg-muted/50 ${activeId === c.id ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`} onClick={() => onSelect(c.id)}>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{c.title}</div>
            <div className="text-[11px] text-muted-foreground truncate">{c.lastMessage || "No messages"}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
            aria-label="Delete conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function EmptyChat({ onPick }: { onPick: (q: string) => void }) {
  const suggestions = [
    "Summarise this company's key risks from the uploaded report.",
    "What does the latest annual report say about revenue growth?",
    "Compare the company's margin trend across the last two reporting periods.",
    "List the main business segments and their contributions.",
  ];
  return (
    <div className="h-full grid place-items-center text-center">
      <div className="max-w-md space-y-4">
        <div className="h-12 w-12 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 grid place-items-center mx-auto"><MessagesSquare className="h-6 w-6" /></div>
        <div>
          <h3 className="font-semibold">Ask anything grounded in your documents</h3>
          <p className="text-sm text-muted-foreground mt-1">Answers cite the exact text they used. If evidence is missing, the assistant says so — it won't invent figures.</p>
        </div>
        <div className="grid gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => onPick(s)} className="text-left text-sm border rounded-md px-3 py-2 hover:bg-muted/60 transition-colors">
              <ChevronRight className="h-3.5 w-3.5 inline mr-1 text-emerald-600" /> {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m, go }: { m: ChatMessage; go: (n: NavState) => void }) {
  const isUser = m.role === "user";
  const ev = m.evidenceType ? EVIDENCE_BADGE[m.evidenceType] ?? null : null;
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[88%] sm:max-w-[78%] rounded-lg px-3 py-2 text-sm ${isUser ? "bg-emerald-600 text-white" : "bg-muted text-foreground"}`}>
        <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
        {!isUser && m.citations && m.citations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
            {ev && <Badge className={`text-[10px] ${ev.cls}`}>{ev.label}</Badge>}
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Sources</p>
            {m.citations.map((c, i) => (
              <CitationCard key={i} c={c} go={go} />
            ))}
          </div>
        )}
        {!isUser && (!m.citations || m.citations.length === 0) && ev && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <Badge className={`text-[10px] ${ev.cls}`}>{ev.label}</Badge>
          </div>
        )}
        {!isUser && (
          <div className="mt-1 flex justify-end">
            <button
              onClick={() => { navigator.clipboard?.writeText(m.content); toast.success("Copied"); }}
              className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CitationCard({ c, go }: { c: Citation; go: (n: NavState) => void }) {
  return (
    <button
      onClick={() => go({ view: "documents", documentId: c.documentId })}
      className="w-full text-left flex gap-2 rounded-md border bg-background/60 hover:bg-background px-2 py-1.5 transition-colors"
    >
      <Quote className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] font-medium truncate flex items-center gap-1">
          <FileText className="h-3 w-3" /> {c.documentName}
          <span className="text-muted-foreground">· chunk #{c.chunkIndex}</span>
          {c.page != null && <span className="text-muted-foreground">· p.{c.page}</span>}
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">{c.snippet}</p>
      </div>
    </button>
  );
}
