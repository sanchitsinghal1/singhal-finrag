// POST /api/analysis/compare  -> side-by-side snapshot comparison
//        body: { companyIds: string[] }  (max 5)
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getSnapshot } from "@/lib/market-data";

export const POST = asyncHandler(async (req: Request) => {
  const { companyIds } = await req.json().catch(() => ({}));
  if (!Array.isArray(companyIds) || companyIds.length === 0)
    throw ApiError.badRequest("companyIds[] is required");
  const ids = companyIds.slice(0, 5).map(String);

  const companies = await db.company.findMany({ where: { id: { in: ids } } });
  if (companies.length === 0) throw ApiError.notFound("No matching companies");

  const rows = await Promise.all(
    companies.map(async (c) => {
      const snap = await getSnapshot(c.id).catch(() => null);
      return {
        company: { id: c.id, symbol: c.symbol, name: c.name, sector: c.sector, industry: c.industry, exchange: c.exchange },
        snapshot: snap
          ? {
              price: snap.price,
              changePercent: snap.changePercent,
              currency: snap.currency,
              marketCap: snap.marketCap,
              peRatio: snap.peRatio,
              eps: snap.eps,
              week52High: snap.week52High,
              week52Low: snap.week52Low,
              summary: snap.summary,
              source: snap.source,
              fetchedAt: snap.fetchedAt,
              stale: snap.stale ?? false,
            }
          : null,
      };
    })
  );

  return jsonOk({ rows });
});
