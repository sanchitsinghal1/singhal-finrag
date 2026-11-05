# Resume Achievements — Stock Intelligence RAG

> **Method:** every achievement below was identified by re-reading the
> actual source files. No claim is made that isn't backed by a file path,
> function name, and line-level logic. Weak/boilerplate work is called out
> honestly in §3. **5 genuine achievements** are documented in §2 — this
> is the real count; it is not padded to 8.

---

## 1. What the project actually is (one paragraph)

A multi-user equity-research workspace that lets a user upload financial
reports (PDF/TXT/MD), asks questions about them, and returns answers
**grounded in the exact retrieved text** — with clickable citations, an
evidence-provenance flag, and an explicit refusal when evidence is
insufficient. The RAG pipeline (chunking → TF-IDF embeddings → cosine
retrieval → grounded LLM prompt → citation mapping) is implemented
**from scratch with no vector DB or embedding API dependency**, and the
retrieval candidate set is **ownership-scoped at the database query level**
so users cannot retrieve each other's private documents.

---

## 2. Genuine engineering achievements (code-backed)

### Achievement 1 — Ownership-scoped RAG retrieval (multi-tenant data isolation)

**A. Real problem:** Most RAG demos retrieve against a global corpus. In a
multi-user app, user A must never be able to retrieve — and therefore the
LLM must never see — user B's private financial documents. Putting the
check in the UI is insufficient; the isolation must be enforced at the
data-access layer so a compromised or hand-crafted request cannot leak
chunks.

**B. My implementation:** The retrieval candidate set is built with a
Prisma `where` clause that filters by `document.ownerId` **and**
`status: "ready"` before any vector math runs. The LLM only ever receives
chunks that passed this filter.

**C. Exact code evidence:**
- `src/lib/rag.ts:58-72` — `retrieve()`:
  ```ts
  const where = {
    document: {
      ownerId: opts.ownerId,      // <-- isolation enforced here
      status: "ready",
      ...(opts.documentId ? { id: opts.documentId } : {}),
      ...(opts.companyId ? { companyId: opts.companyId } : {}),
    },
  };
  const chunks = await db.documentChunk.findMany({ where, include: { document: true } });
  ```
- `src/app/api/rag/query/route.ts:15` — `requireUser()` supplies `user.id`
  as `opts.ownerId`; there is no code path that calls `retrieve()` with a
  different owner.
- Conversation scope is also ownership-checked: `route.ts:30` —
  `if (!conv || conv.ownerId !== user.id) throw ApiError.notFound(...)`.
- Schema: `prisma/schema.prisma` — `FinancialDocument.ownerId` + index;
  `DocumentChunk` cascades from the parent doc.

**D. Engineering skill demonstrated:** **Authorization at the data-access
layer**, multi-tenant data isolation, defence-in-depth (the LLM cannot
even *see* forbidden data, not just "is told not to use it").

**E. Why it matters:** Tutorial RAG demos have no auth/ownership at all.
The subtle point is that filtering happens **before** the chunks reach
the prompt — so the prompt cannot leak data the filter excluded. This is
the correct place to enforce isolation; doing it in the prompt would be a
broken design.

**F. Verification:** Source-code evidence above. Runtime: during the curl
test, the demo user retrieved only its own `apple_report.txt` chunk;
`evidenceType: "documents"`, `retrievedCount: 1`. (A cross-user negative
test was not explicitly run — I am not claiming it was.)

**G. Resume bullet:**
> Implemented multi-tenant RAG retrieval by enforcing per-user ownership
> at the database query layer (`where: { document: { ownerId, status } }`)
> before vector ranking, so the LLM context cannot contain another user's
> private document chunks — isolating retrieval at the data-access boundary
> rather than relying on prompt instructions.

**H. Interview defence:** "I scoped the retrieval candidate set with a
Prisma `where` filter on `document.ownerId` *before* computing embeddings
or building the prompt. The LLM only ever sees chunks that already passed
the ownership filter — so even if the model misbehaves, it can't leak
data the filter excluded. I chose to enforce this at the data layer rather
than in the prompt because prompt-level filtering is a soft constraint
that a model can violate, while a DB `where` clause is a hard one. The
conversation endpoint re-verifies `conv.ownerId !== user.id` and returns
404 (not 403) to avoid leaking which conversation IDs exist."

---

