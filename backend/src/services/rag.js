// RAG service — the heart of the application.
// Ported from src/lib/rag.ts. Prisma -> Mongoose. Same pipeline + grounding rules.
// retrieve() enforces ownership at the query layer (FinancialDocument.ownerId
// filter BEFORE any chunk reaches the LLM prompt).
import { DocumentChunk } from "../models/DocumentChunk.js";
import { FinancialDocument } from "../models/FinancialDocument.js";
import { StockSnapshot } from "../models/StockSnapshot.js";
import { Company } from "../models/Company.js";
import { Message } from "../models/Message.js";
import { buildTfVector, computeIdf, cosineTfidf, deserialize } from "./embedding.js";
import { getZai } from "./zai.js";

export async function retrieve(question, opts) {
  const topK = opts.topK ?? 5;

  // Ownership-scoped candidate set: only the user's READY documents,
  // optionally narrowed by company/document. This filter is the security
  // boundary — the LLM cannot see chunks that don't pass it.
  const docFilter = {
    ownerId: opts.ownerId,
    status: "ready",
    ...(opts.documentId ? { _id: opts.documentId } : {}),
    ...(opts.companyId ? { companyId: opts.companyId } : {}),
  };
  const docIds = (await FinancialDocument.find(docFilter).distinct("_id"));

  if (docIds.length === 0) return [];

  const chunks = await DocumentChunk.find({ documentId: { $in: docIds } })
    .populate("documentId"); // field is `documentId`; populated doc lives on chunk.documentId

  const queryVec = buildTfVector(question);
  const chunkVecs = chunks.map((c) => deserialize(c.embedding));
  const idf = computeIdf(chunkVecs);

  const scored = chunks
    .map((c, i) => ({ chunk: c, score: cosineTfidf(queryVec, chunkVecs[i], idf) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored
    .filter((s) => s.score > 0.001)
    .map((s) => ({
      chunk: s.chunk,
      score: s.score,
      snippet: makeSnippet(s.chunk.text, question),
    }));
}

function makeSnippet(text, question) {
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

function buildSystemPrompt(retrieved, snapshot) {
  const context = retrieved
    .map((r, i) => {
      const docName = r.chunk.documentId?.originalName ?? "Unknown document";
      const page = r.chunk.page ? ` (p.${r.chunk.page})` : "";
      return `--- CONTEXT [Doc ${i + 1}] "${docName}"${page} ---\n${r.chunk.text}`;
    })
    .join("\n\n");

  const market = snapshot
    ? `\n\n--- MARKET SNAPSHOT (${snapshot.companyId?.symbol ?? ""}) ---\n` +
      `Price: ${snapshot.price ?? "n/a"} ${snapshot.currency ?? ""} | Change: ${snapshot.changePercent ?? "n/a"}% | ` +
      `P/E: ${snapshot.peRatio ?? "n/a"} | EPS: ${snapshot.eps ?? "n/a"} | ` +
      `52w range: ${snapshot.week52Low ?? "n/a"} - ${snapshot.week52High ?? "n/a"}\n` +
      `Summary: ${snapshot.summary ?? "n/a"}\n` +
      `Source: ${snapshot.source} @ ${snapshot.fetchedAt.toISOString()}`
    : "";

  return {
    role: "assistant",
    content:
      `You are a careful financial research assistant embedded in a Stock Intelligence app.\n` +
      `You answer the user's question using ONLY the context below. You may also use the market snapshot, but clearly label any figure that comes from market data versus the documents.\n\n` +
      `Rules:\n` +
      `1. If the answer is supported by the provided documents, cite it as [Doc n] where n matches the context numbering.\n` +
      `2. If the context does not contain enough information, say exactly: "I don't have enough information in the provided documents to answer this." Do NOT guess or use outside knowledge for specific financial figures.\n` +
      `3. Never invent numbers, dates, ratios or company facts that are not in the context or snapshot.\n` +
      `4. Distinguish facts (from documents/market data) from interpretation (your reasoning). Mark interpretation explicitly.\n` +
      `5. Keep answers concise and well-structured with short paragraphs or bullet points.\n` +
      (retrieved.length ? `\n${context}\n` : `\n(No documents were retrieved for this question.)\n`) +
      market,
  };
}

export async function answer(question, opts) {
  const retrieved = await retrieve(question, opts);

  let snapshot = null;
  if (opts.companyId) {
    snapshot = await StockSnapshot.findOne({ companyId: opts.companyId })
      .sort({ fetchedAt: -1 })
      .populate({ path: "companyId", select: "symbol name" });
  }

  const system = buildSystemPrompt(retrieved, snapshot);

  const messages = [system];
  if (opts.history && opts.history.length) {
    for (const m of opts.history.slice(-6)) messages.push(m);
  }
  messages.push({ role: "user", content: question });

  let llmText;
  try {
    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });
    llmText = completion.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("[rag] LLM call failed:", err.message);
    throw new Error("The AI service is unavailable right now. Please try again.");
  }

  const hasDoc = retrieved.length > 0;
  const hasMarket = !!snapshot;
  const evidenceType = hasDoc && hasMarket ? "both" : hasDoc ? "documents" : hasMarket ? "market_data" : "none";

  const citations = retrieved.map((r) => ({
    documentId: String(r.chunk.documentId._id ?? r.chunk.documentId),
    documentName: r.chunk.documentId?.originalName ?? "Document",
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

export async function loadHistory(conversationId) {
  const msgs = await Message.find({ conversationId }).sort({ createdAt: 1 }).limit(12);
  return msgs
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
}
