// =====================================================================
// RAG service — the heart of the application.
// ---------------------------------------------------------------------
// Pipeline (see docs/RAG_GUIDE_HI_EN.md for a full walkthrough):
//   1. receiveQuestion   -> validate & normalise the user's question
//   2. retrieve          -> build query TF vector, compute IDF over the
//                           candidate chunk corpus, cosine-rank, take top-K
//   3. buildPrompt       -> stuff the best chunks + market snapshot into a
//                           grounded system prompt with strict citation
//                           rules
//   4. answer            -> call the LLM (z-ai-web-dev-sdk)
//   5. attachCitations   -> return answer + structured source list +
//                           provenance flag ("documents" | "market_data" | ...)
//
// IMPORTANT: the LLM is told to ONLY use the provided context and to say
// "I don't have enough information" when evidence is insufficient. We do
// NOT hardcode any answer — every answer depends on real retrieved text.
// =====================================================================

import { db } from "@/lib/db";
import {
  buildTfVector,
  computeIdf,
  cosineTfidf,
  deserialize,
  type SparseVector,
} from "@/lib/embedding";
import { getZai } from "@/lib/zai";
import type { DocumentChunk, FinancialDocument, StockSnapshot, User } from "@prisma/client";

export interface RetrievedChunk {
  chunk: DocumentChunk & { document?: FinancialDocument | null };
  score: number;
  snippet: string;
}

export interface RagAnswer {
  answer: string;
  citations: Citation[];
  evidenceType: "documents" | "market_data" | "both" | "none";
  retrievedCount: number;
  topScore: number;
}

export interface Citation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  page?: number;
  snippet: string;
  score: number;
}

