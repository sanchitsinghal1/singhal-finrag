// POST   /api/watchlists/[id]/items   -> add a company to a watchlist
//        body: { companyId, note?, targetPrice? }
// GET    /api/watchlists/[id]/items   -> list items (with latest snapshot each)
// DELETE /api/watchlists/[id]/items?itemId=...  -> remove an item
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/market-data";

export const GET = asyncHandler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const wl = await db.watchlist.findUnique({
      where: { id },
      include: { items: { include: { company: true } } },
    });
    if (!wl || wl.ownerId !== user.id) throw ApiError.notFound("Watchlist not found");

    // Attach the latest snapshot per company (stale-cache aware, best-effort).
    const items = await Promise.all(
      wl.items.map(async (it) => {
        const snap = await getSnapshot(it.company.id).catch(() => null);
        return {
          id: it.id,
          note: it.note,
          targetPrice: it.targetPrice,
          addedAt: it.addedAt,
          company: { id: it.company.id, symbol: it.company.symbol, name: it.company.name, sector: it.company.sector },
          snapshot: snap
            ? {
                price: snap.price,
                changePercent: snap.changePercent,
                currency: snap.currency,
                week52High: snap.week52High,
                week52Low: snap.week52Low,
                fetchedAt: snap.fetchedAt,
                stale: snap.stale ?? false,
              }
            : null,
        };
      })
    );
    return jsonOk({ items });
  }
);

export const POST = asyncHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const wl = await db.watchlist.findUnique({ where: { id } });
    if (!wl || wl.ownerId !== user.id) throw ApiError.notFound("Watchlist not found");

    const { companyId, note, targetPrice } = await req.json().catch(() => ({}));
    if (!companyId) throw ApiError.badRequest("companyId is required");
    const company = await db.company.findUnique({ where: { id: String(companyId) } });
    if (!company) throw ApiError.badRequest("Company not found");

    const item = await db.watchlistItem.create({
      data: {
        watchlistId: id,
        companyId: company.id,
        note: note ? String(note) : null,
        targetPrice: typeof targetPrice === "number" ? targetPrice : null,
      },
    });
    return jsonOk({ id: item.id, companyId: company.id }, "Added to watchlist");
  }
);

export const DELETE = asyncHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const itemId = url.searchParams.get("itemId");
    if (!itemId) throw ApiError.badRequest("itemId query param is required");

    const item = await db.watchlistItem.findUnique({ where: { id: itemId }, include: { watchlist: true } });
    if (!item || item.watchlist.ownerId !== user.id) throw ApiError.notFound("Item not found");
    await db.watchlistItem.delete({ where: { id: itemId } });
    return jsonOk({ id: itemId }, "Removed from watchlist");
  }
);
