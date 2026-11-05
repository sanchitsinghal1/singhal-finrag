import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema({
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name:        { type: String, required: true },
  description: { type: String },
}, { timestamps: true });

// Cascade: deleting a watchlist deletes its items.
watchlistSchema.pre("findOneAndDelete", async function () {
  const wl = await this.model.findOne(this.getFilter());
  if (wl) {
    const { WatchlistItem } = await import("./WatchlistItem.js");
    await WatchlistItem.deleteMany({ watchlistId: wl._id });
  }
});

export const Watchlist = mongoose.model("Watchlist", watchlistSchema);
