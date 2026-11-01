// Companies routes — list/create + detail (by id OR symbol).
import { Router } from "express";
import { Company } from "../models/Company.js";
import { StockSnapshot } from "../models/StockSnapshot.js";
import { seedCompanies, SEED_COMPANIES, findOrCreateCompany, getSnapshot } from "../services/market-data.js";
import { asyncHandler, jsonOk, ApiError } from "../utils/api-response.js";
import { requireUser } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = Router();

const isObjectId = (s) => mongoose.isValidObjectId(s);

// GET /api/companies?q=&seed=1
router.get("/", asyncHandler(async (req, res) => {
  const q = (req.query.q ?? "").trim();
  if (req.query.seed === "1" || (await Company.countDocuments()) === 0) {
    await seedCompanies();
  }
  let filter = {};
  if (q) {
    filter = {
      $or: [
        { symbol: { $regex: q.toUpperCase(), $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    };
  }
  const companies = await Company.find(filter).sort({ symbol: 1 }).limit(100).lean();
  // Attach latest snapshot per company (single query, group in JS).
  const ids = companies.map((c) => c._id);
  const snaps = await StockSnapshot.find({ companyId: { $in: ids } })
    .sort({ fetchedAt: -1 }).lean();
  const snapByCompany = {};
  for (const s of snaps) {
    const key = String(s.companyId);
    if (!snapByCompany[key]) snapByCompany[key] = { price: s.price, changePercent: s.changePercent, fetchedAt: s.fetchedAt };
  }
  const out = companies.map((c) => ({
    ...c,
    id: String(c._id),
    snapshots: snapByCompany[String(c._id)] ? [snapByCompany[String(c._id)]] : [],
  }));
  jsonOk(res, { companies: out, knownSymbols: SEED_COMPANIES.map((c) => c.symbol) });
}));

// POST /api/companies  body: { symbol, name? }
router.post("/", requireUser, asyncHandler(async (req, res) => {
  const { symbol, name } = req.body ?? {};
  if (!symbol) throw ApiError.badRequest("symbol is required");
  const company = await findOrCreateCompany(String(symbol), name ? String(name) : undefined);
  jsonOk(res, { id: String(company._id), symbol: company.symbol, name: company.name }, "Company ready");
}));

// GET /api/companies/:id  (id OR symbol)
router.get("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const company = isObjectId(id)
    ? await Company.findById(id).lean()
    : await Company.findOne({ symbol: id.toUpperCase() }).lean();
  if (!company) throw ApiError.notFound("Company not found");

  const snapshot = await getSnapshot(company._id).catch(() => null);
  jsonOk(res, {
    company: {
      id: String(company._id),
      symbol: company.symbol,
      name: company.name,
      exchange: company.exchange,
      sector: company.sector,
      industry: company.industry,
      description: company.description,
    },
    snapshot: snapshot ? {
      price: snapshot.price, changePercent: snapshot.changePercent, currency: snapshot.currency,
      marketCap: snapshot.marketCap, peRatio: snapshot.peRatio, eps: snapshot.eps,
      week52High: snapshot.week52High, week52Low: snapshot.week52Low, summary: snapshot.summary,
      source: snapshot.source, fetchedAt: snapshot.fetchedAt, stale: snapshot.stale ?? false,
    } : null,
  });
}));

export default router;