// 1 + 2 ----------------------------------------------------------------
// Retrieve the most relevant chunks for a question. Access control:
// only chunks belonging to the calling user (and optionally a company /
// document scope) are considered — see the ownerId filter.
export async function retrieve(
  question: string,
  opts: { ownerId: string; companyId?: string; documentId?: string; topK?: number }
): Promise<RetrievedChunk[]> {
  const topK = opts.topK ?? 5;

  // Candidate set: all of the user's READY chunks, optionally narrowed.
  const where: Record<string, unknown> = {
    document: {
      ownerId: opts.ownerId,
      status: "ready",
      ...(opts.documentId ? { id: opts.documentId } : {}),
      ...(opts.companyId ? { companyId: opts.companyId } : {}),
    },
  };

  const chunks = await db.documentChunk.findMany({
    where,
    include: { document: true },
  });
  if (chunks.length === 0) return [];

  // Build sparse vectors: query + each candidate.
  const queryVec = buildTfVector(question);
  const chunkVecs = chunks.map((c) => deserialize(c.embedding));
  const idf = computeIdf(chunkVecs);

  // Score every candidate and keep the top-K.
  const scored = chunks
    .map((c, i) => {
      const score = cosineTfidf(queryVec, chunkVecs[i], idf);
      return { chunk: c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // Drop near-zero matches — they add noise without real evidence.
  return scored
    .filter((s) => s.score > 0.001)
    .map((s) => ({
      chunk: s.chunk,
      score: s.score,
      snippet: makeSnippet(s.chunk.text, question),
    }));
}

// Pick a ~240-char window around the first query term hit for the citation
// preview — gives users a readable excerpt instead of a hard mid-sentence cut.
function makeSnippet(text: string, question: string): string {
  const t = text.trim();
  if (t.length <= 260) return t;
  const qtokens = question.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  let pos = -1;
  for (const w of qtokens) {
    const i = t.toLowerCase().indexOf(w);
    if (i >= 0) { pos = i; break; }
  }
  if (pos < 0) pos = 0;
  const start = Math.max(0, pos - 120);
  const end = Math.min(t.length, start + 260);
  return (start > 0 ? "… " : "") + t.slice(start, end) + (end < t.length ? " …" : "");
}

// 3 --------------------------------------------------------------------
// Build the grounded prompt. We explicitly tell the model:
//   - answer ONLY from the provided context
//   - cite sources as [Doc n] markers
//   - if evidence is missing, say so — never fabricate financial facts
function buildSystemPrompt(retrieved: RetrievedChunk[], snapshot?: StockSnapshot & { company?: { symbol: string; name: string } | null }) {
  const context = retrieved
    .map((r, i) => {
      const docName = r.chunk.document?.originalName ?? "Unknown document";
      const page = r.chunk.page ? ` (p.${r.chunk.page})` : "";
      return `--- CONTEXT [Doc ${i + 1}] "${docName}"${page} ---\n${r.chunk.text}`;
    })
    .join("\n\n");

  const market = snapshot
    ? `\n\n--- MARKET SNAPSHOT (${snapshot.company?.symbol ?? ""}) ---\n` +
      `Price: ${snapshot.price ?? "n/a"} ${snapshot.currency ?? ""} | Change: ${snapshot.changePercent ?? "n/a"}% | ` +
      `P/E: ${snapshot.peRatio ?? "n/a"} | EPS: ${snapshot.eps ?? "n/a"} | ` +
      `52w range: ${snapshot.week52Low ?? "n/a"} - ${snapshot.week52High ?? "n/a"}\n` +
      `Summary: ${snapshot.summary ?? "n/a"}\n` +
      `Source: ${snapshot.source} @ ${snapshot.fetchedAt.toISOString()}`
    : "";

  return {
    role: "assistant" as const,
    content:
      `You are a careful financial research assistant embedded in a Stock Intelligence app.\n` +
      `You answer the user's question using ONLY the context below. You may also use the market snapshot, but clearly label any figure that comes from market data versus the documents.\n\n` +
      `Rules:\n` +
      `1. If the answer is supported by the provided documents, cite it as [Doc n] where n matches the context numbering.\n` +
      `2. If the context does not contain enough information, say exactly: "I don't have enough information in the provided documents to answer this." Do NOT guess or use outside knowledge for specific financial figures.\n` +
      `3. Never invent numbers, dates, ratios or company facts that are not in the context or snapshot.\n` +
      `4. Distinguish facts (from documents/market data) from interpretation (your reasoning). Mark interpretation explicitly.\n` +
      `5. Keep answers concise and well-structured with short paragraphs or bullet points.\n` +
      (retrieved.length
        ? `\n${context}\n`
        : `\n(No documents were retrieved for this question.)\n`) +
      market,
  };
}

// 4 + 5 ----------------------------------------------------------------
export async function answer(
  question: string,
  opts: {
    ownerId: string;
    companyId?: string;
    documentId?: string;
    history?: { role: "user" | "assistant"; content: string }[];
  }
): Promise<RagAnswer> {
  const retrieved = await retrieve(question, opts);

  // Pull a market snapshot if a company is in scope (for grounding figures).
  let snapshot: (StockSnapshot & { company?: { symbol: string; name: string } | null }) | null = null;
  if (opts.companyId) {
    snapshot = await db.stockSnapshot.findFirst({
      where: { companyId: opts.companyId },
      orderBy: { fetchedAt: "desc" },
      include: { company: { select: { symbol: true, name: true } } },
    });
  }

  const system = buildSystemPrompt(retrieved, snapshot ?? undefined);

  // Conversation history (kept short to stay well under token limits).
  const messages: { role: "assistant" | "user"; content: string }[] = [system];
  if (opts.history && opts.history.length) {
    // Keep only the most recent 6 turns for context.
    for (const m of opts.history.slice(-6)) messages.push(m);
  }
  messages.push({ role: "user", content: question });

  let llmText: string;
  try {
    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });
    llmText = completion.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("[rag] LLM call failed:", (err as Error).message);
    throw new Error("The AI service is unavailable right now. Please try again.");
  }

  // Provenance flag for the UI.
  const hasDoc = retrieved.length > 0;
  const hasMarket = !!snapshot;
  const evidenceType: RagAnswer["evidenceType"] = hasDoc && hasMarket
    ? "both"
    : hasDoc ? "documents" : hasMarket ? "market_data" : "none";

  const citations: Citation[] = retrieved.map((r) => ({
    documentId: r.chunk.documentId,
    documentName: r.chunk.document?.originalName ?? "Document",
    chunkIndex: r.chunk.chunkIndex,
    page: r.chunk.page ?? undefined,
    snippet: r.snippet,
    score: r.score,
  }));

  return {
    answer: llmText || "I don't have enough information in the provided documents to answer this.",
    citations,
    evidenceType,
    retrievedCount: retrieved.length,
    topScore: retrieved[0]?.score ?? 0,
  };
}

// Helper to fetch N most recent messages for a conversation, oldest-first,
// to pass as history to the LLM.
export async function loadHistory(conversationId: string) {
  const msgs = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 12,
  });
  return msgs
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}
