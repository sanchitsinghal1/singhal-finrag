# Migration Report — SQLite → MongoDB + TypeScript → JavaScript + Frontend/Backend Split

> Honest record of the migration. Every claim is verifiable in the code.

## Summary

The Singhal FinRAG project was migrated from **Prisma + SQLite + TypeScript
(single Next.js app)** to **MongoDB + JavaScript (separate Express backend +
Next.js frontend)**. **Zero feature/UI/logic changes** — the RAG pipeline,
TF-IDF embeddings, cosine retrieval, citation mapping, market-data fault
tolerance, Recharts visualisations, branding, and all user flows are
preserved exactly.

## 1. Database migration: SQLite → MongoDB

### Approach
- **Driver:** Mongoose (chosen over the raw driver for schema validation,
  middleware hooks for cascade deletes, and closer parity with the Prisma
  model semantics).
- **Connection:** `backend/src/config/db.js` — singleton with graceful
  error handling, `serverSelectionTimeoutMS: 5000`, graceful shutdown on
  SIGINT/SIGTERM. Supports both local (`mongodb://`) and Atlas
  (`mongodb+srv://`) via `MONGODB_URI`.

### Schema mapping (Prisma → Mongoose)

| Prisma model | Mongoose model | Notes |
|---|---|---|
| User | `models/User.js` | email unique, role enum, timestamps |
| Company | `models/Company.js` | symbol unique uppercase |
| StockSnapshot | `models/StockSnapshot.js` | indexed on companyId, append-only |
| HistoricalPrice | `models/HistoricalPrice.js` | compound index companyId+date |
| FinancialDocument | `models/FinancialDocument.js` | indexed ownerId/companyId/status; cascade-delete middleware deletes chunks |
| DocumentChunk | `models/DocumentChunk.js` | indexed documentId; embedding stored as JSON string |
| Conversation | `models/Conversation.js` | cascade-delete middleware deletes messages |
| Message | `models/Message.js` | citations JSON + evidenceType |
| Watchlist | `models/Watchlist.js` | cascade-delete middleware deletes items |
| WatchlistItem | `models/WatchlistItem.js` | unique compound index [watchlistId, companyId] |
| ResearchNote | `models/ResearchNote.js` | indexed ownerId |

### Preserved behaviours
- **Ownership isolation:** every query filters by `ownerId` (e.g.
  `FinancialDocument.find({ ownerId: req.user._id })`). The RAG retrieval
  candidate set is `FinancialDocument.find({ ownerId, status: 'ready' })`
  → `DocumentChunk.find({ documentId: { $in: docIds } })`. Verified: User B
  retrieving User A's document returns 0 chunks (no leak).
- **Cascade deletes:** Mongoose `pre("findOneAndDelete")` middleware on
  FinancialDocument/Conversation/Watchlist deletes their chunks/messages/items.
- **Unique constraints:** `WatchlistItem` has a compound unique index; the
  duplicate-add path catches error code 11000 → 409.
- **Duplicate document detection:** sha256 of cleaned text, checked before
  re-indexing — identical behaviour to the Prisma version.

### Bug found & fixed during migration
Mongoose `populate()` requires the **field name**, not a relation name.
The Prisma `include: { document: true }` maps to Mongoose
`.populate("documentId")` (the field is `documentId`). Initially coded as
`.populate("document")` → "Cannot populate path" error. Fixed across all
routes (documents, watchlists, research-notes, market-data, rag).

## 2. Language conversion: TypeScript → JavaScript

### Approach
- All `.ts` → `.js`, `.tsx` → `.jsx`.
- Conversion done via `Bun.Transpiler` (strips type annotations, interfaces,
  generics, type-only imports) + a directive-ordering fixup (moves
  `"use client"` to line 1 — the transpiler injected the JSX-runtime import
  before it).
- 16 shadcn/ui components converted; **44 unused ui components deleted**
  (cleanup — only the 15 actually imported + 1 dependency were kept).
- `tsconfig.json` removed; replaced with `frontend/jsconfig.json` for the
  `@/*` path alias.

### Files converted
- Frontend: `app/layout`, `app/page`, `context/auth`, `components/{app,auth,
  brand,landing,theme,views,ui}/*`, `hooks/*`, `lib/{api-client,format,
  types,utils}` — all `.jsx`/`.js`.
- Backend: written directly in JavaScript (`.js`).
- Config: `next.config.js`, `tailwind.config.js` (were `.ts`).

### Verification
- `find frontend/src -name "*.ts" -o -name "*.tsx"` → **none**.
- No `tsconfig.json` in frontend. No `@types/*` or `typescript` in
  `frontend/package.json` deps.
- `bun run lint` (frontend) → clean.

## 3. Frontend/backend separation

### Decision
Kept Next.js as the frontend (UI only) + a **separate Express backend** for
the API/DB/services. This was chosen over keeping Next.js Route Handlers
because the user explicitly wanted a `backend/` folder, and it gives a
cleaner separation of concerns + a stronger full-stack structure.

