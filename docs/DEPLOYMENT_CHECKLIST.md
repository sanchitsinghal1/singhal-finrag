# Deployment Checklist & Audit

> Audit of the actual repository state. Issues are classified P0 (ship
> blocker), P1 (should fix before real users), P2 (nice to have). Every
> item cites the exact file and a proposed fix. **No existing working
> functionality is deleted or rewritten here — this is a report only.**

## Local setup (verified working)

```bash
bun install
bun run db:push        # create SQLite schema
bun run db:generate
bun run dev            # http://localhost:3000
bun run lint           # passes clean
```

Required env (`/home/z/my-project/.env`):
```
DATABASE_URL=file:/home/z/my-project/db/custom.db
JWT_SECRET=<long random>     # dev fallback exists; required for prod
```

Build/lint results at time of audit:
- `bun run lint` → **clean** (0 errors, 0 warnings).
- `bun run dev` → starts on port 3000, compiles all routes, no fatal errors.
- End-to-end smoke (curl + Agent Browser) → all major flows return 200.

---

## P0 — Production blockers (must fix before any real deployment)

### P0-1. No HTTPS enforcement → cookie `Secure` flag is missing
- **File:** `src/lib/auth.ts:64,71` (`setSessionCookie` / `clearSessionCookie`)
- **Problem:** Cookie is `HttpOnly; SameSite=Lax` but **not `Secure`**.
  Over plain HTTP the JWT would transit in cleartext. The code omits
  `Secure` so local dev (http) still works — correct for dev, wrong for prod.
- **Proposed fix (do not apply yet):** gate the `Secure` flag on
  `process.env.NODE_ENV === "production"`. No behaviour change in dev.
  ```ts
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  // append secure to both set-cookie strings
  ```

### P0-2. `JWT_SECRET` dev fallback ships in source
- **File:** `src/lib/auth.ts:14` (`SECRET = process.env.JWT_SECRET || "dev-only-secret-..."`)
- **Problem:** If `JWT_SECRET` is unset in production, the app silently
  signs tokens with a publicly-known string → anyone can forge sessions.
- **Proposed fix:** in `server` startup, throw if `NODE_ENV=production`
  and `JWT_SECRET` is missing/short. Keep the fallback only for dev.

### P0-3. SQLite is single-file, single-process — not horizontally scalable
- **File:** `prisma/schema.prisma` (`provider = "sqlite"`)
- **Problem:** Two server instances would each have their own DB file →
  data divergence. Fine for a single-instance demo; a blocker for any
  real deployment behind >1 replica.
- **Proposed fix:** switch the Prisma provider to `postgresql` (Neon /
  Supabase / Vercel Postgres) and set `DATABASE_URL` to the managed
  connection string. Run `bun run db:push`. All models work unchanged.
  See `docs/DEPLOYMENT.md`.

### P0-4. No rate limiting on auth / upload / RAG endpoints
- **Files:** every `src/app/api/*/route.ts`; no `middleware.ts` exists.
- **Problem:** `/api/auth/login` (brute force), `/api/documents`
  (unbounded uploads + LLM cost), `/api/rag/query` (expensive AI calls)
  are all unthrottled. A single client can exhaust the LLM quota.
- **Proposed fix:** add a simple in-memory IP limiter middleware for a
  portfolio project, or Upstash Redis + `@upstash/ratelimit` for prod.
  Suggested limits: login 10/min, upload 20/hour, RAG 30/hour per user.

---

## P1 — Should fix before real users

### P1-1. No CSRF protection beyond SameSite=Lax
- **File:** `src/lib/auth.ts:64`
- **Problem:** `SameSite=Lax` blocks CSRF for cross-site POST form
  submissions in modern browsers, but is not a complete defence (e.g.
  top-level GET navigations still send the cookie). All state-changing
  routes are POST/PATCH/DELETE so Lax is a reasonable mitigation, but
  a defense-in-depth CSRF token would be stronger.
- **Proposed fix:** issue a double-submit CSRF token on `/api/auth/me`
  and require it in a header for all mutating routes, or move to
  `SameSite=Strict` (acceptable here because there are no third-party
  embed scenarios).

### P1-2. Market-data regex parsing is brittle
- **Files:** `src/lib/market-data.ts:79-137`
- **Problem:** Parsers depend on snippet phrasing ("valued at $X",
  "Market Cap5.07T"). If a provider changes phrasing, fields silently
  become `null`. The `>25%` rejection guard prevents the worst
  mis-displays, but a structural change would degrade gracefully to
  `null` rather than crash — which is acceptable but not great.
- **Proposed fix:** swap `fetchSnapshot` to a real market-data API
  (Alpha Vantage / Finnhub / Tiingo) returning structured JSON. The
  rest of the app is unchanged.

### P1-3. No automated tests
- **Files:** none (`find . -name "*.test.ts"` returns nothing).
- **Problem:** Regression risk. The RAG retrieval math, the market
  parsers, and the chunking are the highest-value things to test.