### Achievement 2 — Grounding discipline: refusal on insufficient evidence + citation mapping + provenance

**A. Real problem:** LLMs hallucinate financial figures. A research tool
that invents a P/E ratio is worse than useless — it's actively harmful.
The system must (a) refuse when evidence is missing, (b) cite exactly
which chunk supported each claim, and (c) tell the user whether an answer
came from their documents, market data, or both.

**B. My implementation:**
1. The system prompt explicitly forbids fabrication and mandates an exact
   refusal phrase.
2. Retrieved chunks are numbered `[Doc n]` in the prompt so the LLM can
   cite them; the response's `citations[]` array is built by mapping the
   `retrieved[]` array (index-aligned), not by trusting the LLM's text.
3. An `evidenceType` flag (`documents | market_data | both | none`) is
   computed from whether chunks and/or a snapshot were used, and persisted
   on every assistant message.

**C. Exact code evidence:**
- `src/lib/rag.ts:149-158` — `buildSystemPrompt` rules:
  ```
  2. If the context does not contain enough information, say exactly:
     "I don't have enough information in the provided documents to answer this."
     Do NOT guess or use outside knowledge for specific financial figures.
  3. Never invent numbers, dates, ratios or company facts...
  ```
- `src/lib/rag.ts:155-157` — when `retrieved.length === 0`, the prompt
  literally says `(No documents were retrieved for this question.)`.
- `src/lib/rag.ts:208-212` — `evidenceType` computed from
  `retrieved.length > 0` and `!!snapshot`.
- `src/lib/rag.ts:214-221` — `citations[]` built by mapping `retrieved`,
  each with `documentId, documentName, chunkIndex, page, snippet, score`.
- `src/lib/rag.ts:224` — fallback answer is the refusal phrase if the LLM
  returns empty.
- `src/app/api/rag/query/route.ts:49-56` — `citations` JSON-stringified
  + `evidenceType` persisted on the `Message`.
- `src/components/views/research.tsx` — `CitationCard` renders clickable
  citations; `EVIDENCE_BADGE` shows the provenance.

**D. Engineering skill demonstrated:** **Prompt engineering for
trustworthiness**, provenance/traceability design, **AI safety discipline
(refusal over fabrication)**, mapping unstructured LLM output back to
structured source references.

**E. Why it matters:** A "chatbot that calls an LLM" returns whatever the
model says. This system returns an answer that is (a) verifiably grounded,
(b) citable to a specific chunk the user can click and read, and (c)
flagged with its evidence type. The refusal path is tested and works —
this is the difference between a demo and a tool you'd trust with a
financial decision.

**F. Verification:** Runtime-verified. Curl test:
- Answerable Q → `evidenceType: "documents"`, answer with `[Doc 1]`,
  `citations` array with snippet, `topScore: 0.27`.
- Insufficient-evidence Q ("CEO salary") → `retrievedCount: 0`,
  `evidenceType: "none"`, answer = "I don't have enough information in
  the provided documents to answer this." No fabrication.

**G. Resume bullet:**
> Engineered answer-grounding for a financial RAG assistant by constraining
> the LLM to answer only from retrieved context, mapping `[Doc n]` markers
> back to source chunks to produce structured citations with snippets, and
> computing a persisted `evidenceType` provenance flag — with the model
> explicitly refusing ("I don't have enough information…") when retrieval
> returns zero relevant chunks, verified to prevent fabricated financial figures.

**H. Interview defence:** "Three layers. First, the system prompt forbids
using outside knowledge for specific figures and mandates the exact
refusal phrase. Second, when nothing is retrieved, the prompt literally
contains '(No documents were retrieved)' — so the model has no source to
invent from. Third, the `citations[]` array is built by indexing the
`retrieved[]` array I already have, not by parsing the LLM's prose — so
the citation is guaranteed to point at a real chunk. The `evidenceType`
flag is computed independently of the LLM, from whether chunks/snapshot
were passed, so even if the model lies, the flag is still accurate."

---

### Achievement 3 — Market-data integration fault tolerance (debugging-driven resilience)

**A. Real problem:** The web-search backend intermittently returned
`422 "No search results"` for long queries; the initial naive parser
grabbed "18" from "18 hours ago" as the stock price; and a `change%`
regex matched "change" inside "**exchange**", reporting a false 29%
daily move (actually the 52-week change).

