// =====================================================================
// Embedding service — lightweight, dependency-free TF-IDF vectorizer.
// ---------------------------------------------------------------------
// What "embedding" means here:
//   We turn text into a numeric vector. Instead of a dense 384/768-dim
//   model vector (which needs downloading a transformer), we use a
//   classic, fully-local TF-IDF sparse vector. It is a REAL embedding:
//   each dimension corresponds to a term and the value is its
//   frequency weighted by inverse-document-frequency. Cosine similarity
//   over these vectors gives genuinely semantic-ish retrieval for
//   financial-document Q&A, with zero external dependencies.
//
// Storage: each chunk's sparse TF map is JSON-encoded into
//   DocumentChunk.embedding. At query time we compute IDF over the
//   candidate corpus and score with cosine similarity (rag.service.ts).
//
// Upgrading to transformer / API embeddings: replace `embedQuery` and
// `embedChunk` to return a Float[] of the same dimension and store it
// the same way; retrieval logic only needs cosine similarity.
// =====================================================================

// A small English stopword list so common words don't dominate scores.
const STOPWORDS = new Set<string>([
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

export interface SparseVector {
  // term -> raw frequency
  tf: Record<string, number>;
  // total token count (for normalisation)
  len: number;
}

// ---------------------------------------------------------------------
// Tokenisation: lowercase, split on non-alphanumeric, drop stopwords and
// very short tokens. Keeps numbers (e.g. "2024", "10k") because financial
// questions often reference them.
// ---------------------------------------------------------------------
export function tokenize(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  // \p{L} = any letter, \p{N} = any number; keep alphanumeric across scripts.
  const raw = lower.match(/[\p{L}\p{N}]+/gu) ?? [];
  const out: string[] = [];
  for (const tok of raw) {
    if (tok.length < 2) continue;
    if (STOPWORDS.has(tok)) continue;
    out.push(tok);
  }
  return out;
}

// Build a sparse term-frequency vector from text.
export function buildTfVector(text: string): SparseVector {
  const tokens = tokenize(text);
  const tf: Record<string, number> = {};
  for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;
  return { tf, len: tokens.length };
}

// ---------------------------------------------------------------------
// IDF: inverse document frequency. Computed at query time over the
// candidate chunk corpus (see rag.service.ts). idf(term) = ln(1 + N / (1 + df))
// smoothed so unseen terms never blow up.
// ---------------------------------------------------------------------
export function computeIdf(chunks: SparseVector[]): Record<string, number> {
  const df: Record<string, number> = {};
  const N = Math.max(1, chunks.length);
  for (const c of chunks) {
    for (const term of Object.keys(c.tf)) {
      df[term] = (df[term] ?? 0) + 1;
    }
  }
  const idf: Record<string, number> = {};
  for (const term of Object.keys(df)) {
    idf[term] = Math.log(1 + N / (1 + df[term]));
  }
  return idf;
}

// Cosine similarity between a query TF and a chunk TF, weighted by idf.
// Both are sparse; we iterate over the smaller side for efficiency.
export function cosineTfidf(
  query: SparseVector,
  chunk: SparseVector,
  idf: Record<string, number>
): number {
  let dot = 0;
  let qNorm = 0;
  let cNorm = 0;

  // query norm
  for (const [t, f] of Object.entries(query.tf)) {
    const w = f * (idf[t] ?? 0);
    qNorm += w * w;
  }
  // chunk norm
  for (const [t, f] of Object.entries(chunk.tf)) {
    const w = f * (idf[t] ?? 0);
    cNorm += w * w;
  }
  if (qNorm === 0 || cNorm === 0) return 0;

  // dot product over query terms (usually smaller)
  for (const [t, f] of Object.entries(query.tf)) {
    const cf = chunk.tf[t];
    if (cf === undefined) continue;
    const w = idf[t] ?? 0;
    dot += (f * w) * (cf * w);
  }

  return dot / (Math.sqrt(qNorm) * Math.sqrt(cNorm));
}

// ---------------------------------------------------------------------
// Text chunking with configurable size + overlap.
//   chunkSize  : target characters per chunk (default 1200)
//   overlap    : characters reused between consecutive chunks (default 200)
// We split on sentence boundaries when possible so chunks stay readable,
// which keeps citations meaningful.
// ---------------------------------------------------------------------
export interface ChunkSpec {
  text: string;
  index: number;
  page?: number;
}

export function chunkText(
  text: string,
  chunkSize = 1200,
  overlap = 200,
  page?: number
): ChunkSpec[] {
  if (!text || !text.trim()) return [];
  const clean = text.replace(/\r/g, "").trim();
  // Split into sentences on . ! ? followed by whitespace. Cheap & robust.
  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks: ChunkSpec[] = [];
  let buffer = "";
  let index = 0;
  for (const s of sentences) {
    if ((buffer + " " + s).trim().length > chunkSize && buffer.length > 0) {
      chunks.push({ text: buffer.trim(), index, page });
      index++;
      // Overlap: keep the tail of the previous buffer for context continuity.
      buffer = buffer.slice(-overlap) + " " + s;
    } else {
      buffer = (buffer + " " + s).trim();
    }
  }
  if (buffer.trim()) chunks.push({ text: buffer.trim(), index, page });
  return chunks;
}

// Serialize/deserialize sparse vectors for DB storage.
export function serialize(v: SparseVector): string {
  return JSON.stringify(v);
}
export function deserialize(s: string): SparseVector {
  try {
    const p = JSON.parse(s) as SparseVector;
    return { tf: p.tf ?? {}, len: p.len ?? 0 };
  } catch {
    return { tf: {}, len: 0 };
  }
}
