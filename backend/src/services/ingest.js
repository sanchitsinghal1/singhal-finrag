// Document ingestion service — extract -> clean -> dedup -> chunk -> embed -> persist.
// Ported from src/lib/ingest.ts. Prisma -> Mongoose. Same logic + guards.
import { createHash } from "node:crypto";
import path from "node:path";
import { FinancialDocument } from "../models/FinancialDocument.js";
import { DocumentChunk } from "../models/DocumentChunk.js";
import { buildTfVector, chunkText, serialize } from "./embedding.js";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/octet-stream",
]);

async function extractText(buffer, mime, filename) {
  const ext = path.extname(filename).toLowerCase();
  if (mime === "application/pdf" || ext === ".pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return { text: data.text ?? "", pages: data.numpages };
  }
  return { text: buffer.toString("utf-8"), pages: 1 };
}

function cleanText(s) {
  return s
    .replace(/\u0000/g, "")
    .replace(/\f/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function hashText(s) {
  return createHash("sha256").update(s).digest("hex");
}

export async function ingestDocument(input) {
  const { userId, companyId, filename, mimeType, buffer } = input;

  if (buffer.byteLength > MAX_BYTES) {
    return fail(userId, companyId, filename, mimeType, buffer.byteLength, "File exceeds the 10 MB upload limit.");
  }
  if (!ALLOWED.has(mimeType) && !/\.(pdf|txt|md)$/i.test(filename)) {
    return fail(userId, companyId, filename, mimeType, buffer.byteLength, "Unsupported file type. Allowed: PDF, TXT, MD.");
  }

  const doc = await FinancialDocument.create({
    ownerId: userId,
    companyId: companyId ?? null,
    originalName: filename,
    mimeType,
    size: buffer.byteLength,
    status: "processing",
  });

  try {
    const { text: rawText, pages } = await extractText(buffer, mimeType, filename);
    const text = cleanText(rawText);

    if (!text || text.length < 40) {
      await markFailed(doc._id, "No extractable text found. If this is a scanned PDF, OCR is not supported.");
      return {
        documentId: doc._id,
        status: "failed",
        chunkCount: 0,
        charCount: text.length,
        message: "No extractable text found. Scanned PDFs require OCR, which is not enabled.",
      };
    }

    const textHash = hashText(text);
    const existing = await FinancialDocument.findOne({ ownerId: userId, textHash, status: "ready" });
    if (existing) {
      await FinancialDocument.deleteOne({ _id: doc._id });
      return {
        documentId: existing._id,
        status: "ready",
        chunkCount: 0,
        charCount: 0,
        duplicateOf: existing._id,
        message: "This document's text is identical to a previously uploaded file. Duplicate not re-indexed.",
      };
    }

    const specs = chunkText(text, 1200, 200, pages ?? undefined);

    for (const spec of specs) {
      const vec = buildTfVector(spec.text);
      const tokenCount = vec.len;
      await DocumentChunk.create({
        documentId: doc._id,
        chunkIndex: spec.index,
        text: spec.text,
        charCount: spec.text.length,
        tokenCount,
        page: spec.page,
        embedding: serialize(vec),
      });
    }

    await FinancialDocument.updateOne(
      { _id: doc._id },
      {
        status: "ready",
        textHash,
        totalPages: pages ?? null,
        chunkCount: specs.length,
        charCount: text.length,
        processedAt: new Date(),
      }
    );

    return {
      documentId: doc._id,
      status: "ready",
      chunkCount: specs.length,
      charCount: text.length,
      message: `Indexed ${specs.length} chunks.`,
    };
  } catch (err) {
    const message = err.message || "Unknown processing error.";
    await markFailed(doc._id, message);
    return { documentId: doc._id, status: "failed", chunkCount: 0, charCount: 0, message };
  }
}

async function markFailed(documentId, message) {
  await FinancialDocument.updateOne(
    { _id: documentId },
    { status: "failed", errorMessage: message, processedAt: new Date() }
  );
}

async function fail(userId, companyId, filename, mimeType, size, message) {
  await FinancialDocument.create({
    ownerId: userId,
    companyId: companyId ?? null,
    originalName: filename,
    mimeType,
    size,
    status: "failed",
    errorMessage: message,
    processedAt: new Date(),
  });
  return { documentId: "", status: "failed", chunkCount: 0, charCount: 0, message };
}
