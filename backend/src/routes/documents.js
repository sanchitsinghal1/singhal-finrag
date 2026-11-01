// Documents routes — list, upload (multipart), detail, delete.
import { Router } from "express";
import multer from "multer";
import { FinancialDocument } from "../models/FinancialDocument.js";
import { DocumentChunk } from "../models/DocumentChunk.js";
import { requireUser } from "../middleware/auth.js";
import { ingestDocument } from "../services/ingest.js";
import { asyncHandler, jsonOk, ApiError } from "../utils/api-response.js";
import mongoose from "mongoose";

const router = Router();
const isObjectId = (s) => mongoose.isValidObjectId(s);

// memory storage — we keep the file in memory only long enough to process.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/documents?limit=&offset=&companyId=&status=
router.get("/", requireUser, asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit ?? 50));
  const offset = Math.max(0, Number(req.query.offset ?? 0));
  const filter = { ownerId: req.user._id };
  if (req.query.companyId) filter.companyId = req.query.companyId;
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    FinancialDocument.find(filter).sort({ uploadedAt: -1 }).skip(offset).limit(limit)
      .populate({ path: "companyId", select: "_id symbol name" }).lean(),
    FinancialDocument.countDocuments(filter),
  ]);
  // Mongoose populates onto the field name `companyId`; expose as `.company` for response mapping.
  items.forEach((d) => { d.company = d.companyId; });
  jsonOk(res, {
    items: items.map((d) => ({ ...d, id: String(d._id), ownerId: String(d.ownerId),
      company: d.company ? { id: String(d.company._id), symbol: d.company.symbol, name: d.company.name } : null })),
    total, limit, offset,
  });
}));

// POST /api/documents  (multipart: file, companyId?)
router.post("/", requireUser, upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded (field 'file' required).");
  const companyId = req.body.companyId ? new mongoose.Types.ObjectId(req.body.companyId) : undefined;
  const buf = req.file.buffer;
  const result = await ingestDocument({
    userId: req.user._id,
    companyId,
    filename: req.file.originalname,
    mimeType: req.file.mimetype || "application/octet-stream",
    buffer: buf,
  });
  const status = result.status === "failed" ? 400 : 200;
  jsonOk(res, result, result.message, status);
}));

// GET /api/documents/:id?chunkLimit=&chunkOffset=
router.get("/:id", requireUser, asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) throw ApiError.notFound("Document not found");
  const chunkLimit = Math.min(50, Number(req.query.chunkLimit ?? 20));
  const chunkOffset = Math.max(0, Number(req.query.chunkOffset ?? 0));

  const doc = await FinancialDocument.findById(id).populate({ path: "companyId", select: "_id symbol name" }).lean();
  if (!doc || String(doc.ownerId) !== String(req.user._id)) throw ApiError.notFound("Document not found");
  if (doc.companyId) doc.company = doc.companyId;

  const [chunks, chunkTotal] = await Promise.all([
    DocumentChunk.find({ documentId: id }).sort({ chunkIndex: 1 }).skip(chunkOffset).limit(chunkLimit)
      .select("_id chunkIndex page text tokenCount charCount").lean(),
    DocumentChunk.countDocuments({ documentId: id }),
  ]);

  jsonOk(res, {
    document: {
      ...doc, id: String(doc._id), ownerId: String(doc.ownerId),
      company: doc.company ? { id: String(doc.company._id), symbol: doc.company.symbol, name: doc.company.name } : null,
    },
    chunks: chunks.map((c) => ({ ...c, id: String(c._id) })),
    chunkTotal, chunkLimit, chunkOffset,
  });
}));

// DELETE /api/documents/:id
router.delete("/:id", requireUser, asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) throw ApiError.notFound("Document not found");
  const doc = await FinancialDocument.findById(id);
  if (!doc || String(doc.ownerId) !== String(req.user._id)) throw ApiError.notFound("Document not found");
  // Cascade delete chunks (model middleware handles it, but be explicit).
  await DocumentChunk.deleteMany({ documentId: doc._id });
  await FinancialDocument.deleteOne({ _id: doc._id });
  jsonOk(res, { id: String(doc._id) }, "Document deleted");
}));

export default router;
