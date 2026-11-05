import mongoose from "mongoose";

const researchNoteSchema = new mongoose.Schema({
  ownerId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  tags:      { type: String }, // comma-separated
}, { timestamps: true });

export const ResearchNote = mongoose.model("ResearchNote", researchNoteSchema);
