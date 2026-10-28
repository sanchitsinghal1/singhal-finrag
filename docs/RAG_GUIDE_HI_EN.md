# RAG Guide — Hindi + English (Hinglish) Tutorial

> Is file mein hum RAG (Retrieval-Augmented Generation) ko **asli code** ke saath
> samjhenge. Har concept Hinglish mein explain hoga, lekin code aur identifiers
> English mein rahenge taaki aap unhe directly project mein dekh sako.

This guide walks through the **complete RAG pipeline** inside this Stock
Intelligence app — from "user ne question type kiya" to "answer with citations
screen pe aaya". Every step points to the real file that implements it.

---

## 0. TL;DR — RAG ka simple sa matlab

**RAG = pehle relevant documents dhoondo, phir un documents ko LLM ko do, aur
LLM se answer likhwao.**

- LLM akele sirf apne training data se jawab deta hai → woh outdated ya galat
  ho sakta hai (financial figures ke liye khatarnak).
- RAG mein hum LLM ko **context** dete hain (jo humari documents se aaya hai),
  aur bolte hain: "sirf is context se jawab do, agar context mein nahi hai to
  bolo 'I don't have enough information'."

Is project ka **poora RAG logic** 3 files mein hai:

| Step | File |
|------|------|
| Document ko chunks todna + embeddings banana | `src/lib/ingest.ts` + `src/lib/embedding.ts` |
| Question ka embedding bana ke relevant chunks dhoondna | `src/lib/rag.ts` (function `retrieve`) |
| LLM ko context + question dena, answer + citations wapas dena | `src/lib/rag.ts` (function `answer`) |

---

## 1. RAG kya hai aur yeh app iska use kyun karta hai

**Retrieval-Augmented Generation (RAG)** ek pattern hai jisme hum LLM ki
generation power ko ek **external knowledge store** se jodte hain.

Is app mein "external knowledge store" = user ke dwara upload ki gayi
financial reports (PDFs, annual reports, notes) + latest market snapshot.

**Bina RAG ke kya hota?** LLM se poochhte "Apple ka 2023 revenue kya tha?" →
LLM apne training data se (jo shayad 2023 tak cover nahi karta, ya galat
figure yaad karta) jawab deta. Financial research mein yeh **kabhi
acceptable nahi hai** — wrong number = wrong investment decision.

**RAG ke saath kya hota?** Hum pehle user ki uploaded Apple 10-K se relevant
chunk nikaalte hain jisme 2023 revenue likha hai, phir LLM ko bolte hain "is
chunk ko padh ke jawab de". Ab answer **grounded** hai — humein exact source
citation bhi mil jaata hai (`[Doc 1]`).

---

## 2. LLM kya karta hai vs Retrieval kya karta hai

```
[ User ka question ]
        |
        v
+-------------------+        +-----------------------+
|   RETRIEVAL       |  -->>  |   LLM (Generation)    |
|   "relevant text  |        |   "diye hue context   |
|    dhoondho"      |        |    se jawab likho"    |
+-------------------+        +-----------------------+
        |                              |
        | aapki documents              | grounded answer
        | se top-K chunks              | + [Doc n] citations
        v                              v
[ DocumentChunk table ]         [ Message with citations ]
```

- **Retrieval** = *search*. Iska kaam sirf yeh decide karna hai ki kaunse
  text pieces (chunks) is question ka jawab dete hain. Yahan hum TF-IDF
  embeddings + cosine similarity use karte hain (next sections).
- **LLM** = *writer*. Iska kaam retrieve kiye hue chunks ko padh ke ek
  coherent, well-cited answer likhna hai. Yahan hum
  `z-ai-web-dev-sdk` ke `chat.completions.create()` ka use karte hain.

Dono alag cheezein hain — aur yeh separation hi RAG ko powerful banati hai.

---

## 3. Embeddings kya hain — text kaise vector banta hai

**Embedding** = text ko numbers ke ek array (vector) mein badalna, aise ki
**similar text → similar vectors** ho.

### 3.1 Dense embeddings (jaise OpenAI / transformers dete hain)

Model text ko 384 ya 768 numbers ke array mein badal deta hai. Har number ek
"semantic dimension" hai. Similar sentences ke vectors dot-product /
cosine pe close aate hain. Yeh powerful hai par model download ya API key
maangta hai.

### 3.2 Is project ka approach — TF-IDF sparse embeddings (zero dependency)

