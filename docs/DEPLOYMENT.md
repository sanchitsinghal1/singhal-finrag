# Deployment Guide

This is a standard Next.js 16 App Router app. The two most common targets
are **Vercel** (easiest) and a **self-hosted Node server**. SQLite is used
in development; for production you should switch to a real database server
(see below).

## Option A — Vercel (recommended for the demo)

1. Push the repo to GitHub.
2. In Vercel, **Import Project** → select the repo.
3. Framework preset: **Next.js**.
4. Set environment variables in the Vercel dashboard:
   - `DATABASE_URL` — for production, switch to Postgres/MySQL (Vercel
     Postgres / Neon / Supabase) — see "Database swap" below.
   - `JWT_SECRET` — generate with `openssl rand -hex 32`.
   - `NODE_ENV` = `production`.
5. Build command: `next build` (the default). Output: standalone.
6. Deploy. Vercel gives you a public HTTPS URL.

> The `z-ai-web-dev-sdk` works in the Vercel serverless Node runtime —
> no extra key configuration needed in this sandbox.

## Option B — Self-hosted Node

```bash
bun run build           # produces .next/standalone
NODE_ENV=production \
JWT_SECRET=$(openssl rand -hex 32) \
DATABASE_URL=file:/var/data/custom.db \
bun .next/standalone/server.js
```

Put it behind a reverse proxy (Caddy/Nginx) that terminates TLS and forwards
to `localhost:3000`. Use a process manager (pm2 / systemd) for restarts.

## Database swap (production)

SQLite is fine for a single-instance demo, but for real traffic switch
Prisma's provider. Two options:

### Postgres (drop-in, recommended)
```prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
```
Then run `bun run db:push`. All existing models work unchanged.

### MongoDB (matches the original spec + enables Atlas Vector Search)
```prisma
datasource db { provider = "mongodb"; url = env("DATABASE_URL") }
```
- Change scalar types: `String` arrays become `String[]` where you want
  arrays; the `embedding` field can become `Float[]` for a dense model.
- Create a MongoDB Atlas cluster, allow your deployment's IP, create a
  DB user, and copy the connection string into `DATABASE_URL`.
- For vector retrieval, create a **MongoDB Atlas Vector Search index**:
  ```json
  {
    "fields": [
      { "type": "vector", "path": "embedding",
        "numDimensions": 384, "similarity": "cosine" }
    ]
  }
  ```
  (Set `numDimensions` to your model's dimension.)
- Replace `src/lib/rag.ts::retrieve` with an aggregation using
  `$vectorSearch` (MongoDB handles top-K retrieval server-side).
- The rest of the app (ingest, prompt, citations) needs no change.

## Environment variables reference

| Var | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | yes | Prisma connection string |
| `JWT_SECRET` | yes (prod) | Signs session JWTs |
| `NODE_ENV` | no | `production` enables prod optimizations |

No LLM / embedding / market-data API keys are required in this sandbox —
those services are accessed through the bundled `z-ai-web-dev-sdk`. If you
later swap `market-data.ts` to call a paid provider (Alpha Vantage,
Finnhub, Tiingo), add the corresponding key as a new env var and read it in
that service only.

## Security checklist before going live

- [ ] Set a strong `JWT_SECRET` (32+ hex chars).
- [ ] Serve over HTTPS so cookies can use `Secure`.
- [ ] Tighten the upload allowlist / size limit to your needs.
- [ ] Add rate limiting on `/api/auth/*`, `/api/documents`, `/api/rag/query`
      (a simple in-memory limiter in a middleware is enough for a portfolio
      project; use Upstash Redis + a lib for production).
- [ ] Rotate DB credentials; restrict network access to the deployment's IP.
- [ ] Back up the SQLite file (or use a managed Postgres).

## What is NOT production-ready (be honest in interviews)

- No rate limiting yet (the structure supports adding it).
- Market data is web-sourced and may be delayed — not real-time tick data.
- TF-IDF retrieval is weaker than a transformer embedding for large corpora.
- No observability stack (add structured logs + Sentry for prod).
- Single-process — SQLite doesn't scale horizontally.
