// Watchlists routes — lists, items, with latest snapshot per company.
import { Router } from "express";
import { Watchlist } from "../models/Watchlist.js";
import { WatchlistItem } from "../models/WatchlistItem.js";
import { Company } from "../models/Company.js";
import { requireUser } from "../middleware/auth.js";
import { getSnapshot } from "../services/market-data.js";
import { asyncHandler, jsonOk, ApiError } from "../utils/api-response.js";

const router = Router();

// GET /api/watchlists
router.get("/", requireUser, asyncHandler(async (req, res) => {
  const lists = await Watchlist.find({ ownerId: req.user._id }).sort({ updatedAt: -1 }).lean();
  const out = [];
  for (const l of lists) {
    const items = await WatchlistItem.find({ watchlistId: l._id }).populate("companyId").sort({ addedAt: -1 }).lean();
    out.push({
      ...l, id: String(l._id), ownerId: String(l.ownerId),
      items: items.map((it) => {
        if (it.companyId) it.company = it.companyId;
        return {
          ...it, id: String(it._id), watchlistId: String(it.watchlistId),
          company: it.company ? { id: String(it.company._id), symbol: it.company.symbol, name: it.company.name, sector: it.company.sector } : null,
        };
      }),
    });
  }
  jsonOk(res, { watchlists: out });
}));

// POST /api/watchlists  body: { name, description? }
router.post("/", requireUser, asyncHandler(async (req, res) => {
  const { name, description } = req.body ?? {};
  if (!name || !String(name).trim()) throw ApiError.badRequest("name is required");
  const wl = await Watchlist.create({ ownerId: req.user._id, name: String(name).trim(), description: description ? String(description) : null });
  jsonOk(res, { id: String(wl._id), name: wl.name }, "Watchlist created");
}));

// PATCH /api/watchlists/:id
router.patch("/:id", requireUser, asyncHandler(async (req, res) => {
  const wl = await Watchlist.findById(req.params.id);
  if (!wl || String(wl.ownerId) !== String(req.user._id)) throw ApiError.notFound("Watchlist not found");
  const { name, description } = req.body ?? {};
  const data = {};
  if (typeof name === "string") data.name = name.slice(0, 200);
  if (description !== undefined) data.description = description ? String(description) : null;
  const updated = await Watchlist.findByIdAndUpdate(wl._id, { $set: data }, { new: true });
  jsonOk(res, { id: String(updated._id) }, "Watchlist updated");
}));

// DELETE /api/watchlists/:id
router.delete("/:id", requireUser, asyncHandler(async (req, res) => {
  const wl = await Watchlist.findById(req.params.id);
  if (!wl || String(wl.ownerId) !== String(req.user._id)) throw ApiError.notFound("Watchlist not found");
  await WatchlistItem.deleteMany({ watchlistId: wl._id });
  await Watchlist.deleteOne({ _id: wl._id });
  jsonOk(res, { id: String(wl._id) }, "Watchlist deleted");
}));

// GET /api/watchlists/:id/items  (with latest snapshot per company)
router.get("/:id/items", requireUser, asyncHandler(async (req, res) => {
  const wl = await Watchlist.findById(req.params.id);
  if (!wl || String(wl.ownerId) !== String(req.user._id)) throw ApiError.notFound("Watchlist not found");
  const items = await WatchlistItem.find({ watchlistId: wl._id }).populate("companyId").sort({ addedAt: -1 }).lean();
  const out = [];
  for (const it of items) {
    if (it.companyId) it.company = it.companyId;
    const snap = await getSnapshot(it.company._id).catch(() => null);
    out.push({
      id: String(it._id), note: it.note, targetPrice: it.targetPrice, addedAt: it.addedAt,
      company: it.company ? { id: String(it.company._id), symbol: it.company.symbol, name: it.company.name, sector: it.company.sector } : null,
      snapshot: snap ? {
        price: snap.price, changePercent: snap.changePercent, currency: snap.currency,
        week52High: snap.week52High, week52Low: snap.week52Low, fetchedAt: snap.fetchedAt, stale: snap.stale ?? false,
      } : null,
    });
  }
  jsonOk(res, { items: out });
}));

// POST /api/watchlists/:id/items  body: { companyId, note?, targetPrice? }
router.post("/:id/items", requireUser, asyncHandler(async (req, res) => {
  const wl = await Watchlist.findById(req.params.id);
  if (!wl || String(wl.ownerId) !== String(req.user._id)) throw ApiError.notFound("Watchlist not found");
  const { companyId, note, targetPrice } = req.body ?? {};
  if (!companyId) throw ApiError.badRequest("companyId is required");
  const company = await Company.findById(companyId);
  if (!company) throw ApiError.badRequest("Company not found");
  try {
    const item = await WatchlistItem.create({
      watchlistId: wl._id, companyId: company._id,
      note: note ? String(note) : null,
      targetPrice: typeof targetPrice === "number" ? targetPrice : null,
    });
    jsonOk(res, { id: String(item._id), companyId: String(company._id) }, "Added to watchlist");
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict("This company is already in the watchlist.");
    throw err;
  }
}));

// DELETE /api/watchlists/:id/items?itemId=
router.delete("/:id/items", requireUser, asyncHandler(async (req, res) => {
  const itemId = req.query.itemId;
  if (!itemId) throw ApiError.badRequest("itemId query param is required");
  const item = await WatchlistItem.findById(itemId).populate("watchlistId");
  if (!item || String(item.watchlistId.ownerId) !== String(req.user._id)) throw ApiError.notFound("Item not found");
  await WatchlistItem.deleteOne({ _id: item._id });
  jsonOk(res, { id: String(item._id) }, "Removed from watchlist");
}));

export default router;
