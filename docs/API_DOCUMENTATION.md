# API Documentation

Base URL: `http://localhost:3000` (or your deployment origin).

All responses use a standard envelope:

```json
{ "success": true, "message": "...", "data": <T> }
```

On error:

```json
{ "success": false, "message": "...", "details": <any?> }
```

Auth: a `sirag_session` httpOnly cookie is set by `/api/auth/login` and
`/api/auth/register`. Protected endpoints require it; clients must send
`credentials: "include"` (the built-in `api-client.ts` does this).

---

## Auth

### POST `/api/auth/register`
Body: `{ email, password, name? }`
Sets the session cookie. Returns the new user.

### POST `/api/auth/login`
Body: `{ email, password }`
Sets the session cookie. Returns the user.

### POST `/api/auth/logout`
Clears the session cookie.

### GET `/api/auth/me`
Returns the current user, or `data: null` when not authenticated.

---

## Companies & market data

### GET `/api/companies?q=&seed=1`
List the curated directory. `q` filters by symbol/name. The directory is
auto-seeded on first call. Includes the latest snapshot per company.

### POST `/api/companies`
Body: `{ symbol, name? }` — look up or lazily create a company by symbol.

### GET `/api/companies/:id`
`:id` accepts either a DB id or a symbol. Returns `{ company, snapshot }`.
Snapshot is stale-cache aware (never throws to the client).

### GET `/api/market/:id?force=1`
Fetch/refresh the snapshot for `:id` (DB id or symbol). `force=1` bypasses
the 30-min TTL. Returns `{ company, snapshot, series }` where `series` is an
illustrative price series for the chart (clearly labelled).

---

## Documents & RAG ingestion

### GET `/api/documents?limit=50&offset=0&companyId=&status=`
List the authenticated user's documents (paginated, filterable). Includes
the company relation.

### POST `/api/documents` (multipart/form-data)
Fields: `file` (required, ≤10 MB, PDF/TXT/MD), `companyId` (optional).
Extracts text, chunks it, embeds it, persists. Returns
`{ documentId, status, chunkCount, charCount, message, duplicateOf? }`.
Duplicate text (same sha256) returns `duplicateOf` and is not re-indexed.

### GET `/api/documents/:id?chunkLimit=20&chunkOffset=0`
Document metadata + paginated chunks. Ownership-checked (404 otherwise).

### DELETE `/api/documents/:id`
Deletes the document and all its chunks (cascade).

---

## RAG query

### POST `/api/rag/query`
Body:
```json
{
  "question": "What was Apple's 2023 revenue?",
  "conversationId": "abc...",   // optional — if present, history is loaded
  "companyId": "xyz...",         // optional — narrows retrieval + grounds on snapshot
  "documentId": "def..."         // optional — narrows retrieval to one document
}
```
Returns:
```json
{
  "answer": "According to [Doc 1]...",
  "citations": [{ "documentId", "documentName", "chunkIndex", "page", "snippet", "score" }],
  "evidenceType": "documents | market_data | both | none",
  "retrievedCount": 3,
  "topScore": 0.45,
  "conversationId": "...",
  "messageId": "..."
}
```
When `conversationId` is provided, both the question and the answer are
persisted as messages (with the citation array) and the conversation is
auto-titled from the first question.

---

## Conversations

### GET `/api/conversations?limit=50`
List the user's conversations with message count + last message preview.

### POST `/api/conversations`
Body: `{ title?, companyId?, documentId? }`. Creates a conversation.
`documentId` ownership is verified.

### GET `/api/conversations/:id`
Returns `{ conversation, messages }` with parsed `citations` per message.

### PATCH `/api/conversations/:id`
Body: `{ title?, companyId?, documentId? }` — rename / re-scope.

### DELETE `/api/conversations/:id`
Deletes the conversation and all its messages.

---

## Watchlists

### GET `/api/watchlists`
List the user's watchlists with all items + latest snapshot per company.

### POST `/api/watchlists`
Body: `{ name, description? }`.

### PATCH / DELETE `/api/watchlists/:id`
Rename / delete a watchlist (cascade-deletes items).

### GET `/api/watchlists/:id/items`
Items with the latest snapshot per company.

### POST `/api/watchlists/:id/items`
Body: `{ companyId, note?, targetPrice? }`. Unique on `[watchlistId, companyId]`.

### DELETE `/api/watchlists/:id/items?itemId=...`
Remove one item.

---

## Research notes

### GET `/api/research-notes?companyId=`
List notes (optionally scoped to a company).

### POST `/api/research-notes`
Body: `{ title, content, companyId?, tags? }`.

### PATCH / DELETE `/api/research-notes/:id`
Update / delete a note (ownership-checked).

---

## Analysis

### POST `/api/analysis/compare`
Body: `{ companyIds: string[] }` (max 5). Returns `[{ company, snapshot }]`.

### POST `/api/analysis/generate`
Body: `{ kind: "bull_bear" | "swot" | "summary", companyId }`.
Returns a grounded research brief (`content`) with a `groundedOn` block
listing market-snapshot freshness and the names of the user's documents
for that company. The LLM tags each claim with `[market data]`,
`[user documents]`, or `[analyst interpretation]`.

---

## Error codes

| Status | Meaning |
|--------|---------|
| 400 | Bad request (validation) |
| 401 | Authentication required |
| 403 | Forbidden (ownership) |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate email / duplicate document text) |
| 429 | Rate-limited (not yet enforced) |
| 500 | Internal server error |
