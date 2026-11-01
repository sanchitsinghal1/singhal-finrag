"use client";
import { jsxDEV as jsxDEV_7x81h0kn } from "react/jsx-dev-runtime";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api-client";
import { timeAgo } from "@/lib/format";
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
const EVIDENCE_BADGE = {
  documents: { label: "from documents", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  market_data: { label: "from market data", cls: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  both: { label: "documents + market", cls: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
  none: { label: "no evidence", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" }
};
export function ResearchView({ go, initialConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(initialConversationId ?? null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [docs, setDocs] = useState([]);
  const [scopeCompany, setScopeCompany] = useState("__none__");
  const [scopeDoc, setScopeDoc] = useState("__none__");
  const scrollRef = useRef(null);
  const loadConversations = useCallback(async () => {
    setLoadingConv(true);
    try {
      const [c, d, dc] = await Promise.all([
        api.get("/api/conversations"),
        api.get("/api/companies"),
        api.get("/api/documents?limit=50&status=ready")
      ]);
      setConversations(c.conversations);
      setCompanies(d.companies);
      setDocs(dc.items);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingConv(false);
    }
  }, []);
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    (async () => {
      setLoadingMsgs(true);
      try {
        const data = await api.get(`/api/conversations/${activeId}`);
        setMessages(data.messages);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoadingMsgs(false);
      }
    })();
  }, [activeId]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);
  const createConversation = async () => {
    try {
      const body = {};
      if (scopeCompany !== "__none__")
        body.companyId = scopeCompany;
      if (scopeDoc !== "__none__")
        body.documentId = scopeDoc;
      const res = await api.post("/api/conversations", body);
      await loadConversations();
      setActiveId(res.id);
      setScopeCompany("__none__");
      setScopeDoc("__none__");
    } catch (err) {
      toast.error(err.message);
    }
  };
  const ask = async (question) => {
    if (!question.trim() || busy)
      return;
    let conversationId = activeId;
    if (!conversationId) {
      try {
        const body = {};
        if (scopeCompany !== "__none__")
          body.companyId = scopeCompany;
        if (scopeDoc !== "__none__")
          body.documentId = scopeDoc;
        const res = await api.post("/api/conversations", body);
        conversationId = res.id;
        setActiveId(res.id);
        await loadConversations();
      } catch (err) {
        toast.error(err.message);
        return;
      }
    }
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content: question, createdAt: new Date().toISOString() }]);
    setInput("");
    setBusy(true);
    try {
      const body = {
        question,
        conversationId
      };
      if (scopeCompany !== "__none__")
        body.companyId = scopeCompany;
      if (scopeDoc !== "__none__")
        body.documentId = scopeDoc;
      const res = await api.post("/api/rag/query", body);
      setMessages((m) => [
        ...m.filter((x) => x.id !== tempId),
        { id: "u-" + tempId, role: "user", content: question, createdAt: new Date().toISOString() },
        { id: res.messageId ?? "a-" + tempId, role: "assistant", content: res.answer, citations: res.citations, evidenceType: res.evidenceType, createdAt: new Date().toISOString() }
      ]);
      await loadConversations();
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  const deleteConv = async (id) => {
    if (!confirm("Delete this conversation?"))
      return;
    try {
      await api.del(`/api/conversations/${id}`);
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      setConversations((c) => c.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };
  return jsxDEV_7x81h0kn("div", {
    className: "space-y-4",
    children: [
      jsxDEV_7x81h0kn("div", {
        className: "flex items-center justify-between gap-3 flex-wrap",
        children: [
          jsxDEV_7x81h0kn("div", {
            children: [
              jsxDEV_7x81h0kn("h1", {
                className: "text-2xl font-bold tracking-tight",
                children: "Research"
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn("p", {
                className: "text-sm text-muted-foreground mt-1",
                children: "Ask evidence-grounded questions. Answers cite the exact chunks they used."
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn(Button, {
            onClick: createConversation,
            className: "bg-emerald-600 hover:bg-emerald-700",
            children: [
              jsxDEV_7x81h0kn(Plus, {
                className: "h-4 w-4 mr-1"
              }, undefined, false, undefined, this),
              " New conversation"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      jsxDEV_7x81h0kn("div", {
        className: "grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4",
        children: [
          jsxDEV_7x81h0kn(Card, {
            className: "hidden lg:block",
            children: [
              jsxDEV_7x81h0kn(CardHeader, {
                className: "pb-2",
                children: jsxDEV_7x81h0kn(CardTitle, {
                  className: "text-sm flex items-center gap-2",
                  children: [
                    jsxDEV_7x81h0kn(MessagesSquare, {
                      className: "h-4 w-4"
                    }, undefined, false, undefined, this),
                    " Conversations"
                  ]
                }, undefined, true, undefined, this)
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn(CardContent, {
                className: "p-0",
                children: jsxDEV_7x81h0kn(ConversationList, {
                  conversations,
                  activeId,
                  loading: loadingConv,
                  onSelect: setActiveId,
                  onDelete: deleteConv
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn("div", {
            className: "lg:hidden",
            children: jsxDEV_7x81h0kn(Sheet, {
              children: [
                jsxDEV_7x81h0kn(SheetTrigger, {
                  asChild: true,
                  children: jsxDEV_7x81h0kn(Button, {
                    variant: "outline",
                    size: "sm",
                    children: [
                      jsxDEV_7x81h0kn(PanelLeft, {
                        className: "h-4 w-4 mr-1"
                      }, undefined, false, undefined, this),
                      " Conversations"
                    ]
                  }, undefined, true, undefined, this)
                }, undefined, false, undefined, this),
                jsxDEV_7x81h0kn(SheetContent, {
                  side: "left",
                  className: "w-[280px]",
                  children: jsxDEV_7x81h0kn("div", {
                    className: "mt-4",
                    children: jsxDEV_7x81h0kn(ConversationList, {
                      conversations,
                      activeId,
                      loading: loadingConv,
                      onSelect: (id) => {
                        setActiveId(id);
                      },
                      onDelete: deleteConv
                    }, undefined, false, undefined, this)
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn(Card, {
            className: "flex flex-col h-[72vh] min-h-[420px]",
            children: [
              jsxDEV_7x81h0kn("div", {
                className: "border-b p-3 grid grid-cols-1 sm:grid-cols-2 gap-2",
                children: [
                  jsxDEV_7x81h0kn("div", {
                    className: "space-y-1",
                    children: [
                      jsxDEV_7x81h0kn(Label, {
                        className: "text-[11px] text-muted-foreground",
                        children: "Scope to company (optional)"
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn(Select, {
                        value: scopeCompany,
                        onValueChange: setScopeCompany,
                        children: [
                          jsxDEV_7x81h0kn(SelectTrigger, {
                            className: "h-8 text-xs",
                            children: jsxDEV_7x81h0kn(SelectValue, {
                              placeholder: "None"
                            }, undefined, false, undefined, this)
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn(SelectContent, {
                            children: [
                              jsxDEV_7x81h0kn(SelectItem, {
                                value: "__none__",
                                children: "— None —"
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
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  jsxDEV_7x81h0kn("div", {
                    className: "space-y-1",
                    children: [
                      jsxDEV_7x81h0kn(Label, {
                        className: "text-[11px] text-muted-foreground",
                        children: "Scope to document (optional)"
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn(Select, {
                        value: scopeDoc,
                        onValueChange: setScopeDoc,
                        children: [
                          jsxDEV_7x81h0kn(SelectTrigger, {
                            className: "h-8 text-xs",
                            children: jsxDEV_7x81h0kn(SelectValue, {
                              placeholder: "None"
                            }, undefined, false, undefined, this)
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn(SelectContent, {
                            children: [
                              jsxDEV_7x81h0kn(SelectItem, {
                                value: "__none__",
                                children: "— None —"
                              }, undefined, false, undefined, this),
                              docs.map((d) => jsxDEV_7x81h0kn(SelectItem, {
                                value: d.id,
                                children: d.originalName
                              }, d.id, false, undefined, this))
                            ]
                          }, undefined, true, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn("div", {
                ref: scrollRef,
                className: "flex-1 overflow-y-auto p-4 space-y-4",
                children: [
                  loadingMsgs ? jsxDEV_7x81h0kn("div", {
                    className: "space-y-3",
                    children: Array.from({ length: 3 }).map((_, i) => jsxDEV_7x81h0kn(Skeleton, {
                      className: "h-16"
                    }, i, false, undefined, this))
                  }, undefined, false, undefined, this) : messages.length === 0 ? jsxDEV_7x81h0kn(EmptyChat, {
                    onPick: (q) => setInput(q)
                  }, undefined, false, undefined, this) : messages.map((m) => jsxDEV_7x81h0kn(MessageBubble, {
                    m,
                    go
                  }, m.id, false, undefined, this)),
                  busy && jsxDEV_7x81h0kn("div", {
                    className: "flex items-center gap-2 text-sm text-muted-foreground",
                    children: [
                      jsxDEV_7x81h0kn(Loader2, {
                        className: "h-4 w-4 animate-spin"
                      }, undefined, false, undefined, this),
                      " Retrieving relevant chunks & generating an answer…"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn("form", {
                onSubmit: (e) => {
                  e.preventDefault();
                  ask(input);
                },
                className: "border-t p-3 flex gap-2",
                children: [
                  jsxDEV_7x81h0kn(Input, {
                    value: input,
                    onChange: (e) => setInput(e.target.value),
                    placeholder: "Ask a question grounded in your documents…",
                    disabled: busy
                  }, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn(Button, {
                    type: "submit",
                    disabled: busy || !input.trim(),
                    className: "bg-emerald-600 hover:bg-emerald-700",
                    children: busy ? jsxDEV_7x81h0kn(Loader2, {
                      className: "h-4 w-4 animate-spin"
                    }, undefined, false, undefined, this) : jsxDEV_7x81h0kn(Send, {
                      className: "h-4 w-4"
                    }, undefined, false, undefined, this)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function ConversationList({ conversations, activeId, loading, onSelect, onDelete }) {
  if (loading)
    return jsxDEV_7x81h0kn("div", {
      className: "p-3 space-y-2",
      children: Array.from({ length: 4 }).map((_, i) => jsxDEV_7x81h0kn(Skeleton, {
        className: "h-12"
      }, i, false, undefined, this))
    }, undefined, false, undefined, this);
  if (conversations.length === 0)
    return jsxDEV_7x81h0kn("div", {
      className: "p-4 text-xs text-muted-foreground",
      children: "No conversations yet. Ask a question to start one."
    }, undefined, false, undefined, this);
  return jsxDEV_7x81h0kn("ul", {
    className: "max-h-[60vh] overflow-y-auto",
    children: conversations.map((c) => jsxDEV_7x81h0kn("li", {
      className: `group flex items-center gap-2 px-3 py-2 border-b cursor-pointer hover:bg-muted/50 ${activeId === c.id ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`,
      onClick: () => onSelect(c.id),
      children: [
        jsxDEV_7x81h0kn("div", {
          className: "min-w-0 flex-1",
          children: [
            jsxDEV_7x81h0kn("div", {
              className: "text-sm font-medium truncate",
              children: c.title
            }, undefined, false, undefined, this),
            jsxDEV_7x81h0kn("div", {
              className: "text-[11px] text-muted-foreground truncate",
              children: c.lastMessage || "No messages"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        jsxDEV_7x81h0kn("button", {
          onClick: (e) => {
            e.stopPropagation();
            onDelete(c.id);
          },
          className: "opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700",
          "aria-label": "Delete conversation",
          children: jsxDEV_7x81h0kn(Trash2, {
            className: "h-4 w-4"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, c.id, true, undefined, this))
  }, undefined, false, undefined, this);
}
function EmptyChat({ onPick }) {
  const suggestions = [
    "Sanchit, what are the key risks mentioned in this annual report?",
    "What does the report say about revenue and margin growth?",
    "Compare the margin trend across the last two reporting periods.",
    "List the main business segments and their revenue contributions."
  ];
  return jsxDEV_7x81h0kn("div", {
    className: "h-full grid place-items-center text-center",
    children: jsxDEV_7x81h0kn("div", {
      className: "max-w-md space-y-4",
      children: [
        jsxDEV_7x81h0kn("div", {
          className: "h-12 w-12 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 grid place-items-center mx-auto",
          children: jsxDEV_7x81h0kn(MessagesSquare, {
            className: "h-6 w-6"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        jsxDEV_7x81h0kn("div", {
          children: [
            jsxDEV_7x81h0kn("h3", {
              className: "font-semibold",
              children: "Ask anything grounded in your documents"
            }, undefined, false, undefined, this),
            jsxDEV_7x81h0kn("p", {
              className: "text-sm text-muted-foreground mt-1",
              children: "Answers cite the exact text they used. If evidence is missing, the assistant says so — it won't invent figures."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        jsxDEV_7x81h0kn("div", {
          className: "grid gap-2",
          children: suggestions.map((s) => jsxDEV_7x81h0kn("button", {
            onClick: () => onPick(s),
            className: "text-left text-sm border rounded-md px-3 py-2 hover:bg-muted/60 transition-colors",
            children: [
              jsxDEV_7x81h0kn(ChevronRight, {
                className: "h-3.5 w-3.5 inline mr-1 text-emerald-600"
              }, undefined, false, undefined, this),
              " ",
              s
            ]
          }, s, true, undefined, this))
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function MessageBubble({ m, go }) {
  const isUser = m.role === "user";
  const ev = m.evidenceType ? EVIDENCE_BADGE[m.evidenceType] ?? null : null;
  return jsxDEV_7x81h0kn("div", {
    className: `flex ${isUser ? "justify-end" : "justify-start"}`,
    children: jsxDEV_7x81h0kn("div", {
      className: `max-w-[88%] sm:max-w-[78%] rounded-lg px-3 py-2 text-sm ${isUser ? "bg-emerald-600 text-white" : "bg-muted text-foreground"}`,
      children: [
        jsxDEV_7x81h0kn("div", {
          className: "whitespace-pre-wrap leading-relaxed",
          children: m.content
        }, undefined, false, undefined, this),
        !isUser && m.citations && m.citations.length > 0 && jsxDEV_7x81h0kn("div", {
          className: "mt-2 pt-2 border-t border-border/50 space-y-1.5",
          children: [
            ev && jsxDEV_7x81h0kn(Badge, {
              className: `text-[10px] ${ev.cls}`,
              children: ev.label
            }, undefined, false, undefined, this),
            jsxDEV_7x81h0kn("p", {
              className: "text-[10px] uppercase tracking-wide text-muted-foreground font-semibold",
              children: "Sources"
            }, undefined, false, undefined, this),
            m.citations.map((c, i) => jsxDEV_7x81h0kn(CitationCard, {
              c,
              go
            }, i, false, undefined, this))
          ]
        }, undefined, true, undefined, this),
        !isUser && (!m.citations || m.citations.length === 0) && ev && jsxDEV_7x81h0kn("div", {
          className: "mt-2 pt-2 border-t border-border/50",
          children: jsxDEV_7x81h0kn(Badge, {
            className: `text-[10px] ${ev.cls}`,
            children: ev.label
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        !isUser && jsxDEV_7x81h0kn("div", {
          className: "mt-1 flex justify-end",
          children: jsxDEV_7x81h0kn("button", {
            onClick: () => {
              navigator.clipboard?.writeText(m.content);
              toast.success("Copied");
            },
            className: "text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1",
            children: [
              jsxDEV_7x81h0kn(Copy, {
                className: "h-3 w-3"
              }, undefined, false, undefined, this),
              " Copy"
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function CitationCard({ c, go }) {
  return jsxDEV_7x81h0kn("button", {
    onClick: () => go({ view: "documents", documentId: c.documentId }),
    className: "w-full text-left flex gap-2 rounded-md border bg-background/60 hover:bg-background px-2 py-1.5 transition-colors",
    children: [
      jsxDEV_7x81h0kn(Quote, {
        className: "h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0"
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("div", {
        className: "min-w-0",
        children: [
          jsxDEV_7x81h0kn("div", {
            className: "text-[11px] font-medium truncate flex items-center gap-1",
            children: [
              jsxDEV_7x81h0kn(FileText, {
                className: "h-3 w-3"
              }, undefined, false, undefined, this),
              " ",
              c.documentName,
              jsxDEV_7x81h0kn("span", {
                className: "text-muted-foreground",
                children: [
                  "· chunk #",
                  c.chunkIndex
                ]
              }, undefined, true, undefined, this),
              c.page != null && jsxDEV_7x81h0kn("span", {
                className: "text-muted-foreground",
                children: [
                  "· p.",
                  c.page
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn("p", {
            className: "text-[11px] text-muted-foreground line-clamp-2 leading-snug",
            children: c.snippet
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
