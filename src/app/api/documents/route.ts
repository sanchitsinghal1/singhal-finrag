// GET  /api/documents        -> list the current user's documents (paginated)
// POST /api/documents        -> upload a document (multipart/form-data)
//
// Upload flow:
//   1. requireUser() — auth gate
//   2. parse multipart, validate size + mime
//   3. ingestDocument() -> extract -> chunk -> embed -> persist
//   4. return the resulting document + chunk count
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ingestDocument } from "@/lib/ingest";

export const GET = asyncHandler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const limit = Math.min(50, Number(url.searchParams.get("limit") ?? 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
  const companyId = url.searchParams.get("companyId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;

  const [items, total] = await Promise.all([
    db.financialDocument.findMany({
      where: {
        ownerId: user.id,
        ...(companyId ? { companyId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { uploadedAt: "desc" },
      take: limit,
      skip: offset,
      include: { company: { select: { id: true, symbol: true, name: true } } },
    }),
    db.financialDocument.count({
      where: {
        ownerId: user.id,
        ...(companyId ? { companyId } : {}),
        ...(status ? { status } : {}),
      },
    }),
  ]);

  return jsonOk({ items, total, limit, offset });
});

export const POST = asyncHandler(async (req: Request) => {
  const user = await requireUser();
  const form = await req.formData();
  const file = form.get("file");
  const companyId = (form.get("companyId") as string | null) ?? undefined;

  if (!(file instanceof File)) throw ApiError.badRequest("No file uploaded (field 'file' required).");

  const buf = Buffer.from(await file.arrayBuffer());
  const result = await ingestDocument({
    userId: user.id,
    companyId: companyId || undefined,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    buffer: buf,
  });

  return jsonOk(result, result.message, result.status === "failed" ? { status: 400 } : undefined);
});
