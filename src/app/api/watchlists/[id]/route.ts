// PATCH  /api/watchlists/[id]  -> rename a watchlist  body: { name?, description? }
// DELETE /api/watchlists/[id]  -> delete a watchlist (cascades items)
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const PATCH = asyncHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const wl = await db.watchlist.findUnique({ where: { id } });
    if (!wl || wl.ownerId !== user.id) throw ApiError.notFound("Watchlist not found");
    const { name, description } = await req.json().catch(() => ({}));
    const data: { name?: string; description?: string | null } = {};
    if (typeof name === "string") data.name = name.slice(0, 200);
    if (description !== undefined) data.description = description ? String(description) : null;
    const updated = await db.watchlist.update({ where: { id }, data });
    return jsonOk({ id: updated.id }, "Watchlist updated");
  }
);

export const DELETE = asyncHandler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const wl = await db.watchlist.findUnique({ where: { id } });
    if (!wl || wl.ownerId !== user.id) throw ApiError.notFound("Watchlist not found");
    await db.watchlist.delete({ where: { id } });
    return jsonOk({ id }, "Watchlist deleted");
  }
);
