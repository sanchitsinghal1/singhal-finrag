import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "FinancialDocument", required: true, index: true },
  chunkIndex: { type: Number, required: true },
  text:       { type: String, required: true },
  charCount:  { type: Number },
  tokenCount: { type: Number },
  page:       { type: Number },
  // TF-IDF sparse embedding stored as JSON string (SQLite had no vector type;
  // we keep the same shape for migration compatibility + future Atlas Vector Search).
  embedding:  { type: String, required: true },
  createdAt:  { type: Date, default: Date.now },
});

export const DocumentChunk = mongoose.model("DocumentChunk", documentChunkSchema);
