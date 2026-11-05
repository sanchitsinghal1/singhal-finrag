// Market routes — snapshot (force refresh) + real price history.
import { Router } from "express";
import { Company } from "../models/Company.js";
import { getSnapshot, getSnapshotHistory } from "../services/market-data.js";
import { asyncHandler, jsonOk, ApiError } from "../utils/api-response.js";
import mongoose from "mongoose";

const router = Router();
const isObjectId = (s) => mongoose.isValidObjectId(s);

// GET /api/market/:id?force=1
router.get("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const force = req.query.force === "1";
  const company = isObjectId(id)
    ? await Company.findById(id).lean()
    : await Company.findOne({ symbol: id.toUpperCase() }).lean();
  if (!company) throw ApiError.notFound("Company not found");

  const snapshot = await getSnapshot(company._id, { force });
  const history = await getSnapshotHistory(company._id);

  jsonOk(res, {
    company: { id: String(company._id), symbol: company.symbol, name: company.name },
    snapshot: {
      price: snapshot.price, changePercent: snapshot.changePercent, currency: snapshot.currency,
      marketCap: snapshot.marketCap, peRatio: snapshot.peRatio, eps: snapshot.eps,
      week52High: snapshot.week52High, week52Low: snapshot.week52Low, summary: snapshot.summary,
      source: snapshot.source, fetchedAt: snapshot.fetchedAt, stale: snapshot.stale ?? false,
    },
    history,
  });
}));

export default router;