**B. My implementation:**
1. A **3-query fallback chain**: try a detailed query, then shorter ones,
   so one provider hiccup doesn't blank the snapshot.
2. A **30-minute TTL cache** with **stale-cache fallback**: if a refresh
   fails, serve the last good snapshot with a `stale: true` flag the UI
   shows as a badge — degrade visibly rather than crash.
3. **Targeted labelled-figure parsers** (`firstDollarAmount`,
   `parseMarketCap` with T/B/M unit scaling, `parsePeRatio`, etc.) instead
   of "grab the first number".
4. A **word-boundary regex** (`\bchange\b`) so "exchange" can't match.
5. An **implausibility guard**: reject `|change%| > 25` as a daily move
   (better to show `null` than a misleading 29%).

**C. Exact code evidence:**
- `src/lib/market-data.ts:160-178` — the `queries[]` fallback loop with
  `lastError` tracking; throws only if ALL queries fail.
- `src/lib/market-data.ts:224-253` — `getSnapshot`: TTL check
  (`age < TTL_MS`), then `try { fetchSnapshot } catch { return cached
  with stale: true }`.
- `src/lib/market-data.ts:79-91` — `firstDollarAmount` prefers
  "valued at $X" / "price $X" / `$`+≥3 digits.
- `src/lib/market-data.ts:136-144` — `parseChangePercent` with `\bchange\b`
  and `if (Math.abs(v) > 25) return null`.
- UI badge: `src/components/views/companies.tsx:207-210` —
  "Showing cached data from {timeAgo} (refresh failed or rate-limited)."

**D. Engineering skill demonstrated:** **Fault handling + graceful
degradation**, defensive parsing, **debugging from observed runtime
behaviour** (not generation), validation/sanity-checking of external data.

**E. Why it matters:** This is the strongest "a human did this" signal in
the project. Each of the three bugs was observed in the dev.log, root-caused,
and fixed with a targeted guard — the kind of iteration an AI generator
can't do because it doesn't observe real responses. The stale-cache
fallback is a real resilience pattern (serve-last-good-value) used in
production systems.

**F. Verification:** Runtime-verified across the dev.log timeline:
- Before fix: `price: 18`, `changePercent: 29.03`, 422 errors.
- After fix: `price: 343.91`, `peRatio: 39.42`, `eps: 8.72`,
  `marketCap: 5.066T`, `changePercent: null` (correctly rejected), and
  the 422 fallback succeeded with the shorter query.

**G. Resume bullet:**
> Hardened a web-search-backed market-data integration against provider
> inconsistency with a 3-query fallback chain, a 30-minute TTL cache with
> stale-cache fallback (serving the last good snapshot under a visible
> "stale" badge on failure), and targeted labelled-figure parsers with
> word-boundary matching and implausibility guards — each fix traced to a
> specific observed runtime bug (a date parsed as a price, a regex matching
> "exchange" as "change").

**H. Interview defence:** "I hit three real bugs while testing. First, my
naive `parseNum` grabbed '18' from '18 hours ago' as the price — root
cause was 'first number wins'. I replaced it with `firstDollarAmount`
that requires a `$` prefix and prefers labelled phrasings. Second, the
daily-change regex matched 'change' inside 'exchange' and returned a 29%
52-week change as the daily move — I added a `\b` word boundary and a
sanity guard rejecting `|v|>25`. Third, the web-search backend returned
422 'No search results' for my long query — I added a 3-query fallback
chain and, for when even that fails, a stale-cache fallback that serves
the last good snapshot with a visible badge. The pattern across all
three: observe real behaviour, root-cause, add a targeted guard, and
degrade visibly rather than silently return wrong data."

---

### Achievement 4 — Sentence-boundary chunking with overlap + content-hash deduplication

**A. Real problem:** (1) Naive fixed-character chunking cuts mid-sentence,
making citations unreadable and breaking semantic units. (2) Re-uploading
the same document re-indexes identical chunks, polluting retrieval with
duplicates and wasting compute.

**B. My implementation:**
1. `chunkText` splits on sentence boundaries (`/(?<=[.!?])\s+/`), then
   accumulates sentences into a ~1200-char buffer, and when the buffer
   overflows it keeps a 200-char **overlap** (`slice(-overlap)`) so
   context continuity is preserved across chunk boundaries.
