# Architecture

## High-level overview

```
+---------------------------------------------------------+
|  Browser (single route "/")                              |
|  - AuthGate (login/register) when not signed in          |
|  - AppShell: header nav + 6 tab views + sticky footer   |
|    Dashboard | Companies | Documents | Research |        |
|    Watchlists | Analysis                                  |
+--------------------------|------------------------------+
                           | fetch (credentials: include)
                           v
+---------------------------------------------------------+
|  Next.js 16 App Router (port 3000)                       |
|  - React Server Components for static shell               |
|  - Route Handlers under /api/* for all backend logic     |
|  - "use client" components for interactive views          |
+--------|-------------|-------------|-------------|------+
         |             |             |             |
   /api/auth/*   /api/companies  /api/documents  /api/rag/query
   /api/market   /api/conversations  /api/watchlists  /api/analysis
         |             |             |             |
         v             v             v             v
+---------------------------------------------------------+
|  Service layer (src/lib/*)                                |
|  auth.ts          — bcrypt + JWT cookie                   |
|  ingest.ts        — PDF/TXT extraction + chunking + embed |
|  embedding.ts     — TF-IDF vectorizer + cosine similarity |
|  rag.ts           — retrieve → grounded prompt → LLM     |
|  market-data.ts   — web_search market fetch + cache       |
|  zai.ts           — z-ai-web-dev-sdk singleton            |
+--------|------------------------------------------------+
         |
         v
+---------------------------------------------------------+
|  Prisma ORM → SQLite (db/custom.db)                       |
|  User, Company, StockSnapshot, HistoricalPrice,           |
|  FinancialDocument, DocumentChunk, Conversation, Message,  |
|  Watchlist, WatchlistItem, ResearchNote                    |
+---------------------------------------------------------+
         |
         v
+---------------------------------------------------------+
|  External (z-ai-web-dev-sdk, backend only)                 |
|  - chat.completions.create  → grounded LLM answers        |
|  - functions.invoke('web_search') → real market data      |
+---------------------------------------------------------+
```

## Layering & responsibilities

- **`src/app/page.tsx`** — the only user-facing route. A client component
  that mounts `AuthProvider` and renders `AuthGate` or `AppShell`.
- **`src/components/views/*`** — six feature views. Each owns its data
  fetching and local UI state; navigation between them is in-app state
  (since only `/` is exposed).
- **`src/lib/api-client.ts`** — thin fetch wrapper enforcing the
  `{ success, data, message }` envelope and throwing typed `ApiError`s.
- **`src/app/api/*/route.ts`** — Route Handlers. Thin: validate input,
  call a service, return `jsonOk` / throw `ApiError`. Business logic stays
  in `src/lib/*` services so it's reusable and testable.
- **`src/lib/*.ts`** — services (auth, ingest, embedding, rag, market-data).
- **`src/lib/db.ts`** — single Prisma client (dev-safe singleton).

## Key design decisions

1. **One backend (Next.js Route Handlers), no separate Express.** Matches
   the sandbox constraint and keeps the mental model simple. Every
   endpoint is a `route.ts` file.
2. **Auth = JWT in an httpOnly cookie.** Self-contained, easy to read,
   avoids the NextAuth adapter setup overhead while staying secure
   (httpOnly + SameSite=Lax). `requireUser()` is the single chokepoint
   for protected routes.
3. **TF-IDF embeddings + cosine similarity (no external embedding API).**
   Makes the RAG pipeline 100% offline and dependency-free. The data model
   (`DocumentChunk.embedding` JSON string) is shaped to migrate to MongoDB
   Atlas Vector Search or a dense transformer model with one function swap.
4. **Honest grounding rules in the system prompt.** The LLM is explicitly
   told to say "I don't have enough information…" rather than fabricate —
   critical for a financial product.
5. **Market data via `web_search` with stale-cache fallback.** No paid
   market key is available in the sandbox; the app is transparent about
   provenance (`source`, `fetchedAt`, `stale` flag) and degrades to cached
   data with a visible badge instead of crashing.
6. **Ownership checks at the data-access layer.** Every query that
   touches `FinancialDocument`, `Conversation`, `Watchlist`, or
   `ResearchNote` filters by `ownerId`, so users cannot read each other's
   private documents or chats.

## Data model (Prisma)

See `prisma/schema.prisma`. Highlights:

- **User** — `email` unique, `passwordHash` (bcrypt), `role`.
- **Company** — `symbol` unique, seeded directory of 20 popular tickers;
  arbitrary symbols created lazily via `POST /api/companies`.
- **StockSnapshot** — append-only cache per company; `rawJson` keeps the
  full provider payload; indexed on `companyId`.
- **HistoricalPrice** — OHLC rows indexed on `[companyId, date]`.
- **FinancialDocument** — `ownerId`, `companyId?`, `status`
  (`pending|processing|ready|failed`), `textHash` (sha256 for dedup),
  `chunkCount`, `charCount`. Indexed on `ownerId`, `companyId`, `status`.
- **DocumentChunk** — `documentId`, `chunkIndex`, `text`, `page?`,
  `embedding` (JSON string of the TF-IDF sparse vector). Indexed on
  `documentId`. Cascade-deleted with the parent document.
- **Conversation / Message** — multi-turn chat; `Message.citations` is a
  JSON string of the citation array; `evidenceType` flags provenance.
- **Watchlist / WatchlistItem** — unique constraint on
  `[watchlistId, companyId]` prevents duplicates.
- **ResearchNote** — simple saved notes, optionally scoped to a company.

## Security posture

- bcrypt password hashing (cost 10).
- JWT signed with `JWT_SECRET` (dev fallback exists; production must
  override). 7-day TTL.
- Cookies: `HttpOnly`, `SameSite=Lax`, 7-day `Max-Age`.
- Upload validation: 10 MB max, allowlist of mime/extension.
- Per-user ownership filtering on all private data.
- External calls wrapped in try/catch with graceful fallbacks; no
  secrets logged.
