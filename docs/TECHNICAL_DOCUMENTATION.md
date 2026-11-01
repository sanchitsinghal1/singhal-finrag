# Technical Documentation — Stock Intelligence RAG

> Source-code-grounded reference. Every claim below is verifiable in the
> files cited. No feature is marked "done" unless the code actually
> implements it.

## 1. Stack (as actually used in code)

| Layer | What the code uses | Evidence |
|---|---|---|
| Framework | Next.js 16 App Router | `next.config.ts`, `src/app/*` Route Handlers |
| Language | TypeScript 5 | `.ts`/`.tsx` throughout |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) | `tailwind.config.ts`, `src/components/ui/*` |
| Routing | App Router (server) + in-app state tabs (client) | `src/app/page.tsx`, `src/components/app/app-shell.tsx` |
| State | React Context (`AuthContext`) + component-local `useState` | `src/context/auth.tsx` |
| Data fetching | `fetch` wrapper with credentials | `src/lib/api-client.ts` |
| ORM/DB | Prisma + SQLite | `prisma/schema.prisma`, `src/lib/db.ts` |
| Charts | Recharts | `src/components/views/companies.tsx`, `analysis.tsx` |
| Auth | bcryptjs + jsonwebtoken in httpOnly cookie | `src/lib/auth.ts` |
| AI / search | `z-ai-web-dev-sdk` (`chat.completions`, `functions.invoke('web_search')`) | `src/lib/zai.ts`, `rag.ts`, `market-data.ts` |
| PDF | `pdf-parse` (dynamic import) | `src/lib/ingest.ts` |

**Not used (despite being common in RAG projects):** LangChain, a vector DB
(Pinecone/Chroma/Mongo Atlas), OpenAI/transformer embeddings, Express,
a separate Python service, NextAuth (a custom JWT layer is used instead),
Zustand/TanStack Query (the project is small enough that Context + local
state suffices — both are installed but unused).

## 2. Backend — routes, services, middleware, models

### 2.1 API surface (every `route.ts`)

| Endpoint | Method | File | What it does | Status |
|---|---|---|---|---|
| `/api/auth/register` | POST | `src/app/api/auth/register/route.ts` | Create user, hash password, set cookie | ✅ implemented + verified |
| `/api/auth/login` | POST | `src/app/api/auth/login/route.ts` | Verify creds, timing-safe-ish, set cookie | ✅ implemented + verified |
| `/api/auth/logout` | POST | `src/app/api/auth/logout/route.ts` | Clear cookie | ✅ implemented + verified |
| `/api/auth/me` | GET | `src/app/api/auth/me/route.ts` | Return current user or `null` | ✅ implemented + verified |
| `/api/companies` | GET/POST | `src/app/api/companies/route.ts` | List/filter directory; create-by-symbol | ✅ implemented + verified |
| `/api/companies/[id]` | GET | `src/app/api/companies/[id]/route.ts` | Detail + snapshot (id or symbol) | ✅ implemented + verified |
| `/api/market/[id]` | GET | `src/app/api/market/[id]/route.ts` | Snapshot + illustrative series, `?force=1` | ✅ implemented + verified |
| `/api/documents` | GET/POST | `src/app/api/documents/route.ts` | List (paginated) / multipart upload | ✅ implemented + verified |
| `/api/documents/[id]` | GET/DELETE | `src/app/api/documents/[id]/route.ts` | Metadata+chunks / cascade delete | ✅ implemented + verified |
| `/api/rag/query` | POST | `src/app/api/rag/query/route.ts` | The RAG endpoint | ✅ implemented + verified |
| `/api/conversations` | GET/POST | `src/app/api/conversations/route.ts` | List / create | ✅ implemented + verified |
| `/api/conversations/[id]` | GET/PATCH/DELETE | `src/app/api/conversations/[id]/route.ts` | Messages / rename / delete | ✅ implemented + verified |
| `/api/watchlists` | GET/POST | `src/app/api/watchlists/route.ts` | List / create | ✅ implemented + verified |
| `/api/watchlists/[id]` | GET/PATCH/DELETE | `src/app/api/watchlists/[id]/route.ts` + `items/route.ts` | Manage list + items | ✅ implemented + verified |
| `/api/research-notes` | GET/POST | `src/app/api/research-notes/route.ts` | List / create notes | ✅ implemented + verified |
| `/api/research-notes/[id]` | PATCH/DELETE | `src/app/api/research-notes/[id]/route.ts` | Update / delete | ✅ implemented + verified |
| `/api/analysis/compare` | POST | `src/app/api/analysis/compare/route.ts` | Side-by-side snapshots | ✅ implemented + verified |
| `/api/analysis/generate` | POST | `src/app/api/analysis/generate/route.ts` | Grounded Bull/Bear/SWOT/summary | ✅ implemented + verified |