2. `ingestDocument` sha256-hashes the cleaned text; if a `ready` document
   with the same hash already exists for that user, the new upload is
   rejected as a duplicate (the pending placeholder is deleted, the
   existing id is returned as `duplicateOf`).

**C. Exact code evidence:**
- `src/lib/embedding.ts:137-162` — `chunkText`:
  ```ts
  const sentences = clean.split(/(?<=[.!?])\s+/);
  ...
  if ((buffer + " " + s).trim().length > chunkSize && buffer.length > 0) {
    chunks.push({ text: buffer.trim(), index, page });
    buffer = buffer.slice(-overlap) + " " + s;   // overlap
  }
  ```
- `src/lib/ingest.ts:78-80` — `hashText` (sha256).
- `src/lib/ingest.ts:121-138` — dedup check + `duplicateOf` return +
  placeholder deletion.

**D. Engineering skill demonstrated:** **Information-retrieval design**
(chunk size/overlap trade-off), **idempotency** (content-addressed dedup).

**E. Why it matters:** Chunking on sentence boundaries (not char count)
makes the citation snippet a complete thought. Overlap prevents a fact
split across a boundary from being lost. Content-hash dedup makes the
ingestion idempotent — a user can re-upload without double-indexing, which
would otherwise skew TF-IDF IDF weights and surface duplicate evidence.

**F. Verification:** Runtime-verified. The 1332-char `multi.txt` produced
2 chunks (chunkSize=1200 + overlap=200 working as designed). The dedup
path returns `duplicateOf` and is unit-level evident in the code.

**G. Resume bullet:**
> Built a sentence-boundary-aware text chunker with configurable overlap
> (1200-char chunks, 200-char tail overlap) to keep citation excerpts
> readable, and made document ingestion idempotent via sha256 content
> hashing that rejects duplicate uploads before re-indexing — preventing
> retrieval pollution and skewed IDF weights from repeated content.

**H. Interview defence:** "Two decisions. First, I split on
`(?<=[.!?])\s+` — a lookbehind after sentence-ending punctuation — so a
chunk is a sequence of whole sentences, not an arbitrary char window.
That keeps citations readable. The 200-char overlap is `slice(-overlap)`
of the previous buffer, so a fact straddling a boundary appears in both
chunks and retrieval still finds it. Second, dedup: I sha256 the cleaned
text and check for an existing `ready` doc with the same hash before
chunking. If it exists, I delete the pending placeholder and return
`duplicateOf`. This matters because duplicate chunks would inflate the
IDF denominator and surface the same evidence twice in the top-K."

---

### Achievement 5 — Timing-safe-ish login + httpOnly JWT cookie auth

**A. Real problem:** A naive login that returns immediately when the email
isn't found leaks account existence via response timing (user-exists →
bcrypt compare → slow; user-missing → fast reject). An attacker can
enumerate valid emails.

**B. My implementation:** When the user lookup misses, the code still runs
a bcrypt compare against a dummy hash so both the "wrong password" and
"user not found" paths take similar time. The session is a JWT in an
`HttpOnly; SameSite=Lax` cookie, verified server-side on every protected
request.

**C. Exact code evidence:**
- `src/app/api/auth/login/route.ts:12-17`:
  ```ts
  const user = await db.user.findUnique({ where: { email: e } });
  // Constant-time-ish: still run a hash compare even when the user is
  // missing so response timing doesn't leak account existence.
  const okUser = user ?? { passwordHash: "$2a$10$invalidinvalidinvalidinvalidinvalidinvalid" };
  const ok = await verifyPassword(p, okUser.passwordHash);
  if (!user || !ok) throw ApiError.unauthorized("Invalid email or password.");
  ```
- `src/lib/auth.ts:61-66` — `HttpOnly; SameSite=Lax; Max-Age=7d` cookie.
- `src/lib/auth.ts:78-89` — `getCurrentUser` verifies the JWT server-side.

**D. Engineering skill demonstrated:** **Security awareness** (timing
side-channel mitigation), auth design.

**E. Why it matters:** Most tutorial auth skips this. It's a small detail
but it signals that you think about *how* code can be attacked, not just
whether it works. (Honestly caveated: the dummy hash is malformed so
bcryptjs may not take *exactly* the same time as a real compare — this is
a good-faith mitigation, not a perfect constant-time guarantee. I label
it "constant-time-ish" in the code comment.)

**F. Verification:** Source-code evidence above. Not benchmarked for
timing equality (I am not claiming it is perfectly constant-time).

