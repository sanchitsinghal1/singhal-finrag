// PATCH  /api/research-notes/[id]  -> update a note  body: { title?, content?, tags? }
// DELETE /api/research-notes/[id]  -> delete a note
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const PATCH = asyncHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const note = await db.researchNote.findUnique({ where: { id } });
    if (!note || note.ownerId !== user.id) throw ApiError.notFound("Note not found");
    const { title, content, tags } = await req.json().catch(() => ({}));
    const data: { title?: string; content?: string; tags?: string | null } = {};
    if (typeof title === "string") data.title = title.slice(0, 300);
    if (typeof content === "string") data.content = content;
    if (tags !== undefined) data.tags = tags ? String(tags) : null;
    const updated = await db.researchNote.update({ where: { id }, data });
    return jsonOk({ id: updated.id }, "Note updated");
  }
);

export const DELETE = asyncHandler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const note = await db.researchNote.findUnique({ where: { id } });
    if (!note || note.ownerId !== user.id) throw ApiError.notFound("Note not found");
    await db.researchNote.delete({ where: { id } });
    return jsonOk({ id }, "Note deleted");
  }
);
