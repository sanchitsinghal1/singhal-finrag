// =====================================================================
// Document ingestion service.
// ---------------------------------------------------------------------
// Flow:  raw upload -> text extraction (pdf-parse / plain text)
//      -> cleaning -> chunking (size + overlap) -> embed each chunk
//      -> persist chunks with embeddings -> mark document READY.
//
// Duplicate detection: we sha256 the extracted text and store it on the
// FinancialDocument. If a user uploads the same text again we reject it
// with a 409 instead of re-indexing.
// =====================================================================

import { createHash } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { db } from "@/lib/db";
import {
  buildTfVector,
  chunkText,
  serialize,
} from "@/lib/embedding";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB upload limit
const ALLOWED = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/octet-stream", // sometimes returned for .txt
]);

export interface IngestInput {
  userId: string;
  companyId?: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface IngestResult {
  documentId: string;
  status: "ready" | "failed";
  chunkCount: number;
  charCount: number;
  duplicateOf?: string;
  message: string;
}

// ---------------------------------------------------------------------
// Text extraction. PDFs via pdf-parse; .txt/.md read directly. Scanned
// PDFs (image-only) will yield little/no text — we report that honestly
// instead of pretending OCR happened.
// ---------------------------------------------------------------------
async function extractText(buffer: Buffer, mime: string, filename: string): Promise<{ text: string; pages?: number }> {
  const ext = path.extname(filename).toLowerCase();
  if (mime === "application/pdf" || ext === ".pdf") {
    // dynamic import keeps pdf-parse out of cold-start for non-PDF uploads
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return { text: data.text ?? "", pages: data.numpages };
  }
  // plain text
  return { text: buffer.toString("utf-8"), pages: 1 };
}

// Lightweight cleaning: collapse runs of whitespace, strip form-feed chars
// that pdf-parse sometimes leaves, normalise line breaks.
function cleanText(s: string): string {
  return s
    .replace(/\u0000/g, "")
    .replace(/\f/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

// sha256 of cleaned text — used for duplicate detection.
function hashText(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function ingestDocument(input: IngestInput): Promise<IngestResult> {
  const { userId, companyId, filename, mimeType, buffer } = input;

  // 1) size + type validation
  if (buffer.byteLength > MAX_BYTES) {
    return fail(userId, companyId, filename, mimeType, buffer.byteLength, "File exceeds the 10 MB upload limit.");
  }
  if (!ALLOWED.has(mimeType) && !/\.(pdf|txt|md)$/i.test(filename)) {
    return fail(userId, companyId, filename, mimeType, buffer.byteLength, "Unsupported file type. Allowed: PDF, TXT, MD.");
  }

  // Create a PENDING record up-front so progress is visible.
  const doc = await db.financialDocument.create({
    data: {
      ownerId: userId,
      companyId: companyId ?? null,
      originalName: filename,
      mimeType,
      size: buffer.byteLength,
      status: "processing",
    },
  });

  try {
    // 2) extract text
    const { text: rawText, pages } = await extractText(buffer, mimeType, filename);
    const text = cleanText(rawText);

    if (!text || text.length < 40) {
      await markFailed(doc.id, "No extractable text found. If this is a scanned PDF, OCR is not supported.");
      return {
        documentId: doc.id,
        status: "failed",
        chunkCount: 0,
        charCount: text.length,
        message: "No extractable text found. Scanned PDFs require OCR, which is not enabled.",
      };
    }

    // 3) duplicate detection by content hash
    const textHash = hashText(text);
    const existing = await db.financialDocument.findFirst({
      where: { ownerId: userId, textHash, status: "ready" },
      select: { id: true },
    });
    if (existing) {
      // delete the pending placeholder — we won't keep a duplicate
      await db.financialDocument.delete({ where: { id: doc.id } });
      return {
        documentId: existing.id,
        status: "ready",
        chunkCount: 0,
        charCount: 0,
        duplicateOf: existing.id,
        message: "This document's text is identical to a previously uploaded file. Duplicate not re-indexed.",
      };
    }

    // 4) chunk (configurable size/overlap — see embedding.chunkText)
    const specs = chunkText(text, 1200, 200, pages ?? undefined);

    // 5) embed each chunk (TF-IDF sparse vector) + persist
    // We create chunks in batches to avoid one giant transaction.
    for (const spec of specs) {
      const vec = buildTfVector(spec.text);
      const tokenCount = vec.len;
      await db.documentChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: spec.index,
          text: spec.text,
          charCount: spec.text.length,
          tokenCount,
          page: spec.page,
          embedding: serialize(vec),
        },
      });
    }

    // 6) mark READY
    await db.financialDocument.update({
      where: { id: doc.id },
      data: {
        status: "ready",
        textHash,
        totalPages: pages ?? null,
        chunkCount: specs.length,
        charCount: text.length,
        processedAt: new Date(),
      },
    });

    return {
      documentId: doc.id,
      status: "ready",
      chunkCount: specs.length,
      charCount: text.length,
      message: `Indexed ${specs.length} chunks.`,
    };
  } catch (err) {
    const message = (err as Error).message || "Unknown processing error.";
    await markFailed(doc.id, message);
    return { documentId: doc.id, status: "failed", chunkCount: 0, charCount: 0, message };
  }
}

async function markFailed(documentId: string, message: string) {
  await db.financialDocument.update({
    where: { id: documentId },
    data: { status: "failed", errorMessage: message, processedAt: new Date() },
  });
}

// When validation fails before we even create a doc, still record the attempt
// for auditing/UX (so users see the rejection in their library).
async function fail(
  userId: string,
  companyId: string | undefined,
  filename: string,
  mimeType: string,
  size: number,
  message: string
): Promise<IngestResult> {
  await db.financialDocument.create({
    data: {
      ownerId: userId,
      companyId: companyId ?? null,
      originalName: filename,
      mimeType,
      size,
      status: "failed",
      errorMessage: message,
      processedAt: new Date(),
    },
  });
  return { documentId: "", status: "failed", chunkCount: 0, charCount: 0, message };
}
