# Resume Project — Stock Intelligence RAG

> A polished reference for talking about this project in SDE interviews.
> Every claim below is grounded in the actual source code in this repo —
> nothing fabricated.

## Title

**Stock Intelligence RAG** — Evidence-grounded equity research workspace
with a complete Retrieval-Augmented Generation pipeline.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 +
  shadcn/ui
- **DB / ORM:** Prisma + SQLite (data model is MongoDB-Atlas-Vector-Search-ready)
- **Auth:** bcrypt + JWT in httpOnly cookies
- **AI:** z-ai-web-dev-sdk — LLM (grounded chat completions) + web_search
  (real market data)
- **RAG:** custom TF-IDF vectorizer + cosine similarity (zero external
  embedding dependency); PDF text extraction via `pdf-parse`
- **Charts:** Recharts; state: React Context + hooks

## Resume bullets (ATS-friendly, pick 3–5)

- Designed and implemented an end-to-end **Retrieval-Augmented Generation
  pipeline** for financial Q&A: PDF/text ingestion → sentence-aware
  chunking with overlap → per-chunk embedding → cosine-similarity retrieval
  → grounded LLM prompt with strict citation rules, returning answers with
  traceable `[Doc n]` source references.
- Built a **fully local, dependency-free embedding layer** (TF-IDF sparse
  vectors stored as JSON in the DB) and an in-app cosine-similarity ranker,
  engineered so the retrieval function can be swapped for MongoDB Atlas
  Vector Search or a transformer embedding API without touching the rest of
  the pipeline.
- Enforced **answer grounding & provenance**: the LLM is constrained to
  answer only from retrieved context, explicitly says "I don't have enough
  information" when evidence is missing, and every answer carries an
  `evidenceType` badge (`documents` / `market_data` / `both` / `none`)
  plus clickable citations linking back to the exact document chunk.
- Implemented **secure multi-tenant data access**: bcrypt + JWT-in-httpOnly-cookie
  auth, per-user ownership filtering on every documents/conversations/watchlists
  query, sha256 duplicate-upload detection, and 10 MB upload validation.
- Engineered **resilient market-data integration** via web search with a
  3-query fallback chain, 30-minute cache TTL, stale-cache fallback with a
  visible badge, and targeted regex parsers that reject implausible figures
  rather than inventing them.
- Shipped a polished, **responsive single-page workspace** (dashboard,
  company intelligence with charts, document library, research chat,
  watchlists, multi-company comparison, and AI-generated Bull/Bear + SWOT
  briefs) on one route with a sticky footer and full mobile/tablet/desktop
  layouts.

## How this differs from a basic MERN CRUD app

A typical MERN CRUD app does: create / read / update / delete records with a
generic UI. This project adds genuinely advanced engineering:

1. **A real RAG pipeline** — not a "chatbot that calls the LLM". Text is
   extracted, chunked with overlap, embedded, stored, retrieved by
   similarity, and injected into a grounded prompt with citation rules.
2. **A custom embedding + retrieval layer** — TF-IDF vectorizer, IDF
   computation, sparse cosine similarity — written from scratch and
   dependency-free, with a documented migration path to MongoDB Atlas
   Vector Search.
3. **Grounding & provenance discipline** — the LLM is forbidden from
   inventing financial figures; answers cite specific chunks; an
   `evidenceType` flag tells the user whether the answer came from their
   documents, market data, or both.
4. **Resilient external integration** — market data has a fallback query
   chain, a TTL cache, and graceful stale-cache degradation with a visible
   badge, plus sanity-checked parsers.
5. **Security & multi-tenancy** — httpOnly JWT cookies, ownership-scoped
   queries everywhere, duplicate detection, upload validation.

## RAG pipeline (concrete walkthrough for interviews)

When the user asks a question in the Research tab:

1. `POST /api/rag/query` (`src/app/api/rag/query/route.ts`) authenticates
   the user and loads conversation history.
2. `answer()` in `src/lib/rag.ts` calls `retrieve()`:
   - Candidate set = the user's READY `DocumentChunk`s (ownership-filtered,
     optionally scoped by company/document).
   - Query + each chunk are vectorised by `buildTfVector()` in
     `src/lib/embedding.ts` (lowercase, stopword-stripped token frequencies).
   - `computeIdf()` computes inverse-document-frequency over the candidate
     corpus.
   - `cosineTfidf()` ranks chunks; top-5 with score > 0.001 are kept.
3. If a company is in scope, the latest `StockSnapshot` is attached for
   grounding figures.
4. `buildSystemPrompt()` stuffs the chunks (numbered `[Doc n]` with names
   + pages) and the snapshot into a system prompt that forbids fabrication.
