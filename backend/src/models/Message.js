import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  role:           { type: String, required: true, enum: ["user", "assistant"] },
  content:        { type: String, required: true },
  // JSON array of citations: [{ documentId, documentName, chunkIndex, page, snippet, score }]
  citations:      { type: String },
  evidenceType:   { type: String, default: "none" }, // documents | market_data | both | none
  createdAt:      { type: Date, default: Date.now },
});

export const Message = mongoose.model("Message", messageSchema);