Hum ek classic, **fully local** technique use karte hain jise koi model
download nahi karna padta:

1. Text ko tokens mein todo (lowercase, stopwords hatao).
2. Har term ki **frequency (TF)** count karo per chunk → ek sparse vector
   `{ "apple": 2, "revenue": 1, "383": 1, ... }`.
3. Query ke liye bhi same TF vector banao.
4. Har term ka **IDF** = `ln(1 + N / (1 + df))` — yeh common terms
   (jaise "the") ko penalize karta hai aur rare but important terms ko
   reward karta hai.
5. **Cosine similarity** se query vector ko har chunk vector se compare karo.
6. Top-K chunks = retrieved evidence.

> **Dhyan rakhein:** yeh ek *real* embedding hai (text → numeric vector →
> cosine similarity). Yeh 384-dim transformer embeddings jitna semantic nahi
> hai, lekin financial-document Q&A ke liye kaafi achha kaam karta hai, aur
> iske liye **koi external API / model download nahi chahiye** — isliye yeh
> ek laptop pe 100% offline chalne wala RAG demo ban jaata hai.

### 3.3 Upgrade path (production ke liye)

`src/lib/embedding.ts` ke comments mein bataya gaya hai: agar aap dense
transformer embeddings chahte ho, to sirf `embedQuery` aur `embedChunk` ko
replace karna hai taaki woh ek `Float[]` (same dimension) return karein.
Storage (`DocumentChunk.embedding` JSON string) aur retrieval logic
(cosine similarity) same rehta hai.

---

## 4. Chunking aur overlap kaise kaam karte hain

Badi PDF (e.g. 200-page annual report) ko hum seedha LLM ko nahi de sakte —
context window limited hai, aur retrieval bhi precise honi chahiye. Isliye
hum **chunking** karte hain.

File: `src/lib/embedding.ts` → function `chunkText(text, chunkSize=1200, overlap=200)`

```
Full document text
|============ chunk 0 (1200 chars) ============|
                          |== overlap 200 ==|
                          |============ chunk 1 (1200 chars) ============|
                                                |== overlap 200 ==|
                                                |============ chunk 2 ====...
```

- **chunkSize = 1200 chars**: ek chunk itna bada hai ki ek topic / ek
  sentence-cluster sambhal jaaye, par itna chhota ki retrieval precise rahe.
- **overlap = 200 chars**: har chunk apne pichle chunk ke 200-char tail
  reuse karta hai. **Kyun?** Taaki agar ek important fact sentence
  boundary pe cut ho jaaye, to woh dono chunks mein partially present rahe.
- Hum **sentence boundaries** pe split karte hain (`/(?<=[.!?])\s+/`) taaki
  chunks beech-mein-sentence cut na ho — citations readable rahein.

Code (simplified):

```ts
for (const s of sentences) {
  if ((buffer + " " + s).length > chunkSize && buffer.length > 0) {
    chunks.push({ text: buffer, index });
    index++;
    buffer = buffer.slice(-overlap) + " " + s; // overlap!
  } else {
    buffer = (buffer + " " + s).trim();
  }
}
```

---

## 5. Retrieval — relevant chunks kaise nikaalte hain

File: `src/lib/rag.ts` → function `retrieve(question, opts)`

```
1. Candidate set = user ke saare READY chunks
     (ownership filter: sirf us user ke, jisne doc upload kiya)
     + optional companyId / documentId scope
2. Question ka TF vector banao:  buildTfVector(question)
3. Har chunk ka TF vector deserialize karo (DB mein JSON string pada hai)
4. IDF compute karo candidate corpus pe:  computeIdf(chunkVecs)
5. Har chunk ke liye cosineTfidf(query, chunk, idf) score
6. Score desc order, top-5 le lo
7. Near-zero (< 0.001) matches hata do — yeh sirf noise hain
```

Access control yahin hota hai: `where: { document: { ownerId, status: 'ready' } }`
→ user doosre user ke private documents se retrieve nahi kar sakta.

---

## 6. MongoDB Vector Search vs yeh SQLite implementation

> User ki original spec MongoDB Atlas Vector Search maangti hai. Is sandbox
> mein **sirf SQLite (via Prisma)** available hai, isliye hum vector search
> application code mein karte hain. Data model aur flow bilkul compatible
> hai MongoDB Atlas se migrate karne ke liye.