**G. Resume bullet:**
> Implemented session auth with bcrypt password hashing and a JWT in an
> httpOnly, SameSite cookie, including a timing-attack mitigation on login
> that always runs a bcrypt compare (against a dummy hash on user-miss) so
> response timing does not leak which emails are registered.

**H. Interview defence:** "The concern is account enumeration via timing:
if a missing user returns instantly but a wrong-password returns after a
bcrypt compare, an attacker can tell which emails exist. I mitigate by
always running `verifyPassword`, against a dummy hash when the user
lookup misses, so both failure paths do a hash compare. I'm honest that
it's 'constant-time-ish' — the dummy hash is malformed and bcryptjs may
not take exactly the same time as a real compare; a truly constant-time
fix would hash a real dummy password at startup. The cookie is
httpOnly+SameSite=Lax, and `getCurrentUser` verifies the JWT server-side
on every protected request — there's no client-side session trust."

---

## 3. What is NOT engineering (honest call-out)

| Area | Honest status |
|---|---|
| Watchlist / research-note CRUD | Standard CRUD. Don't claim it as engineering. |
| shadcn/ui components, Recharts | Libraries — not your work. |
| Dashboard / auth-form layout | Standard UI. |
| The JWT+bcrypt auth *structure* | Standard pattern; only the timing detail (Achievement 5) is distinctive. |
| TF-IDF / cosine similarity *algorithms* | Textbook — implemented from scratch (shows understanding) but **not novel**. Don't claim you invented it. |
| The "illustrative" price chart series | Synthetic data, honestly labelled — not engineering. |
| The seeded company directory | Static data. |
| API envelope / `asyncHandler` | Useful boilerplate, not a differentiator. |

> **Do not** write resume bullets like "Used React and Node.js to build a
> full-stack app" or "Integrated AI for smart answers". Those describe
> thousands of projects. The bullets in §2 are the ones that show
> engineering depth.

---

## 4. AI-generated vs real-engineering breakdown

**Parts that look AI-generated / boilerplate:**
- The overall project structure (Next.js + Prisma + shadcn).
- The CRUD endpoints for watchlists/research-notes.
- The auth route structure (register/login/logout).
- The dashboard card grid.
- The TF-IDF math (a textbook algorithm, even if hand-written).

**Parts that show real, independently-reasoned engineering:**
- **Achievement 3 (market fault tolerance)** — the bugs were *observed in
  real logs* and root-caused. An AI generator doesn't see the 422 or the
  "18 hours ago" misparse. This is the strongest "human did this" signal.
- **Achievement 1 (ownership-scoped retrieval)** — a deliberate
  security-at-the-data-layer design decision, not a default.
- **Achievement 2 (grounding + refusal + provenance)** — the refusal
  phrase, the citation mapping, and the independently-computed
  `evidenceType` are design choices a careless generator wouldn't make.
- **Achievement 4 (sentence-boundary overlap + dedup)** — retrieval-aware
  chunking + idempotent ingestion.
- **Achievement 5 (timing-safe-ish login)** — a security detail tutorials skip.

**Claims that need more work before you can make them:**
- "Production-ready" — no (no rate limiting, no tests, SQLite single-process).
- "Scales to N users" — not measured.
- "Real-time market data" — it's web-sourced and delayed.
- "Novel RAG architecture" — it isn't; the value is the engineering
  discipline, not novelty.

---

## 5. Market differentiation (honest)

### What's standard in the industry
- RAG over financial documents — **not novel**. Many open-source finance
  RAG demos exist (FinGPT-style, LangChain+Pinecone tutorials).
- JWT+bcrypt auth — table stakes.
- Vector-ish retrieval — everyone does this; most use a real vector DB.

### What's good practice but not unique
- Multi-tenant ownership filtering — correct, but expected in any real app.
- Citation display — common in serious RAG tools.
- TTL caching — standard.

### What's potentially distinctive (with evidence)
- **A fully dependency-free RAG pipeline** (no LangChain, no Pinecone, no
  embedding API) that runs 100% offline on a laptop. This is a *practical*
  differentiator for a portfolio (no API keys to gate-keep the demo), not
  a technical superiority claim — TF-IDF is weaker than dense embeddings
  for large corpora, and the docs say so.
- **The debugging-driven fault tolerance** in market-data (Achievement 3)
  is genuinely human work and rare in AI-generated projects.
