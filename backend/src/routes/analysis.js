// Analysis routes — compare + grounded brief generation.
import { Router } from "express";
import { Company } from "../models/Company.js";
import { FinancialDocument } from "../models/FinancialDocument.js";
import { requireUser } from "../middleware/auth.js";
import { getSnapshot } from "../services/market-data.js";
import { getZai } from "../services/zai.js";
import { asyncHandler, jsonOk, ApiError } from "../utils/api-response.js";
import mongoose from "mongoose";

const router = Router();
const KINDS = new Set(["bull_bear", "swot", "summary"]);

// POST /api/analysis/compare  body: { companyIds: string[] } (max 5)
router.post("/compare", requireUser, asyncHandler(async (req, res) => {
  const { companyIds } = req.body ?? {};
  if (!Array.isArray(companyIds) || companyIds.length === 0)
    throw ApiError.badRequest("companyIds[] is required");
  const ids = companyIds.slice(0, 5).map(String).filter((s) => mongoose.isValidObjectId(s));
  const companies = await Company.find({ _id: { $in: ids } }).lean();
  if (companies.length === 0) throw ApiError.notFound("No matching companies");

  const rows = [];
  for (const c of companies) {
    const snap = await getSnapshot(c._id).catch(() => null);
    rows.push({
      company: { id: String(c._id), symbol: c.symbol, name: c.name, sector: c.sector, industry: c.industry, exchange: c.exchange },
      snapshot: snap ? {
        price: snap.price, changePercent: snap.changePercent, currency: snap.currency,
        marketCap: snap.marketCap, peRatio: snap.peRatio, eps: snap.eps,
        week52High: snap.week52High, week52Low: snap.week52Low, summary: snap.summary,
        source: snap.source, fetchedAt: snap.fetchedAt, stale: snap.stale ?? false,
      } : null,
    });
  }
  jsonOk(res, { rows });
}));

// POST /api/analysis/generate  body: { kind, companyId }
router.post("/generate", requireUser, asyncHandler(async (req, res) => {
  const { kind, companyId } = req.body ?? {};
  if (!KINDS.has(String(kind))) throw ApiError.badRequest("kind must be bull_bear | swot | summary");
  if (!companyId || !mongoose.isValidObjectId(companyId)) throw ApiError.badRequest("companyId is required");

  const company = await Company.findById(companyId).lean();
  if (!company) throw ApiError.notFound("Company not found");

  const snapshot = await getSnapshot(company._id).catch(() => null);
  const docs = await FinancialDocument.find({ ownerId: req.user._id, companyId: company._id, status: "ready" })
    .select("originalName charCount").limit(5).lean();

  const marketBlock = snapshot
    ? `MARKET SNAPSHOT (${company.symbol})\n` +
      `Name: ${company.name} | Sector: ${company.sector ?? "n/a"}\n` +
      `Price: ${snapshot.price ?? "n/a"} ${snapshot.currency ?? ""} | 1d change: ${snapshot.changePercent ?? "n/a"}%\n` +
      `Market cap: ${snapshot.marketCap ?? "n/a"} | P/E: ${snapshot.peRatio ?? "n/a"} | EPS: ${snapshot.eps ?? "n/a"}\n` +
      `52w range: ${snapshot.week52Low ?? "n/a"} - ${snapshot.week52High ?? "n/a"}\n` +
      `Summary (web-sourced): ${snapshot.summary ?? "n/a"}\n` +
      `Source: ${snapshot.source} @ ${snapshot.fetchedAt.toISOString()}`
    : "(No market snapshot available.)";

  const docBlock = docs.length
    ? `AVAILABLE USER DOCUMENTS (not inlined; the user can ask the Research chat for details):\n` +
      docs.map((d, i) => `[${i + 1}] ${d.originalName} (${d.charCount.toLocaleString()} chars)`).join("\n")
    : "(User has not uploaded any documents for this company.)";

  const briefByKind = {
    bull_bear: `Produce a concise Bull case vs Bear case brief for ${company.name}. Use a "Bull Case" and a "Bear Case" section, each with 3-5 bullet points. End with a one-line "Neutral observation". Only base points on the snapshot figures and document availability above.`,
    swot: `Produce a SWOT analysis for ${company.name}. Use sections Strengths, Weaknesses, Opportunities, Threats — each with 3-5 bullets. Only base points on the snapshot figures and document availability above.`,
    summary: `Produce a one-page equity research summary for ${company.name} covering: Business overview, Key financials, Recent observations, Risks, and Outlook. Only base claims on the snapshot figures above.`,
  };

  const messages = [
    { role: "assistant", content:
      `You are an equity research analyst. Write ONLY from the provided context.\n` +
      `If a figure is missing, say "n/a" — do NOT invent numbers, ratios or news.\n` +
      `Mark each major claim with its evidence type in square brackets: [market data] or [user documents] or [analyst interpretation].\n\n` +
      `${marketBlock}\n\n${docBlock}` },
    { role: "user", content: briefByKind[kind] },
  ];

  const zai = await getZai();
  const completion = await zai.chat.completions.create({ messages, thinking: { type: "disabled" } });
  const text = completion.choices?.[0]?.message?.content?.trim() || "The AI service returned no content.";

  jsonOk(res, {
    kind, companyId: String(company._id), symbol: company.symbol, content: text,
    groundedOn: {
      market: !!snapshot,
      documents: docs.length,
      documentNames: docs.map((d) => d.originalName),
      snapshotFetchedAt: snapshot?.fetchedAt ?? null,
    },
  });
}));

export default router;