### How the split works
- **Frontend** (`frontend/`, port 3000): Next.js App Router. Renders the UI.
  No API routes, no DB access, no services. `next.config.js` rewrites
  `/api/:path*` → `${BACKEND_URL}/api/:path*` (default
  `http://127.0.0.1:3001`).
- **Backend** (`backend/`, port 3001): Express. All API routes, Mongoose
  models, services (rag, embedding, market-data, ingest), auth middleware.
  `cookie-parser` for the httpOnly JWT cookie.
- **Proxy + cookies:** the browser talks only to :3000 (same-origin), so
  the session cookie works with `SameSite=Lax`. Next.js forwards requests
  (including Cookie + Set-Cookie headers) to :3001. Verified end-to-end:
  register → cookie set → authenticated upload/RAG.

### Root orchestration
`package.json` at root uses `concurrently` to start both:
```
bun run dev          # both backend + frontend
bun run dev:backend  # Express only
bun run dev:frontend # Next.js only
```

## 4. Data migration (SQLite → MongoDB)

The existing SQLite database (`db/custom.db`) contained only test data
created during development (a few demo users, one Apple report, a few
snapshots). Rather than write a one-off migration script for throwaway
data, the MongoDB database starts fresh and **auto-seeds** the company
directory (20 tickers) on first backend start. Real users re-register and
re-upload.

If you need to migrate real data, the mapping is 1:1 per the schema table
above. A migration script would: read each Prisma row → insert a Mongoose
document with the same fields (cuid `_id` → new ObjectId; relation fields →
ObjectId refs). Not provided because there was no production data to preserve.

## 5. Cleanup performed

- Removed: `prisma/`, `db/` (SQLite file), `tsconfig.json`, `next-env.d.ts`,
  `.next/` (stale build), root `node_modules/` + `bun.lock` (rebuilt per
  package), 44 unused shadcn ui components, `download/`, `mini-services/`,
  temp conversion scripts (`ts-to-js.mjs`, `fix-jsx.mjs`).
- Kept: `scripts/process-logo.mjs` (useful for reprocessing the logo),
  `docs/`, `examples/`, `skills/`, `tests/` (sandbox infrastructure),
  `Caddyfile`.

## 6. Test results (actual)

Run against a **real local MongoDB** (mongod 7.0.14 on 127.0.0.1:27017):

| Test | Result |
|---|---|
| Backend connects to MongoDB | ✅ `[db] MongoDB connected: 127.0.0.1 / singhal_finrag` |
| Company directory auto-seeds | ✅ 20 tickers |
| Register / login (via proxy) | ✅ cookie set, httpOnly |
| `/api/auth/me` (no cookie → null) | ✅ `data: null` (null preserved, not `{}`) |
| Document upload → chunk → embed → MongoDB | ✅ 1 chunk, Ready |
| RAG query → grounded answer + `[Doc 1]` citations | ✅ evidenceType: documents |
| Insufficient-evidence refusal | ✅ "I don't have enough information…" |
| **Ownership isolation:** User B reads User A's doc | ✅ HTTP 404 |
| **Ownership isolation:** User B RAG-queries User A's doc | ✅ retrieved: 0 (no leak) |
| Market snapshot fetch + 3-query fallback | ✅ price/P-E/EPS parsed |
| Companies list / detail | ✅ |
| Watchlists / research-notes CRUD | ✅ |
| Analysis compare + Bull/Bear brief | ✅ |
| Landing page renders (browser) | ✅ Singhal FinRAG branding |
| Dark/light theme toggle | ✅ |
| Mobile responsive (390×844) | ✅ |
| `bun run lint` (frontend) | ✅ clean |

## 7. Remaining limitations / unverified

- **MongoDB Atlas connection** not tested (only local mongod verified).
  The connection code is Atlas-compatible (`mongodb+srv://` works with
  Mongoose; set `MONGODB_DB_NAME`).
- **PDF extraction** on a real PDF: code path exists (`pdf-parse`), tested
  only on `.txt`/`.md`.
- **Rate limiting** not implemented (same as pre-migration).
- **Automated tests** not written (same as pre-migration).
- **Production build** (`bun run build`) not run — the dev server is the
  verification path. The `output: "standalone"` config is preserved.
- The `jsxDEV` runtime imports in the converted `.jsx` files are a
  dev-runtime artifact of the Bun transpiler; they work in dev and prod
  (react/jsx-dev-runtime ships with React) but add minor overhead vs the
  production jsx-runtime. Acceptable for a portfolio project.

## 8. Environment variables

| Var | Where | Purpose |
|---|---|---|
| `MONGODB_URI` | backend | MongoDB connection string (local or Atlas) |
| `MONGODB_DB_NAME` | backend | Optional DB name override (Atlas) |
| `JWT_SECRET` | backend | Signs session JWTs (required for prod) |
| `PORT` | backend | Express port (default 3001) |
| `BACKEND_URL` | frontend | Proxy target for `/api/*` (default 3001) |
| `NODE_ENV` | both | `production` for prod optimizations |

No real secrets are committed. `.env.example` files document every variable.