There is **no** `middleware.ts` — there is no Next.js edge middleware, and
**no rate-limiting middleware exists anywhere** (see §6 gaps).

### 2.2 Services (`src/lib/*`)

- `api-response.ts` — `ApiError` (typed errors w/ status), `asyncHandler`
  (wraps route handlers so thrown `ApiError`s become JSON 4xx/5xx instead
  of crashing), `jsonOk`/`jsonError` (standard envelope). Preserves `null`
  data explicitly (fixed during testing — see §5 bug #2).
- `auth.ts` — `hashPassword` (bcrypt cost 10), `signSession`/`verifySession`
  (JWT, 7-day TTL), `setSessionCookie`/`clearSessionCookie`
  (`HttpOnly; SameSite=Lax`), `getCurrentUser` (reads cookie via
  `next/headers`, verifies JWT, loads user), `requireUser` (throws 401).
- `embedding.ts` — `tokenize` (Unicode-aware, stopword-filtered),
  `buildTfVector` (sparse TF), `computeIdf` (smoothed `ln(1+N/(1+df))`),
  `cosineTfidf` (sparse dot product with IDF weighting),
  `chunkText` (sentence-boundary split + overlap), `serialize/deserialize`.
- `ingest.ts` — `extractText` (pdf-parse dynamic import / utf-8 fallback),
  `cleanText` (whitespace + form-feed normalisation), `hashText` (sha256),
  `ingestDocument` (validate → pending record → extract → dedup → chunk →
  embed → persist → ready, with `markFailed` on any error).
- `rag.ts` — `retrieve` (ownership-scoped candidate set → TF-IDF rank →
  top-K → snippet), `buildSystemPrompt` (grounded rules + numbered
  context + optional market snapshot), `answer` (retrieve → prompt → LLM
  → citations + evidenceType), `loadHistory` (last 12 messages).
- `market-data.ts` — `SEED_COMPANIES` (20 tickers), `seedCompanies`,
  `findOrCreateCompany`, labelled-figure parsers
  (`firstDollarAmount`, `parseMarketCap`, `parsePeRatio`, `parseEps`,
  `parse52High/Low`, `parseDividendYield`, `parseChangePercent`),
  `fetchSnapshot` (3-query fallback chain + targeted parsing),
  `getSnapshot` (30-min TTL + stale-cache fallback), `illustrativeSeries`
  (clearly-labelled synthetic chart data).
- `zai.ts` — singleton wrapper around `ZAI.create()`.
- `db.ts` — single Prisma client (dev-safe global), logs `["error","warn"]`.

### 2.3 Database models (`prisma/schema.prisma`)

10 models: `User`, `Company`, `StockSnapshot`, `HistoricalPrice`,
`FinancialDocument`, `DocumentChunk`, `Conversation`, `Message`,
`Watchlist`, `WatchlistItem`, `ResearchNote`.

Key design points:
- `User.passwordHash` (never returned to client), `role` default `"user"`.
- `Company.symbol` unique; directory auto-seeded.
- `StockSnapshot` append-only per company; `rawJson` keeps full provider
  payload; indexed on `companyId`. `fetchedAt` drives the staleness flag.
- `FinancialDocument`: `ownerId`, `status` state machine
  (`pending→processing→ready|failed`), `textHash` (sha256) for dedup,
  indexed on `ownerId`, `companyId`, `status`.
- `DocumentChunk.embedding` is a JSON string of the TF-IDF sparse vector
  (SQLite has no vector type). Indexed on `documentId`. Cascade-deleted.
- `Message.citations` JSON string + `evidenceType` provenance flag.
- `WatchlistItem` has `@@unique([watchlistId, companyId])` preventing dupes.
- `onDelete: Cascade` on chunks/messages/watchlist items; `SetNull` on
  optional company/document relations when those are deleted.

## 3. Frontend — files, components, data flow

### 3.1 Entry & shell
- `src/app/page.tsx` — client component: mounts `AuthProvider`, renders
  `AuthGate` (when no user) or `AppShell` (when logged in). This is the
  **only** user-facing route.
- `src/app/layout.tsx` — root layout, fonts, `Toaster` + Sonner.
- `src/components/auth/auth-gate.tsx` — login/register card.
- `src/components/app/app-shell.tsx` — header nav (6 tabs), user menu,
  sticky footer (`min-h-screen flex flex-col` + `mt-auto`), in-app
  navigation state (`view` + optional `companyId`/`documentId`/
  `conversationId`).

### 3.2 Views (`src/components/views/*`)
- `dashboard.tsx` — market overview cards + recent documents + recent
  research. Parallel `Promise.all` fetch with per-call `.catch()`.
- `companies.tsx` — searchable directory + per-company detail (chart,
  fundamentals, refresh, stale badge). Uses Recharts `AreaChart`.
- `documents.tsx` — uploader (multipart `FormData`) + library + chunk
  inspector (`DocumentDetail` paginated chunks).
- `research.tsx` — conversation sidebar + chat panel with scope selects,
  optimistic message insert, `MessageBubble` + `CitationCard`
  (clickable → document detail).
- `watchlists.tsx` — create lists, add/remove companies, notes + price
  targets with a "hit" badge.
- `analysis.tsx` — compare builder (up to 5) + side-by-side table +
  grounded brief generator with evidence tags + markdown export.

### 3.3 Shared
- `src/context/auth.tsx` — `AuthProvider` restores session on mount via an
  async IIFE effect (with `active` guard against setState-after-unmount).
- `src/lib/api-client.ts` — `api.get/post/patch/del` + `uploadFile`;
  throws typed `ApiError`; `credentials: "include"`.
- `src/lib/format.ts` — `fmtPrice`, `fmtCompact`, `fmtPct`, `timeAgo`.
- `src/lib/types.ts` — shared client types.

### 3.4 Request flow example (RAG question)
```
User types in Research view
  → research.tsx::ask() optimistic-inserts the user message
  → api.post("/api/rag/query", { question, conversationId, companyId?, documentId? })
  → rag/query/route.ts: requireUser() → loadHistory(convId)
  → rag.ts::answer(): retrieve() → buildSystemPrompt() → zai.chat.completions.create()
  → route.ts persists user msg + assistant msg (citations JSON, evidenceType)
  → returns { answer, citations, evidenceType, retrievedCount, topScore }
  → research.tsx replaces optimistic msg, renders answer + CitationCards + badge
```

## 4. Authentication, authorization, security (actual implementation)

- **Auth:** bcrypt (cost 10) password hash; JWT signed with `JWT_SECRET`
  (7-day TTL) in an `HttpOnly; SameSite=Lax` cookie. Verified server-side
  on every protected request via `getCurrentUser()` → `requireUser()`.
- **Authorization:** every query on `FinancialDocument`, `Conversation`,
  `Watchlist`, `ResearchNote` filters by `ownerId`. The RAG retrieval
  candidate set is `where: { document: { ownerId, status: 'ready' } }`
  (`rag.ts:65-72`) — so the LLM physically cannot see another user's
  chunks. Conversation scope verifies `conv.ownerId !== user.id` (404).
- **Upload validation:** 10 MB cap, mime/extension allowlist
  (`ingest.ts:86-91`).
- **Error handling:** `asyncHandler` converts thrown `ApiError`s into
  consistent JSON 4xx/5xx. External calls (LLM, web_search) wrapped in
  try/catch with friendly fallbacks; secrets never logged.

## 5. Bugs found & fixed during development (real debugging evidence)

1. **Market price regex grabbed "18" from "18 hours ago".**
   - Root cause: `parseNum` matched the first number in the snippet.
   - Fix: replaced with `firstDollarAmount` (prefers "valued at $X" /
     "price $X" / `$`+≥3 digits). Re-verified: $343.91.
2. **`change%` showed 29.03% (false daily change).**
   - Root cause: regex matched "change" inside "ex**change**", then the
     52-week-change figure.
   - Fix: `\bchange\b` word boundary + reject `|v| > 25` as implausible.
3. **`/api/auth/me` returning `data: null` made the app render `AppShell`
   with a "logged-in" empty object.**
   - Root cause: `api-client` fell back to `{}` when `data` was null, and
     `{}` is truthy → `!user` was false.
   - Fix: `return json.data === undefined ? {} : json.data` (preserves null).
   - Verified: clearing cookies + reload now correctly shows `AuthGate`.
4. **web_search returned 422 "No search results" for the long market query.**
   - Fix: 3-query fallback chain; re-fetch succeeded.
5. **Prisma schema relation mismatch** (missing `conversations` back-relation
   on `FinancialDocument`). Fixed before first `db:push`.

These are documented in the dev.log timeline of the previous session and
are **debugging-driven**, not generated.

## 6. Honest classification — what is NOT engineering

| Area | Honest status |
|---|---|
| Watchlist / research-note CRUD | Standard CRUD — boilerplate. |
| shadcn/ui components | Library — not your work. |
| Dashboard layout, auth form UI | Standard UI — boilerplate. |
| The JWT+bcrypt auth *structure* | Standard pattern; the timing detail is the real part. |
| TF-IDF algorithm itself | Textbook — implemented from scratch (shows understanding) but **not novel**. |
| Recharts chart | Library. |
| "Illustrative series" | Synthetic data — honestly labelled, not engineering. |
| Seeded company directory | Static data. |

## 7. Verified vs untested vs missing

| Item | Status |
|---|---|
| Auth (register/login/logout/me) | ✅ verified (curl + browser) |
| Document upload + chunking + embedding | ✅ verified |
| RAG grounded answer + citations | ✅ verified |
| Insufficient-evidence refusal | ✅ verified |
| Market snapshot + refresh + stale fallback | ✅ verified |
| Company detail chart + fundamentals | ✅ verified (browser) |
| Analysis brief generation | ✅ verified (browser) |
| Watchlist create/add/remove | ✅ verified (browser renders; add flow tested) |
| Responsive + sticky footer | ✅ verified (mobile 390×844 + desktop) |
| PDF extraction on real PDF | ⚠️ code path exists (pdf-parse), tested only on .txt |
| Rate limiting | ❌ not implemented (UI mentions it; no middleware) |
| Automated tests | ❌ none written |
| CSRF token | ❌ not implemented (SameSite=Lax is the only mitigation) |
| Streaming LLM responses | ❌ not implemented |
| Real historical OHLC feed | ❌ synthetic series only |

## 8. Environment variables (names + purpose, no secrets)

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Prisma SQLite path, e.g. `file:./db/custom.db` |
| `JWT_SECRET` | yes (prod) | Signs session JWTs; dev fallback exists |
| `NODE_ENV` | no | `production` enables prod optimizations |

No LLM / embedding / market-data API keys are required — accessed via the
bundled `z-ai-web-dev-sdk`. (If you later swap `market-data.ts` to a paid
provider, add that provider's key as a new var, read only in that service.)
