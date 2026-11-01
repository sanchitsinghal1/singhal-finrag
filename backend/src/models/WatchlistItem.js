import mongoose from "mongoose";

const watchlistItemSchema = new mongoose.Schema({
  watchlistId: { type: mongoose.Schema.Types.ObjectId, ref: "Watchlist", required: true, index: true },
  companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  note:        { type: String },
  targetPrice: { type: Number },
  addedAt:     { type: Date, default: Date.now },
});
// Unique constraint — prevents adding the same company twice to one list.
watchlistItemSchema.index({ watchlistId: 1, companyId: 1 }, { unique: true });

export const WatchlistItem = mongoose.model("WatchlistItem", watchlistItemSchema);