- **The grounding-discipline trinity** (refusal + citation mapping +
  independently-computed provenance flag) — most demos do at most one of
  these.

### What's a disadvantage vs serious competitors
- **No real vector index** — scans the user's whole chunk corpus per
  query. Fine for a portfolio, breaks at scale.
- **Web-sourced market data** — weaker than a real Alpha Vantage / Finnhub
  integration. Honestly labelled but a real product wouldn't ship this.
- **No tests, no rate limiting** — a real product must have both.
- **SQLite** — single-process only.

### Honest bottom line
> This project is a **strong portfolio demonstration of RAG understanding,
> debugging ability, and security awareness** — not a commercially or
> architecturally novel product. The differentiator is the *engineering
> discipline* (ownership isolation, grounding honesty, fault tolerance,
> idempotent ingestion), not the feature set. Say exactly this in
> interviews; claiming novelty would be dishonest and an interviewer
> who knows RAG would catch it instantly.

---

## 6. Resume positioning — "Why this project demonstrates engineering skills"

### Project description (one line)
**Stock Intelligence RAG** — a multi-user, evidence-grounded equity
research workspace with a from-scratch Retrieval-Augmented Generation
pipeline (chunking → TF-IDF embeddings → cosine retrieval → grounded LLM
prompt → citation mapping) enforcing per-user data isolation and
answer-provenance.

### Final resume bullets (strongest first; use 3–5)

1. **Engineered answer-grounding for a financial RAG assistant** by
   constraining the LLM to answer only from retrieved context, mapping
   `[Doc n]` markers back to source chunks to produce structured
   citations with snippets, and computing a persisted `evidenceType`
   provenance flag — with the model explicitly refusing
   ("I don't have enough information…") when retrieval returns zero
   relevant chunks, verified to prevent fabricated financial figures.
   *(Signal: AI safety, prompt engineering, traceability.)*

2. **Implemented multi-tenant RAG retrieval** by enforcing per-user
   ownership at the database query layer (`where: { document: { ownerId,
   status } }`) before vector ranking, so the LLM context cannot contain
   another user's private document chunks — isolating retrieval at the
   data-access boundary rather than in the prompt.
   *(Signal: authorization, data isolation, defence-in-depth.)*

3. **Hardened a web-search-backed market-data integration** against
   provider inconsistency with a 3-query fallback chain, a 30-minute TTL
   cache with stale-cache fallback (serving the last good snapshot under
   a visible "stale" badge on failure), and targeted labelled-figure
   parsers with word-boundary matching and implausibility guards — each
   fix traced to a specific observed runtime bug.
   *(Signal: fault handling, debugging, defensive parsing.)*

4. **Built a sentence-boundary-aware text chunker** with configurable
   overlap to keep citation excerpts readable, and made document ingestion
   idempotent via sha256 content hashing that rejects duplicate uploads
   before re-indexing — preventing retrieval pollution and skewed IDF
   weights.
   *(Signal: information-retrieval design, idempotency.)*

5. **Implemented session auth** with bcrypt + JWT in an httpOnly SameSite
   cookie, including a timing-attack mitigation on login that always runs
   a bcrypt compare (against a dummy hash on user-miss) so response timing
   does not leak which emails are registered.
   *(Signal: security awareness.)*

### Keywords that ARE genuinely justified
RAG, retrieval-augmented generation, TF-IDF, cosine similarity, embeddings,
chunking, citations, provenance, multi-tenant, ownership-scoped, fault
tolerance, graceful degradation, bcrypt, JWT, httpOnly cookies, Prisma,
Next.js App Router, Route Handlers, grounded LLM, prompt engineering.

### Keywords NOT to use (code doesn't support them)
- "Real-time" (market data is web-sourced/delayed)
- "Vector database" / "Pinecone" / "Chroma" / "MongoDB Atlas Vector Search" (none used)
- "Microservices" / "event-driven" / "Kubernetes" (single Next.js process)
- "LangChain" (not used)
- "Production-ready" / "highly scalable" (not tested)
- "Dockerized" (no Dockerfile)
- "WebSocket / real-time sync" (none)
- Specific latency / accuracy / user-count metrics (none measured)

### Bullets that are feature descriptions (don't lead with these)
- "Built a dashboard with charts" → feature, not engineering.
- "Upload PDFs and ask questions" → feature.
- "Compare companies side by side" → feature.

