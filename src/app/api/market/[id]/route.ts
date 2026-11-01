// GET /api/market/[id]?force=1 -> fetch/refresh the latest market snapshot
//   for a company (id accepts DB id or symbol). Returns the snapshot plus
//   an illustrative price series for the chart (clearly labelled as
//   illustrative when no real OHLC feed is configured).
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getSnapshot, illustrativeSeries } from "@/lib/market-data";

export const GET = asyncHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    const company =
      (await db.company.findUnique({ where: { id } })) ??
      (await db.company.findUnique({ where: { symbol: id.toUpperCase() } }));
    if (!company) throw ApiError.notFound("Company not found");

    const snapshot = await getSnapshot(company.id, { force });
    const series = illustrativeSeries(snapshot.price);

    return jsonOk({
      company: { id: company.id, symbol: company.symbol, name: company.name },
      snapshot: {
        price: snapshot.price,
        changePercent: snapshot.changePercent,
        currency: snapshot.currency,
        marketCap: snapshot.marketCap,
        peRatio: snapshot.peRatio,
        eps: snapshot.eps,
        week52High: snapshot.week52High,
        week52Low: snapshot.week52Low,
        summary: snapshot.summary,
        source: snapshot.source,
        fetchedAt: snapshot.fetchedAt,
        stale: snapshot.stale ?? false,
      },
      series, // illustrative price series — UI labels it clearly
    });
  }
);
