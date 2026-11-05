# Local Setup

> This project runs in a sandboxed Next.js 16 + TypeScript + Prisma/SQLite
> environment. There is no separate frontend/backend to start — the dev
> server runs the whole app on port 3000.

## Prerequisites

- **Node.js 20+** (or Bun — this repo uses Bun for the dev script)
- **SQLite** is file-based, so no database server is needed. The DB file
  lives at `db/custom.db` (created automatically by `db:push`).

## 1. Install dependencies

```bash
bun install
```

## 2. Configure environment

Create `.env` (the sandbox already has one with `DATABASE_URL`). For a
fresh setup, copy the variables below:

```env
# Database (SQLite file path)
DATABASE_URL=file:./db/custom.db

# Auth — generate a long random string, e.g. `openssl rand -hex 32`
JWT_SECRET=replace-with-a-long-random-string

# Node env
NODE_ENV=development
```

> The app boots with a dev-fallback `JWT_SECRET`, but you MUST set a strong
> one in production.

No external API keys are required to run locally — the LLM and web search
are accessed through the bundled `z-ai-web-dev-sdk`.

## 3. Initialise the database

```bash
bun run db:push     # create/migrate the SQLite schema
bun run db:generate # (re)generate the Prisma client
```

The company directory (20 popular tickers) is auto-seeded on first
`GET /api/companies` call — nothing to import manually.

## 4. Start the dev server

```bash
bun run dev
```

The app is served at **http://localhost:3000**.

## 5. Verify the setup

1. Open the app — you should see the login/register screen.
2. Register an account (any email + password ≥ 8 chars).
3. Go to **Documents** → upload a `.txt` or `.pdf` financial report.
   - The document should reach `Ready` status with a chunk count.
4. Go to **Research** → ask: *"What does this report say about revenue?"*
   - You should get a grounded answer with a `[Doc 1]` citation and a
     clickable source card.
5. Go to **Companies** → click any ticker → the snapshot fetches from the
   web and the chart/fundamentals populate.

## 6. Verify RAG specifically (the heart of the project)

```bash
# Register
curl -c cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"demo@stock.io","password":"password123","name":"Demo"}'

# Upload a small report
printf 'Apple Inc. In fiscal 2023, total revenue was 383 billion USD. \
Services revenue grew 14%% year over year.' > report.txt

curl -b cookies.txt -X POST http://localhost:3000/api/documents \
  -F "file=@report.txt"

# Ask a grounded question (replace DOC_ID from the upload response)
curl -b cookies.txt -X POST http://localhost:3000/api/rag/query \
  -H 'content-type: application/json' \
  -d '{"question":"What was Apple revenue in 2023?","documentId":"<DOC_ID>"}'
```

The response must include `answer`, `citations` (with the chunk snippet),
and `evidenceType: "documents"`.

## 7. Lint

```bash
bun run lint
```

## 8. Inspecting the database (optional)

```bash
bunx prisma studio
```

Opens a web UI on port 5555 to browse `User`, `Company`, `FinancialDocument`,
`DocumentChunk` (you can inspect the JSON `embedding` field), `Conversation`,
`Message`, `Watchlist`, etc.

## Notes & limitations

- **PDF OCR is not enabled.** Scanned (image-only) PDFs report
  "No extractable text found". Use text-based PDFs, `.txt`, or `.md`.
- **Market data is web-sourced**, not real-time tick data. Each snapshot
  stores its `source` and `fetchedAt`; stale snapshots are served with a
  visible badge when a refresh fails.
- **Embeddings are TF-IDF sparse vectors** (local, dependency-free).
  See `docs/RAG_GUIDE_HI_EN.md` for how to swap in dense transformer or
  API embeddings, and how to migrate to MongoDB Atlas Vector Search.
