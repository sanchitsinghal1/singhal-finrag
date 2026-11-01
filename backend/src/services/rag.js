// ============================================================================
// RAG Service — the heart of Singhal FinRAG
// ============================================================================
// This file implements the complete Retrieval-Augmented Generation pipeline.
// When a user asks a question, here's exactly what happens:
//
//   1. RETRIEVE  — find the most relevant document chunks for the question
//                  (TF-IDF cosine similarity over the user's OWN documents)
//   2. PROMPT    — build a grounded system prompt with the retrieved chunks
//                  + strict rules: "answer ONLY from this context, never invent"
//   3. LLM CALL  — send the prompt + conversation history to the AI model
//   4. CITE      — map the model's [Doc n] markers back to real source chunks
//                  and return structured citations + an evidenceType flag
//
// CRITICAL SECURITY DETAIL:
//   The retrieval candidate set is filtered by `document.ownerId` at the
//   MongoDB query layer (see retrieve() below). This means the LLM physically
//   CANNOT see another user's document chunks — they never reach the prompt.
//   This is enforced at the data-access boundary, not in the prompt text.
//
// Files this depends on:
//   - embedding.js   (TF-IDF vectorizer + cosine similarity + chunking)
//   - ingest.js      (how chunks got into MongoDB in the first place)
//   - zai.js         (the z-ai-web-dev-sdk singleton for the LLM call)
// ============================================================================

import { DocumentChunk } from "../models/DocumentChunk.js";
import { FinancialDocument } from "../models/FinancialDocument.js";
import { StockSnapshot } from "../models/StockSnapshot.js";
import { Message } from "../models/Message.js";
import { buildTfVector, computeIdf, cosineTfidf, deserialize } from "./embedding.js";
import { getZai } from "./zai.js";

// ---------------------------------------------------------------------------
// STEP 1: RETRIEVE — find the top-K most relevant chunks for a question.
// ---------------------------------------------------------------------------
// This is the "R" in RAG. We:
//   a) Find the user's READY documents (ownership-scoped — the security boundary)
//   b) Load all chunks belonging to those documents
//   c) Build a TF-IDF vector for the question + each chunk
//   d) Compute IDF over the candidate corpus (so rare terms score higher)
//   e) Rank chunks by cosine similarity, keep the top 5
//   f) Drop near-zero matches (they're noise, not real evidence)
export async function retrieve(question, opts) {
  const topK = opts.topK ?? 5;

  // (a) Ownership-scoped candidate documents.
  // ONLY this user's READY documents are considered. Another user's docs
  // are filtered out HERE — before any chunk reaches the LLM. This is the
  // multi-tenant isolation boundary.
  const docFilter = {
    ownerId: opts.ownerId,
    status: "ready",
    ...(opts.documentId ? { _id: opts.documentId } : {}),
    ...(opts.companyId ? { companyId: opts.companyId } : {}),
  };
  const docIds = await FinancialDocument.find(docFilter).distinct("_id");

  // If the user has no matching documents, there's nothing to retrieve.
  // The LLM will be told "no documents retrieved" and will honestly refuse.
  if (docIds.length === 0) return [];

  // (b) Load all chunks for those documents, populated with their parent doc.
  const chunks = await DocumentChunk.find({ documentId: { $in: docIds } })
    .populate("documentId"); // field is `documentId`; populated doc is on chunk.documentId

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
