import mongoose from "mongoose";

const historicalPriceSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  date:      { type: Date, required: true },
  open:      { type: Number },
  high:      { type: Number },
  low:       { type: Number },
  close:     { type: Number },
  volume:    { type: Number },
  period:    { type: String },
});
historicalPriceSchema.index({ companyId: 1, date: 1 });

export const HistoricalPrice = mongoose.model("HistoricalPrice", historicalPriceSchema);