- **Proposed fix:** add `vitest` and write unit tests for
  `embedding.ts` (tokenize, cosineTfidf, chunkText edge cases),
  `market-data.ts` parser functions (feed known snippet strings),
  and `rag.ts::retrieve` with a seeded test DB.

### P1-4. RAG retrieval scans the user's entire chunk corpus per query
- **File:** `src/lib/rag.ts:74` (`db.documentChunk.findMany({ where: {...} })`)
- **Problem:** Every question loads ALL of the user's ready chunks into
  memory to compute IDF + cosine. Fine for tens/hundreds of chunks;
  degrades at thousands. SQLite also can't do vector indexing natively.
- **Proposed fix:** migrate to a real vector index (MongoDB Atlas Vector
  Search, or `pgvector` on Postgres) and replace the in-app cosine loop
  with a server-side `$vectorSearch` / `<=>` query. The `embedding`
  field shape and the rest of the pipeline are already compatible.

### P1-5. No LLM streaming — full answers block the request
- **File:** `src/lib/rag.ts:197` (`zai.chat.completions.create` non-streaming)
- **Problem:** Long answers make the user wait for the whole response
  (observed ~0.5–3s). Acceptable, but streaming would be a better UX.
- **Proposed fix:** switch to `stream: true` and pipe tokens via a
  Server-Sent Events response; the Research view renders incrementally.

### P1-6. No structured logging / observability
- **Files:** scattered `console.error("[api:error]...", ...)` calls.
- **Problem:** No request IDs, no levels, no aggregation.
- **Proposed fix:** add `pino` with request-scoped logs; ship to
  Logtail / Datadog for prod.

---

## P2 — Nice to have / polish

### P2-1. `illustrativeSeries` is synthetic
- **File:** `src/lib/market-data.ts::illustrativeSeries`
- **Problem:** The chart on the company page is derived from the latest
  price, not real OHLC. It's honestly labelled, but a real history feed
  would be more credible.
- **Proposed fix:** call a provider's daily-series endpoint and store
  rows in the `HistoricalPrice` model (already in the schema, unused).

### P2-2. No admin controls
- The `User.role` field exists but nothing checks `role === "admin"`.
- **Proposed fix:** add an admin route for content moderation if needed.

### P2-3. Upload ingestion is synchronous
- **File:** `src/app/api/documents/route.ts` (awaits `ingestDocument` in
  the request).
- **Problem:** Large PDFs make the HTTP request block until extraction +
  embedding finish. The `processing` status is set up for async but the
  actual work is inline.
- **Proposed fix:** kick off a background job (BullMQ / a simple
  `setImmediate` worker) and have the frontend poll status.

### P2-4. PDF OCR not supported
- **File:** `src/lib/ingest.ts:110-118`
- **Problem:** Scanned image-only PDFs report "No extractable text found"
  (honest). 
- **Proposed fix:** integrate `tesseract.js` for OCR if you need scanned
  PDFs; document it as an optional capability.

### P2-5. No pagination on conversation messages
- **File:** `src/app/api/conversations/[id]/route.ts` (loads all messages)
- **Proposed fix:** paginate with `take/skip` for long conversations.

---

## Production deployment configuration

### Vercel (easiest)
1. Push to GitHub → Import in Vercel.
2. Env vars: `DATABASE_URL` (managed Postgres), `JWT_SECRET`
   (`openssl rand -hex 32`), `NODE_ENV=production`.
3. Build: default `next build` (standalone output already configured).
4. After P0-1, P0-2, P0-3, P0-4 are addressed, deploy is safe.

### Self-hosted
```bash
bun run build
NODE_ENV=production JWT_SECRET=... DATABASE_URL=file:/var/data/custom.db \
  bun .next/standalone/server.js
```
Behind Caddy/Nginx with TLS; pm2/systemd for restarts.

## CORS / cookie notes
- Same-origin (Next.js serves both UI and API) → no CORS config needed.
- `credentials: "include"` is set in `src/lib/api-client.ts:24`.
- Cookie `SameSite=Lax` works for same-origin. If you ever split the
  frontend to a different origin, switch to `SameSite=None; Secure` and
  configure CORS `Access-Control-Allow-Credentials: true`.

## Final pre-deploy checklist
- [ ] P0-1: gate `Secure` cookie flag on `NODE_ENV=production`
- [ ] P0-2: throw on missing `JWT_SECRET` in production
- [ ] P0-3: switch to managed Postgres (or accept single-instance SQLite)
- [ ] P0-4: add rate limiting on `/api/auth/*`, `/api/documents`, `/api/rag/query`
- [ ] P1-1: decide on CSRF strategy (Strict or token)
- [ ] P1-3: add at least parser + embedding unit tests
- [ ] Set a strong `JWT_SECRET` (32+ hex chars)
- [ ] HTTPS termination (so `Secure` cookies work)
- [ ] Backup strategy for the DB
