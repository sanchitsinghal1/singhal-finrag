import mongoose from "mongoose";

const stockSnapshotSchema = new mongoose.Schema({
  companyId:     { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  source:        { type: String, default: "web_search" },
  price:         { type: Number },
  change:        { type: Number },
  changePercent: { type: Number },
  currency:      { type: String },
  marketCap:     { type: Number },
  peRatio:       { type: Number },
  eps:           { type: Number },
  revenue:       { type: Number },
  profitMargin:  { type: Number },
  week52High:    { type: Number },
  week52Low:     { type: Number },
  volume:        { type: Number },
  dividendYield: { type: Number },
  summary:       { type: String },
  rawJson:       { type: String },
  fetchedAt:     { type: Date, default: Date.now },
});

export const StockSnapshot = mongoose.model("StockSnapshot", stockSnapshotSchema);