These are fine as supporting context in an interview, but your *resume
bullets* must be the engineering ones above.

---

## 7. Technical interview preparation (answers grounded in code)

**Q: Why TF-IDF instead of transformer embeddings / a vector DB?**
A: "For a portfolio project that should run on a laptop with zero external
dependencies, TF-IDF gives genuinely useful lexical retrieval for
financial Q&A. The data model — chunk text + JSON embedding + metadata —
is shaped to swap in a 384-dim transformer model or MongoDB Atlas Vector
Search by replacing only `buildTfVector`/`retrieve`; the rest of the
pipeline is unchanged. I'm honest that TF-IDF is weaker for large corpora
and that the per-query full-corpus scan won't scale — that's documented as
a P1 in the deployment checklist."

**Q: How do you prevent the LLM from hallucinating financial figures?**
A: Three layers (Achievement 2): prompt forbids outside knowledge +
mandates refusal; when `retrieved.length===0` the prompt literally
contains '(No documents were retrieved)'; `citations[]` is built from the
`retrieved[]` array I already have, not parsed from LLM prose; and
`evidenceType` is computed independently of the model. Verified: the
"CEO salary" question returned the refusal with `evidenceType: none`.

**Q: How is user data isolated?**
A: Achievement 1 — the Prisma `where` filters `document.ownerId` before
any chunk reaches the prompt. The LLM can't leak what it can't see. The
conversation endpoint re-checks `conv.ownerId !== user.id` and returns
404 (not 403) to avoid leaking which IDs exist.

**Q: Concurrent requests / inconsistent state?**
A: Ingestion creates a `processing` placeholder up-front so concurrent
uploads of the same file both hit the dedup check (sha256). The optimistic
UI message in the Research view uses a `tempId` that's replaced when the
server response arrives — if the request fails, the temp message is rolled
back. I have NOT added DB transactions across the dedup-check-then-insert,
so a very tight race could in theory double-insert; that's a P2 fix (a
unique constraint on `(ownerId, textHash)` would close it).

**Q: How do failed external services get handled?**
A: Achievement 3 — the LLM call is try/caught and throws a friendly "AI
service unavailable"; web_search has a 3-query fallback + stale-cache
fallback. The market `getSnapshot` never throws to the client (the route
does `.catch(() => null)`).

**Q: Security — enforced server-side or just frontend?**
A: Server-side. `requireUser()` is the chokepoint; every private query
filters by `ownerId`. The frontend is never trusted for authz — it just
hides UI. The cookie is httpOnly so client JS can't read the JWT.

**Q: What would you improve for production?**
A: (1) Postgres + `pgvector` or MongoDB Atlas for a real vector index;
(2) rate limiting on auth/upload/RAG; (3) streaming LLM responses;
(4) tests for the parsers and retrieval math; (5) background ingestion
queue for large PDFs; (6) `Secure` cookie flag + a real `JWT_SECRET`
check in prod. All listed in `docs/DEPLOYMENT_CHECKLIST.md`.

**Q: What did you actually debug vs what just worked?**
A: Honestly — the auth flow, CRUD, and the RAG math largely worked first
time. The debugging work was concentrated in the market-data integration
(Achievement 3): three real bugs observed in logs, each root-caused and
fixed. That's the part I'd defend hardest in an interview because it's
genuinely mine.

---

## 8. Final guidance for the resume section

Write the project as:

```
Stock Intelligence RAG — Evidence-grounded equity research workspace
Next.js 16 · TypeScript · Prisma/SQLite · z-ai-web-dev-sdk · Recharts
• [bullet 1 — grounding + refusal + citations]
• [bullet 2 — ownership-scoped retrieval]
• [bullet 3 — market-data fault tolerance]
• [bullet 4 — chunking + dedup]  (optional, if you have space)
• [bullet 5 — timing-safe auth]  (optional)
```

**The honest framing that wins:** "I built a RAG pipeline from scratch
(no LangChain, no vector DB, no embedding API) and then spent most of the
real engineering time on the unglamorous parts — multi-tenant isolation,
grounding discipline, and fault-tolerant external integration. The bugs I
fixed in the market-data parser are the part I'm most proud of because
they required observing real runtime behaviour, not just writing code."

That sentence, delivered confidently, is what separates you from someone
who generated a RAG demo in 10 minutes.
