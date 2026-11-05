// ============================================================================
// Embedding Service — TF-IDF vectorizer + cosine similarity + text chunking
// ============================================================================
// This is the "math" behind retrieval. It's a from-scratch, dependency-free
// implementation (no LangChain, no OpenAI embeddings, no vector DB).
//
// WHAT IS AN EMBEDDING?
//   An embedding turns text into a numeric vector so similar texts have
//   similar vectors. We use TF-IDF: each dimension = a term, the value =
//   how often that term appears in THIS chunk, weighted by how RARE it is
//   across the whole corpus (IDF). Cosine similarity then measures how
//   "aligned" two vectors are -> how related the texts are.
//
// FUNCTIONS:
//   tokenize(text)      -> lowercase, split on word/number boundaries, drop stopwords
//   buildTfVector(text) -> { term: count } sparse map + total token count
//   computeIdf(chunks)  -> per-term inverse-document-frequency (rare terms score higher)
//   cosineTfidf(q,c,idf)-> similarity score between a query and a chunk (0..1)
//   chunkText(text,...) -> split a document into ~1200-char sentence-aware chunks
//                          with 200-char overlap (so context isn't lost at boundaries)
//
// WHY TF-IDF (not dense transformer embeddings)?
//   It runs 100% locally with zero external API/model download — perfect for a
//   portfolio project that should work on any laptop. The data shape
//   (chunk text + JSON embedding + metadata) is designed to swap in a dense
//   model or MongoDB Atlas Vector Search by replacing only this file.
// ============================================================================

const STOPWORDS = new Set([
  "a","an","the","and","or","but","if","then","of","in","on","at","to","for",
  "with","by","from","up","down","out","over","under","again","is","are","was",
  "were","be","been","being","have","has","had","do","does","did","will","would",
  "should","could","may","might","must","this","that","these","those","i","you",
  "he","she","it","we","they","them","his","her","its","our","their","as","not",
  "no","nor","so","than","too","very","can","just","about","above","after","all",
  "also","any","because","before","between","both","each","few","more","most",
  "other","some","such","only","own","same","very","s","t","don","now","per",
  "vs","etc","company","companies","inc","ltd","corp","corporation","year","quarter",
  "million","billion","dollars","usd","rs","crore","lakh","figure","figures",
]);

export function tokenize(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const raw = lower.match(/[\p{L}\p{N}]+/gu) ?? [];
  const out = [];
  for (const tok of raw) {
    if (tok.length < 2) continue;
    if (STOPWORDS.has(tok)) continue;
    out.push(tok);
  }
  return out;
}

export function buildTfVector(text) {
  const tokens = tokenize(text);
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;
  return { tf, len: tokens.length };
}

export function computeIdf(chunks) {
  const df = {};
  const N = Math.max(1, chunks.length);
  for (const c of chunks) {
    for (const term of Object.keys(c.tf)) {
      df[term] = (df[term] ?? 0) + 1;
    }
  }
  const idf = {};
  for (const term of Object.keys(df)) {
    idf[term] = Math.log(1 + N / (1 + df[term]));
  }
  return idf;
}

export function cosineTfidf(query, chunk, idf) {
  let dot = 0;
  let qNorm = 0;
  let cNorm = 0;
  for (const [t, f] of Object.entries(query.tf)) {
    const w = f * (idf[t] ?? 0);
    qNorm += w * w;
  }
  for (const [t, f] of Object.entries(chunk.tf)) {
    const w = f * (idf[t] ?? 0);
    cNorm += w * w;
  }
  if (qNorm === 0 || cNorm === 0) return 0;
  for (const [t, f] of Object.entries(query.tf)) {
    const cf = chunk.tf[t];
    if (cf === undefined) continue;
    const w = idf[t] ?? 0;
    dot += (f * w) * (cf * w);
  }
  return dot / (Math.sqrt(qNorm) * Math.sqrt(cNorm));
}

export function chunkText(text, chunkSize = 1200, overlap = 200, page) {
  if (!text || !text.trim()) return [];
  const clean = text.replace(/\r/g, "").trim();
  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let buffer = "";
  let index = 0;
  for (const s of sentences) {
    if ((buffer + " " + s).trim().length > chunkSize && buffer.length > 0) {
      chunks.push({ text: buffer.trim(), index, page });
      index++;
      buffer = buffer.slice(-overlap) + " " + s;
    } else {
      buffer = (buffer + " " + s).trim();
    }
  }
  if (buffer.trim()) chunks.push({ text: buffer.trim(), index, page });
  return chunks;
}

export function serialize(v) { return JSON.stringify(v); }
export function deserialize(s) {
  try {
    const p = JSON.parse(s);
    return { tf: p.tf ?? {}, len: p.len ?? 0 };
  } catch {
    return { tf: {}, len: 0 };
  }
}