5. `zai.chat.completions.create({ messages, thinking: disabled })` returns
   the grounded answer.
6. The response is enriched with a `citations[]` array (documentId, name,
   chunkIndex, page, snippet, score) and an `evidenceType` provenance flag.
7. When a `conversationId` is present, the user message + assistant message
   (with the citation JSON) are persisted.

## Potential interview questions & answers

**Q: Why not just send the whole document to the LLM?**
A: Context-window limits aside, retrieval precision matters. A 200-page
10-K sent whole would (a) blow the token budget and (b) dilute the
relevant signal. Chunking + similarity retrieval surfaces only the
paragraphs that actually answer the question, which makes the answer more
accurate AND cheaper.

**Q: Why TF-IDF instead of transformer embeddings?**
A: For a portfolio project that should run on a laptop with zero external
dependencies, TF-IDF gives genuinely useful lexical-semantic retrieval for
financial Q&A. The data model (chunk text + JSON embedding + metadata) is
shaped to swap in a 384-dim transformer model or MongoDB Atlas Vector
Search by replacing only `embedQuery`/`embedChunk` and the retrieve
function — the rest of the pipeline is unchanged.

**Q: How do you prevent the LLM from hallucinating financial figures?**
A: Three layers. (1) The system prompt explicitly forbids using outside
knowledge for specific figures and mandates "I don't have enough
information…" when context is missing. (2) Retrieval filters near-zero
matches so noise doesn't reach the prompt. (3) Every answer carries
`evidenceType` and `citations[]` so the user can verify the source. We
never hardcode answers — if no chunks are retrieved, the LLM honestly
says so.

**Q: How is user data isolated?**
A: Every Prisma query on `FinancialDocument`, `Conversation`, `Watchlist`,
and `ResearchNote` filters by `ownerId`. The RAG retrieval candidate set
is `where: { document: { ownerId: <user>, status: 'ready' } }`, so user A
physically cannot retrieve chunks from user B's documents. The
`requireUser()` helper is the single auth chokepoint for protected routes.

**Q: How do you handle external API failures?**
A: The market-data service tries three progressively shorter search
queries; if all fail, it falls back to the stale cached snapshot and
returns a `stale: true` flag the UI shows as a badge. The LLM call is
wrapped in try/catch and surfaces a friendly "AI service unavailable"
error. Uploads that fail extraction record a `failed` status with an
error message instead of crashing.

**Q: How would you scale this?**
A: Swap SQLite for Postgres (or MongoDB Atlas for native vector search),
add Redis-backed rate limiting on auth/RAG endpoints, move to dense
embeddings via a transformer model + a real vector index, add a job queue
for ingestion so large PDFs don't block the request, and put the LLM
call behind a streaming endpoint + a circuit breaker.

## What was verified

- ✅ Register / login / logout (curl + browser)
- ✅ Document upload (.txt) → chunking → embedding → `ready` status
- ✅ RAG query returns grounded answer with `[Doc 1]` citation + snippet
- ✅ Insufficient-evidence path returns the honest "I don't have enough
  information…" message with `evidenceType: "none"`
- ✅ Market snapshot fetch with targeted parsers (price, P/E, EPS, market
  cap, 52w range) + stale-cache fallback badge
- ✅ Company detail chart + fundamentals render
- ✅ Analysis: Bull/Bear brief grounded on market snapshot with
  `[market data]` / `[analyst interpretation]` tags
- ✅ Responsive layout + sticky footer at mobile width

## What was NOT verified (be transparent)

- PDF extraction on a real scanned PDF (OCR is intentionally not enabled;
  the code path reports "No extractable text found" honestly).
- Dense transformer embeddings (the project uses TF-IDF by design; the
  upgrade path is documented).
- Real-time tick data (web-sourced summaries only).
- Production rate limiting (the structure supports it; not yet wired).
- MongoDB Atlas Vector Search (SQLite is used in this sandbox; the
  migration steps are documented in `docs/DEPLOYMENT.md` and
  `docs/RAG_GUIDE_HI_EN.md`).

## File map (for deep-dive questions)

| Concern | File |
|---|---|
| RAG pipeline | `src/lib/rag.ts` |
| Embeddings + chunking | `src/lib/embedding.ts` |
| Ingestion (extract → chunk → embed → persist) | `src/lib/ingest.ts` |
| Market data + cache | `src/lib/market-data.ts` |
| Auth | `src/lib/auth.ts` |
| API envelope + error handling | `src/lib/api-response.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Research chat UI (citations) | `src/components/views/research.tsx` |
| Company detail UI | `src/components/views/companies.tsx` |
| RAG endpoint | `src/app/api/rag/query/route.ts` |