**MongoDB Atlas Vector Search** mein kya karte:
1. `DocumentChunk` collection mein `embedding` field (Array<Float>) rakho.
2. Atlas pe ek `vectorSearch` index banao (field: `embedding`, dimensions,
   similarity: `cosine`).
3. Query: `$vectorSearch` aggregation — MongoDB khud top-K nikaal deta hai.

**Yahan (SQLite)** hum kya karte:
1. `DocumentChunk.embedding` mein TF-IDF sparse vector JSON string ki tarah.
2. Retrieval application code mein (cosine over candidates).
3. Same data shape (text + vector + metadata) — migrate karna easy.

Agar aap MongoDB pe migrate karna chahein: `prisma/schema.prisma` ko
`mongodb` provider pe switch karo, `DocumentChunk.embedding` ko `Float[]`
karo, aur `src/lib/rag.ts::retrieve` ko `$vectorSearch` query se replace
karo. Baki sab (ingest, prompt, citations) same rahega.

---

## 7. Retrieved context ko LLM ko kaise dete hain

File: `src/lib/rag.ts` → function `buildSystemPrompt`

Hum ek **system prompt** banate hain jisme:

1. Role: "You are a careful financial research assistant."
2. Retrieved chunks, numbered `[Doc 1]`, `[Doc 2]`, ... ke saath, with
   document name + page.
3. (Optional) Market snapshot — price, P/E, EPS, 52w range, source, timestamp.
4. **Strict rules:**
   - "answer ONLY from the provided context"
   - "cite as [Doc n]"
   - "if context doesn't have enough info, say exactly 'I don't have
     enough information in the provided documents to answer this.'"
   - "NEVER invent numbers, dates, ratios or company facts"
   - "distinguish facts (from docs/market) vs interpretation (your reasoning)"

Yeh rules hi grounded answers dete hain. **Hum koi answer hardcode nahi
karte** — agar user ne document nahi upload kiya, to `retrieved.length === 0`
aur LLM ko "(No documents were retrieved)" dikhta → woh honestly kehta hai
"not enough information".

---

## 8. Citations kaise generate hote hain

LLM answer mein `[Doc 1]`, `[Doc 2]` jaise markers lagata hai (kyunki system
prompt mein bola hai). Hum in markers ko apne `retrieved[]` array ke index se
map karte hain:

```ts
const citations: Citation[] = retrieved.map((r) => ({
  documentId: r.chunk.documentId,
  documentName: r.chunk.document?.originalName,
  chunkIndex: r.chunk.chunkIndex,
  page: r.chunk.page,
  snippet: makeSnippet(r.chunk.text, question), // ~240 chars around query term
  score: r.score,
}));
```

Frontend (`src/components/views/research.tsx` → `CitationCard`) har citation
ko clickable banata hai — click karne se user us document ke detail view pe
jata hai jahan woh us chunk ko padh sakta hai.

---

## 9. Frontend se backend tak ka complete flow

```
[ Browser: Research view, user types question ]
        |
        | POST /api/rag/query { question, conversationId, companyId?, documentId? }
        v
[ src/app/api/rag/query/route.ts ]
   - requireUser()           // auth check
   - loadHistory(convId)     // prior messages for multi-turn context
        |
        | calls answer(question, { ownerId, companyId, documentId, history })
        v
[ src/lib/rag.ts :: answer() ]
   1. retrieve(question, opts)   -> top-K chunks
   2. (if companyId) fetch latest StockSnapshot for grounding
   3. buildSystemPrompt(retrieved, snapshot)
   4. messages = [system, ...history, question]
   5. zai.chat.completions.create({ messages, thinking: disabled })
   6. return { answer, citations, evidenceType, retrievedCount, topScore }
        |
        v
[ route.ts persists user msg + assistant msg (with citations JSON) ]
        |
        | { success: true, data: { answer, citations, ... } }
        v
[ Research view renders answer + CitationCards + evidence badge ]
```

---

## 10. RAG service MongoDB/AI provider ko kaise call karta hai

`src/lib/rag.ts` → `answer()`:

- **MongoDB (via Prisma/SQLite here):** `db.documentChunk.findMany(...)` se
  candidate chunks laata hai, embeddings deserialize karta hai, cosine score
  karta hai. (MongoDB Atlas pe yeh `$vectorSearch` hoga.)
