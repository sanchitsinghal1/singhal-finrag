# Singhal FinRAG

An **evidence-grounded equity research workspace** with a complete
Retrieval-Augmented Generation (RAG) pipeline. Upload financial reports,
ask questions, and get answers that cite the exact text they used — never
invented figures. Crafted by **Sanchit Singhal**.

> **Stack:** JavaScript (no TypeScript) · MongoDB (no SQLite) · separate
> Express backend + Next.js frontend. The RAG pipeline, TF-IDF embeddings,
> cosine retrieval, citation mapping, market-data fault tolerance, Recharts
> visualisations, and Singhal FinRAG branding are all preserved from the
> original implementation — only the database, language, and folder
> structure changed.

## Architecture

```
Singhal-FinRAG/
├── frontend/                 # Next.js 16 (App Router) — UI only, port 3000
│   ├── src/
│   │   ├── app/              # pages (layout, page, globals.css)
│   │   ├── components/       # views, brand, landing, theme, ui (shadcn)
│   │   ├── context/          # auth context
│   │   ├── hooks/            # use-toast, use-mobile
│   │   └── lib/              # api-client, format, types, utils
│   ├── public/               # logo, favicon
│   ├── next.config.js        # proxies /api/* → backend
│   ├── tailwind.config.js
│   └── package.json
├── backend/                  # Express + Mongoose — API + DB, port 3001
│   ├── src/
│   │   ├── config/db.js      # MongoDB connection (Mongoose)
│   │   ├── models/           # 11 Mongoose schemas
│   │   ├── services/         # embedding, rag, market-data, ingest, zai
│   │   ├── middleware/       # auth (bcrypt + JWT cookie)
│   │   ├── routes/           # auth, companies, market, documents, rag,
│   │   │                     #   conversations, watchlists, research-notes, analysis
│   │   ├── utils/            # ApiError, asyncHandler, jsonOk
│   │   └── server.js         # Express entry
│   └── package.json
├── docs/                     # architecture, API, setup, RAG guide, resume, migration
├── .env.example
└── package.json              # orchestrates both via `concurrently`
```

**Data flow:** Browser → Next.js (:3000) → rewrite proxy `/api/*` → Express (:3001) → MongoDB.
The proxy keeps the browser same-origin so httpOnly cookies work with `SameSite=Lax`.

## Quick start

### 1. Start MongoDB

Local MongoDB (download the community binary for your OS):
```bash
mongod --dbpath ./data --port 27017 --bind_ip 127.0.0.1
```
Or use MongoDB Atlas (cloud) and copy the `mongodb+srv://...` connection string.

### 2. Configure environment

```bash
cp .env.example .env                 # root (optional — used by the orchestrator)
cp backend/.env.example backend/.env # edit MONGODB_URI + JWT_SECRET
cp frontend/.env.example frontend/.env
```

Set in `backend/.env`:
- `MONGODB_URI` — your MongoDB connection string
- `JWT_SECRET` — `openssl rand -hex 32`
- `PORT` — `3001` (the frontend proxies here)

### 3. Install + run

```bash
# install both
cd backend  && bun install && cd ..
cd frontend && bun install && cd ..

# run both together (backend on 3001, frontend on 3000)
bun run dev
```

Open **http://localhost:3000** — you'll see the Singhal FinRAG landing page.

To run them separately:
```bash
bun run dev:backend    # Express on :3001
bun run dev:frontend   # Next.js on :3000
```

## MongoDB Atlas setup

1. Create a free cluster at https://www.mongodb.com/atlas.
2. Database Access → add a user; Network Access → allow your IP.
3. Connect → Drivers → copy the connection string:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
4. Paste into `backend/.env` as `MONGODB_URI`, and set `MONGODB_DB_NAME=singhal_finrag`.
5. Restart the backend. The company directory is auto-seeded on first run.

## What works (verified)

- Register / login / logout (bcrypt + JWT httpOnly cookie, proxied)
- Document upload (PDF/TXT/MD) → extract → chunk → TF-IDF embed → MongoDB
- RAG query → grounded answer with `[Doc n]` citations + `evidenceType` provenance
- Insufficient-evidence refusal ("I don't have enough information…")
- Multi-tenant ownership: User B cannot retrieve User A's document chunks
  (enforced at the MongoDB query layer — `ownerId` filter before retrieval)
- Market snapshots via web search, 3-query fallback, stale-cache badge
- Company detail with real price-history chart (grows as you refresh)
- Watchlists, research notes, analysis (compare + Bull/Bear/SWOT briefs)
- Dark/light theme, fully responsive (mobile/tablet/desktop)
- Singhal FinRAG branding + "Crafted by Sanchit Singhal" throughout

## Documentation

- `docs/SETUP.md` — detailed local setup
- `docs/ARCHITECTURE.md` — layering, data model, security
- `docs/RAG_GUIDE_HI_EN.md` — Hinglish RAG pipeline tutorial
- `docs/API_DOCUMENTATION.md` — every endpoint
- `docs/DEPLOYMENT.md` — Vercel / self-host + Atlas
- `docs/MIGRATION_REPORT.md` — SQLite→MongoDB + TS→JS migration record
- `docs/RESUME_ACHIEVEMENTS.md` — interview talking points

## Honesty notes

- Market data is **web-sourced** (delayed, not real-time tick). Every snapshot
  stores its `source` + `fetchedAt`; stale snapshots show a visible badge.
- Embeddings are **TF-IDF sparse vectors** (local, dependency-free). The data
  model is shaped to swap in dense/Atlas Vector Search — see the RAG guide.
- PDF OCR is not enabled; scanned PDFs report "No extractable text" honestly.
- This is a portfolio project, not a production trading platform.
