// GET  /api/research-notes  -> list user's notes (optionally ?companyId=)
// POST /api/research-notes  -> create a note  body: { title, content, companyId?, tags? }
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const GET = asyncHandler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId") ?? undefined;
  const notes = await db.researchNote.findMany({
    where: { ownerId: user.id, ...(companyId ? { companyId } : {}) },
    orderBy: { updatedAt: "desc" },
    include: { company: { select: { id: true, symbol: true, name: true } } },
  });
  return jsonOk({ notes });
});

export const POST = asyncHandler(async (req: Request) => {
  const user = await requireUser();
  const { title, content, companyId, tags } = await req.json().catch(() => ({}));
  if (!title || !content) throw ApiError.badRequest("title and content are required");
  const note = await db.researchNote.create({
    data: {
      ownerId: user.id,
      title: String(title).slice(0, 300),
      content: String(content),
      companyId: companyId ? String(companyId) : null,
      tags: tags ? String(tags) : null,
    },
  });
  return jsonOk({ id: note.id }, "Note saved");
});
