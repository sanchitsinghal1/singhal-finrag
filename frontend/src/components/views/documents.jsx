"use client";
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { api, uploadFile } from "@/lib/api-client";
import { fmtBytes, fmtCompact, timeAgo } from "@/lib/format";
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
export function DocumentsView({ go, nav }) {
  if (nav.documentId) {
    return jsxDEV_7x81h0kn(DocumentDetail, {
      go,
      documentId: nav.documentId
    }, undefined, false, undefined, this);
  }
  return jsxDEV_7x81h0kn(DocumentLibrary, {
    go
  }, undefined, false, undefined, this);
}
function DocumentLibrary({ go }) {
  const [docs, setDocs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [companyId, setCompanyId] = useState("__none__");
  const fileRef = useRef(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([
        api.get("/api/documents?limit=50"),
        api.get("/api/companies")
      ]);
      setDocs(d.items);
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
  const onUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData;
      fd.append("file", file);
      if (companyId !== "__none__")
        fd.append("companyId", companyId);
      const res = await uploadFile("/api/documents", fd);
      toast.success(res.message);
      setFile(null);
      setCompanyId("__none__");
      if (fileRef.current)
        fileRef.current.value = "";
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };
  const onDelete = async (id) => {
    if (!confirm("Delete this document and all its chunks?"))
      return;
    try {
      await api.del(`/api/documents/${id}`);
      toast.success("Deleted");
      setDocs((d) => d.filter((x) => x.id !== id));
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
            children: "Documents"
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn("p", {
            className: "text-sm text-muted-foreground mt-1",
            children: "Upload PDF / TXT / MD reports. We extract, chunk, embed and index them for RAG."
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
                  jsxDEV_7x81h0kn(Upload, {
                    className: "h-4 w-4"
                  }, undefined, false, undefined, this),
                  " Upload report"
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn(CardDescription, {
                children: "Max 10 MB · PDF, TXT, MD. Scanned PDFs without OCR will report “no extractable text”."
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn(CardContent, {
            children: jsxDEV_7x81h0kn("form", {
              onSubmit: onUpload,
              className: "grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3",
              children: [
                jsxDEV_7x81h0kn("div", {
                  className: "space-y-1.5",
                  children: [
                    jsxDEV_7x81h0kn(Label, {
                      htmlFor: "file",
                      children: "File"
                    }, undefined, false, undefined, this),
                    jsxDEV_7x81h0kn(Input, {
                      id: "file",
                      ref: fileRef,
                      type: "file",
                      accept: ".pdf,.txt,.md,application/pdf,text/plain,text/markdown",
                      onChange: (e) => setFile(e.target.files?.[0] ?? null)
                    }, undefined, false, undefined, this),
                    file && jsxDEV_7x81h0kn("p", {
                      className: "text-xs text-muted-foreground",
                      children: [
                        file.name,
                        " · ",
                        fmtBytes(file.size)
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                jsxDEV_7x81h0kn("div", {
                  className: "space-y-1.5",
                  children: [
                    jsxDEV_7x81h0kn(Label, {
                      htmlFor: "company",
                      children: "Company (optional)"
                    }, undefined, false, undefined, this),
                    jsxDEV_7x81h0kn(Select, {
                      value: companyId,
                      onValueChange: setCompanyId,
                      children: [
                        jsxDEV_7x81h0kn(SelectTrigger, {
                          id: "company",
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
                  className: "flex items-end",
                  children: jsxDEV_7x81h0kn(Button, {
                    type: "submit",
                    disabled: uploading || !file,
                    className: "bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto",
                    children: [
                      uploading ? jsxDEV_7x81h0kn(Loader2, {
                        className: "h-4 w-4 mr-1.5 animate-spin"
                      }, undefined, false, undefined, this) : jsxDEV_7x81h0kn(Upload, {
                        className: "h-4 w-4 mr-1.5"
                      }, undefined, false, undefined, this),
                      uploading ? "Processing…" : "Upload"
                    ]
                  }, undefined, true, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
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
                jsxDEV_7x81h0kn(FileText, {
                  className: "h-4 w-4"
                }, undefined, false, undefined, this),
                " Library"
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn(CardContent, {
            className: "p-0",
            children: loading ? jsxDEV_7x81h0kn("div", {
              className: "p-4 space-y-2",
              children: Array.from({ length: 4 }).map((_, i) => jsxDEV_7x81h0kn(Skeleton, {
                className: "h-16"
              }, i, false, undefined, this))
            }, undefined, false, undefined, this) : docs.length === 0 ? jsxDEV_7x81h0kn("div", {
              className: "p-8 text-center text-sm text-muted-foreground",
              children: "No documents yet. Upload your first report above."
            }, undefined, false, undefined, this) : jsxDEV_7x81h0kn("ul", {
              className: "divide-y",
              children: docs.map((d) => jsxDEV_7x81h0kn("li", {
                className: "flex items-center justify-between gap-3 p-3 hover:bg-muted/40 transition-colors",
                children: [
                  jsxDEV_7x81h0kn("button", {
                    onClick: () => go({ view: "documents", documentId: d.id }),
                    className: "flex items-start gap-3 min-w-0 text-left flex-1",
                    children: [
                      jsxDEV_7x81h0kn(FileText, {
                        className: "h-5 w-5 mt-0.5 text-muted-foreground shrink-0"
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn("div", {
                        className: "min-w-0",
                        children: [
                          jsxDEV_7x81h0kn("div", {
                            className: "text-sm font-medium truncate",
                            children: d.originalName
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn("div", {
                            className: "text-xs text-muted-foreground truncate",
                            children: [
                              fmtBytes(d.size),
                              " · ",
                              d.status === "ready" ? `${d.chunkCount} chunks · ${d.charCount.toLocaleString()} chars` : d.status,
                              d.company ? ` · ${d.company.symbol}` : "",
                              " · ",
                              timeAgo(d.uploadedAt)
                            ]
                          }, undefined, true, undefined, this),
                          d.status === "failed" && d.errorMessage && jsxDEV_7x81h0kn("div", {
                            className: "text-xs text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1",
                            children: [
                              jsxDEV_7x81h0kn(AlertTriangle, {
                                className: "h-3 w-3"
                              }, undefined, false, undefined, this),
                              " ",
                              d.errorMessage
                            ]
                          }, undefined, true, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  jsxDEV_7x81h0kn("div", {
                    className: "flex items-center gap-2 shrink-0",
                    children: [
                      jsxDEV_7x81h0kn(StatusPill, {
                        status: d.status
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn(Button, {
                        size: "icon",
                        variant: "ghost",
                        onClick: () => onDelete(d.id),
                        "aria-label": "Delete",
                        children: jsxDEV_7x81h0kn(Trash2, {
                          className: "h-4 w-4 text-red-500"
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, d.id, true, undefined, this))
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function DocumentDetail({ go, documentId }) {
  const [doc, setDoc] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.get(`/api/documents/${documentId}?chunkLimit=50`);
        setDoc(data.document);
        setChunks(data.chunks);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId]);
  if (loading)
    return jsxDEV_7x81h0kn(Skeleton, {
      className: "h-64"
    }, undefined, false, undefined, this);
  if (!doc)
    return jsxDEV_7x81h0kn("div", {
      children: "Not found."
    }, undefined, false, undefined, this);
  return jsxDEV_7x81h0kn("div", {
    className: "space-y-4",
    children: [
      jsxDEV_7x81h0kn("div", {
        className: "flex items-center justify-between gap-3",
        children: jsxDEV_7x81h0kn(Button, {
          variant: "ghost",
          size: "sm",
          onClick: () => go({ view: "documents" }),
          children: [
            jsxDEV_7x81h0kn(ArrowLeft, {
              className: "h-4 w-4 mr-1"
            }, undefined, false, undefined, this),
            " Back to library"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn(Card, {
        children: [
          jsxDEV_7x81h0kn(CardHeader, {
            children: [
              jsxDEV_7x81h0kn(CardTitle, {
                className: "flex items-center gap-2 text-base",
                children: [
                  jsxDEV_7x81h0kn(FileText, {
                    className: "h-4 w-4"
                  }, undefined, false, undefined, this),
                  " ",
                  doc.originalName
                ]
              }, undefined, true, undefined, this),
              jsxDEV_7x81h0kn(CardDescription, {
                children: [
                  fmtBytes(doc.size),
                  " · ",
                  doc.mimeType,
                  " · ",
                  doc.chunkCount,
                  " chunks · ",
                  doc.charCount.toLocaleString(),
                  " chars · uploaded ",
                  timeAgo(doc.uploadedAt),
                  doc.company ? ` · ${doc.company.symbol}` : ""
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          jsxDEV_7x81h0kn(CardContent, {
            children: [
              jsxDEV_7x81h0kn("div", {
                className: "flex items-center gap-2 mb-3",
                children: [
                  jsxDEV_7x81h0kn(StatusPill, {
                    status: doc.status
                  }, undefined, false, undefined, this),
                  doc.status === "ready" && jsxDEV_7x81h0kn(Badge, {
                    variant: "outline",
                    className: "text-[10px]",
                    children: [
                      jsxDEV_7x81h0kn(CheckCircle2, {
                        className: "h-3 w-3 mr-1"
                      }, undefined, false, undefined, this),
                      " Indexed for retrieval"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              doc.errorMessage && jsxDEV_7x81h0kn("div", {
                className: "text-xs text-red-600 dark:text-red-400",
                children: doc.errorMessage
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
              className: "text-base flex items-center gap-2",
              children: [
                jsxDEV_7x81h0kn(FileSearch, {
                  className: "h-4 w-4"
                }, undefined, false, undefined, this),
                " Chunks (",
                chunks.length,
                ")"
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          jsxDEV_7x81h0kn(CardContent, {
            className: "space-y-3 max-h-[60vh] overflow-y-auto pr-1",
            children: chunks.length === 0 ? jsxDEV_7x81h0kn("p", {
              className: "text-sm text-muted-foreground",
              children: "No chunks."
            }, undefined, false, undefined, this) : chunks.map((c) => jsxDEV_7x81h0kn("div", {
              className: "border rounded-md p-3 text-sm",
              children: [
                jsxDEV_7x81h0kn("div", {
                  className: "flex items-center gap-2 mb-1",
                  children: [
                    jsxDEV_7x81h0kn(Badge, {
                      variant: "secondary",
                      className: "text-[10px]",
                      children: [
                        "#",
                        c.chunkIndex
                      ]
                    }, undefined, true, undefined, this),
                    c.page != null && jsxDEV_7x81h0kn(Badge, {
                      variant: "outline",
                      className: "text-[10px]",
                      children: [
                        "p.",
                        c.page
                      ]
                    }, undefined, true, undefined, this),
                    jsxDEV_7x81h0kn("span", {
                      className: "text-[10px] text-muted-foreground",
                      children: [
                        c.charCount,
                        " chars · ~",
                        c.tokenCount,
                        " tokens"
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                jsxDEV_7x81h0kn("p", {
                  className: "text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-6",
                  children: c.text
                }, undefined, false, undefined, this)
              ]
            }, c.id, true, undefined, this))
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      jsxDEV_7x81h0kn(Card, {
        children: jsxDEV_7x81h0kn(CardContent, {
          className: "py-4",
          children: jsxDEV_7x81h0kn(Button, {
            onClick: () => go({ view: "research", conversationId: undefined }),
            variant: "outline",
            children: "Ask a question about this document"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function StatusPill({ status }) {
  const map = {
    ready: { label: "Ready", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", icon: CheckCircle2 },
    processing: { label: "Processing", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
    pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
    failed: { label: "Failed", cls: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300", icon: AlertTriangle }
  };
  const s = map[status] ?? map.pending;
  const Icon = s.icon;
  return jsxDEV_7x81h0kn("span", {
    className: `inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${s.cls}`,
    children: [
      Icon && jsxDEV_7x81h0kn(Icon, {
        className: "h-3 w-3"
      }, undefined, false, undefined, this),
      s.label
    ]
  }, undefined, true, undefined, this);
}
