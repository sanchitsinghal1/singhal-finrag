# Stock Intelligence RAG

An **evidence-grounded equity research workspace** with a complete
Retrieval-Augmented Generation (RAG) pipeline. Upload financial reports,
ask questions, and get answers that cite the exact text they used — never
invented figures.

> This repository runs in a Next.js 16 + TypeScript + Prisma/SQLite
> sandbox. The original brief specified MERN + MongoDB; the architecture
> here is a faithful adaptation that preserves every core capability
> (real RAG, real PDF extraction, real LLM grounding, real market data)
> while fitting the available stack. See `docs/RAG_GUIDE_HI_EN.md` for
> the documented migration path back to MongoDB Atlas Vector Search.

## What it does

- **Dashboard** — market overview, recent documents & research.
- **Companies** — searchable directory of 20 seeded tickers (US + India),
  per-company intelligence with price chart, fundamentals, and refreshable
  web-sourced snapshots.
- **Documents** — upload PDF / TXT / MD; the app extracts, chunks (size +
  overlap), embeds, and indexes for retrieval, with duplicate detection
  and per-user ownership.
- **Research** — multi-turn RAG chat. Answers are grounded in retrieved
  chunks, carry `evidenceType` provenance, and link to clickable citations.
  If evidence is insufficient, the assistant says so — it never
  fabricates.
- **Watchlists** — create lists, track companies, attach notes and price
  targets.
- **Analysis** — compare up to 5 companies side-by-side and generate
  grounded Bull/Bear, SWOT, and equity-summary briefs with evidence tags.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4** + **shadcn/ui**
- **Prisma** ORM + **SQLite** (migration path to MongoDB Atlas in the docs)
- **bcrypt** + **JWT** in httpOnly cookies for auth
- **z-ai-web-dev-sdk** for the LLM (`chat.completions`) and web search
  (`functions.invoke('web_search')`) — backend only
- **pdf-parse** for PDF text extraction
- A custom, dependency-free **TF-IDF vectorizer + cosine similarity** for
  embeddings and retrieval
- **Recharts** for charts

## Quick start

```bash
bun install
bun run db:push     # create the SQLite schema
bun run db:generate
bun run dev         # http://localhost:3000
```

Open the app, register an account, upload a `.txt` financial report, and
ask it a question in the Research tab.

## Configuration

`.env` (only two variables needed in this sandbox):

```env
DATABASE_URL=file:./db/custom.db
JWT_SECRET=replace-with-a-long-random-string   # required for production
```

No LLM / embedding / market-data API keys are required — they're accessed
through the bundled SDK.

## Documentation

- [`docs/SETUP.md`](docs/SETUP.md) — local setup & verification
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layering, data model, security
- [`docs/RAG_GUIDE_HI_EN.md`](docs/RAG_GUIDE_HI_EN.md) — Hinglish RAG tutorial (the pipeline, step by step)
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) — every endpoint
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel / self-host + MongoDB Atlas Vector Search migration
- [`docs/RESUME_PROJECT.md`](docs/RESUME_PROJECT.md) — interview talking points

## Honesty notes

- Market data is **web-sourced** (via `web_search`), not real-time tick
  data. Every snapshot stores its `source` and `fetchedAt`; stale snapshots
  are served with a visible badge.
- Embeddings are **TF-IDF sparse vectors** (local, zero-dependency). The
  upgrade path to dense transformer / API embeddings and MongoDB Atlas
  Vector Search is documented in the RAG guide.
- **PDF OCR is not enabled.** Scanned image-only PDFs report "No
  extractable text found" honestly rather than pretending to read them.
- This is a portfolio project, not a production trading platform. Do not
  use it for actual investment decisions.
