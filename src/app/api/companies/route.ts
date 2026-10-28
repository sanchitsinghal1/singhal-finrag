// GET  /api/companies  -> browse the curated directory (optionally filter by q).
//   ?q=QUERY   filter by symbol/name (case-insensitive)
//   ?seed=1    force-seed the directory
// POST /api/companies  -> look up or create a company by symbol (for the ticker search box)
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { seedCompanies, SEED_COMPANIES, findOrCreateCompany } from "@/lib/market-data";

export const GET = asyncHandler(async (req: Request) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (url.searchParams.get("seed") === "1" || (await db.company.count()) === 0) {
    await seedCompanies();
  }

  const where = q
    ? {
        OR: [
          { symbol: { contains: q.toUpperCase() } },
          { name: { contains: q } },
        ],
      }
    : undefined;

  const companies = await db.company.findMany({
    where,
    orderBy: [{ symbol: "asc" }],
    take: 100,
    include: { snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 } },
  });

  // Provide a hint to the UI for which symbols are searchable but not yet seeded.
  const knownSymbols = SEED_COMPANIES.map((c) => c.symbol);
  return jsonOk({ companies, knownSymbols });
});

export const POST = asyncHandler(async (req: Request) => {
  const { symbol, name } = await req.json().catch(() => ({}));
  if (!symbol) throw ApiError.badRequest("symbol is required");
  const company = await findOrCreateCompany(String(symbol), name ? String(name) : undefined);
  return jsonOk(
    { id: company.id, symbol: company.symbol, name: company.name },
    "Company ready"
  );
});
