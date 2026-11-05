// GET  /api/companies/[id]   -> company detail + latest snapshot.
//        The :id segment accepts either a DB id OR a symbol (resolved either way).
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getSnapshot } from "@/lib/market-data";

export const GET = asyncHandler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    // Resolve either a DB id or a symbol so the UI can link by symbol.
    const company =
      (await db.company.findUnique({ where: { id } })) ??
      (await db.company.findUnique({ where: { symbol: id.toUpperCase() } }));
    if (!company) throw ApiError.notFound("Company not found");

    // Latest snapshot (stale-cache aware; never throws to the client).
    const snapshot = await getSnapshot(company.id).catch(() => null);

    return jsonOk({
      company: {
        id: company.id,
        symbol: company.symbol,
        name: company.name,
        exchange: company.exchange,
        sector: company.sector,
        industry: company.industry,
        description: company.description,
      },
      snapshot: snapshot
        ? {
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
          }
        : null,
    });
  }
);