- **AI provider:** `getZai()` (singleton in `src/lib/zai.ts`) →
  `zai.chat.completions.create({ messages, thinking: { type: 'disabled' } })`.
  Response: `completion.choices[0].message.content`.

`src/lib/market-data.ts` → `fetchSnapshot()`:
- `zai.functions.invoke('web_search', { query, num })` se real web results
  laata hai, snippets se price/P-E/EPS regex se parse karta hai, aur
  `StockSnapshot` table mein cache karta hai (30-min TTL, stale-cache
  fallback with badge).

---

## 11. Financial data APIs kaise connected hain

Is sandbox mein koi paid market-data key (Alpha Vantage / Finnhub / Tiingo)
configured nahi hai. Isliye market data **web_search** skill se aata hai
(real web results, e.g. Yahoo Finance / Nasdaq snippets).

- `fetchSnapshot()` ek focused web search karta hai, snippets ko aggregate
  karta hai, aur labelled figures (P/E ratio, Market Cap, EPS, 52w high/low)
  ko targeted regex se parse karta hai.
- Har snapshot apna `source = "web_search"` aur `fetchedAt` timestamp
  rakhta hai → UI provenance + staleness dikhata hai.
- **Yeh real-time tick data NAHI hai.** Yeh "latest publicly available
  summary" hai. UI har jagah yeh clearly label karta hai.

**Production upgrade:** `src/lib/market-data.ts::fetchSnapshot` ko replace
karke kisi real provider ka REST call daal do — baki app same rahega.

---

## 12. Common errors aur unka debugging

| Symptom | Sanya | Fix |
|---------|-------|-----|
| "I don't have enough information..." har baar aata hai | Retrieve mein 0 chunks aaye | Doc `ready` status pe hai? User same hai? `documentId`/`companyId` scope galat to nahi? |
| Citations empty, par answer aata hai | `retrieved` scores sab < 0.001 (near zero) | Query aur doc ka vocabulary overlap check karo; TF-IDF small corpus pe weak hai |
| `The AI service is unavailable right now` | `zai.chat.completions.create` throw | Rate limit / network — retry, ya `getZai()` singleton corrupt hua (restart) |
| Market snapshot null sab fields | web_search ne "No search results" return kiya | `queries[]` fallback chain dekho (3 queries try hoti hain); TTL 30 min hai, stale cache chalega |
| `401 Authentication required` | Cookie nahi bheji | `credentials: 'include'` client side; cookie httpOnly hai |
| `409 Conflict` on upload | Same text-hash pehle se hai | Duplicate detection — same content dobara index nahi hota |
| "No extractable text found" | PDF scanned image hai | OCR enabled nahi hai — text-based PDF ya TXT/MD use karo |

---

## 13. File-by-file map — kaunsa step kahan hai

| Pipeline step | File | Function |
|---|---|---|
| Upload + extract + chunk + embed + persist | `src/lib/ingest.ts` | `ingestDocument` |
| Text extraction (PDF/TXT) | `src/lib/ingest.ts` | `extractText` |
| Chunking (size + overlap) | `src/lib/embedding.ts` | `chunkText` |
| TF-IDF vectorizer | `src/lib/embedding.ts` | `buildTfidf`, `tokenize`, `computeIdf` |
| Cosine similarity | `src/lib/embedding.ts` | `cosineTfidf` |
| Duplicate detection (sha256) | `src/lib/ingest.ts` | `hashText` |
| Retrieve top-K chunks | `src/lib/rag.ts` | `retrieve` |
| Build grounded system prompt | `src/lib/rag.ts` | `buildSystemPrompt` |
| Call LLM + attach citations | `src/lib/rag.ts` | `answer` |
| Market data fetch + cache | `src/lib/market-data.ts` | `fetchSnapshot`, `getSnapshot` |
| RAG HTTP endpoint | `src/app/api/rag/query/route.ts` | `POST` |
| Document upload endpoint | `src/app/api/documents/route.ts` | `POST` |
| Auth (JWT + bcrypt) | `src/lib/auth.ts` | `hashPassword`, `signSession`, `requireUser` |

---

## Recap (ek line mein)

> User question → uska TF vector → cosine se relevant chunks dhoondho →
> un chunks ko LLM ke prompt mein daalo → LLM grounded answer likhta hai
> with `[Doc n]` citations → hum citations ko real document/chunk pe map
> karke clickable source cards dikhate hain. **No hardcoded answers, ever.**
