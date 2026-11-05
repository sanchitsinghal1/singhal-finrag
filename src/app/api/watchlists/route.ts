// GET  /api/watchlists  -> list user's watchlists with their companies
// POST /api/watchlists  -> create a watchlist  body: { name, description? }
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const GET = asyncHandler(async () => {
  const user = await requireUser();
  const lists = await db.watchlist.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        include: { company: { select: { id: true, symbol: true, name: true, sector: true } } },
        orderBy: { addedAt: "desc" },
      },
    },
  });
  return jsonOk({ watchlists: lists });
});

export const POST = asyncHandler(async (req: Request) => {
  const user = await requireUser();
  const { name, description } = await req.json().catch(() => ({}));
  if (!name || !String(name).trim()) throw ApiError.badRequest("name is required");
  const wl = await db.watchlist.create({
    data: { ownerId: user.id, name: String(name).trim(), description: description ? String(description) : null },
  });
  return jsonOk({ id: wl.id, name: wl.name }, "Watchlist created");
});
