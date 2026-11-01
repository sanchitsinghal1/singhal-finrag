import mongoose from "mongoose";

const financialDocumentSchema = new mongoose.Schema({
  ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  companyId:    { type: mongoose.Schema.Types.ObjectId, ref: "Company", index: true, default: null },
  originalName: { type: String, required: true },
  mimeType:     { type: String, required: true },
  size:         { type: Number, required: true },
  // Status machine: pending -> processing -> ready | failed
  status:       { type: String, default: "pending", enum: ["pending", "processing", "ready", "failed"], index: true },
  textHash:     { type: String },   // sha256 of cleaned text -> duplicate detection
  totalPages:   { type: Number },
  chunkCount:   { type: Number, default: 0 },
  charCount:    { type: Number, default: 0 },
  errorMessage: { type: String },
  uploadedAt:   { type: Date, default: Date.now },
  processedAt:  { type: Date },
}, { timestamps: true });

// Cascade: when a document is deleted, delete its chunks.
financialDocumentSchema.pre("findOneAndDelete", async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    const { DocumentChunk } = await import("./DocumentChunk.js");
    await DocumentChunk.deleteMany({ documentId: doc._id });
  }
});
financialDocumentSchema.pre("deleteOne", async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    const { DocumentChunk } = await import("./DocumentChunk.js");
    await DocumentChunk.deleteMany({ documentId: doc._id });
  }
});

export const FinancialDocument = mongoose.model("FinancialDocument", financialDocumentSchema);
