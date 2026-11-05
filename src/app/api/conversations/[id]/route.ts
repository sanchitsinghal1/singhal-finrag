// GET    /api/conversations/[id]  -> conversation + messages (with parsed citations)
// PATCH  /api/conversations/[id]  -> rename / re-scope a conversation
//   body: { title?, companyId?, documentId? }
// DELETE /api/conversations/[id]  -> delete conversation + messages
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const GET = asyncHandler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const conv = await db.conversation.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, symbol: true, name: true } },
        document: { select: { id: true, originalName: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!conv || conv.ownerId !== user.id) throw ApiError.notFound("Conversation not found");

    return jsonOk({
      conversation: {
        id: conv.id,
        title: conv.title,
        companyId: conv.companyId,
        documentId: conv.documentId,
        company: conv.company,
        document: conv.document,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      },
      messages: conv.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations ? safeParse(m.citations) : null,
        evidenceType: m.evidenceType,
        createdAt: m.createdAt,
      })),
    });
  }
);

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}

export const PATCH = asyncHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const conv = await db.conversation.findUnique({ where: { id } });
    if (!conv || conv.ownerId !== user.id) throw ApiError.notFound("Conversation not found");

    const data: { title?: string; companyId?: string | null; documentId?: string | null } = {};
    if (typeof body.title === "string") data.title = body.title.slice(0, 200);
    if ("companyId" in body) data.companyId = body.companyId ? String(body.companyId) : null;
    if ("documentId" in body) data.documentId = body.documentId ? String(body.documentId) : null;

    const updated = await db.conversation.update({ where: { id }, data });
    return jsonOk({ id: updated.id, title: updated.title }, "Conversation updated");
  }
);

export const DELETE = asyncHandler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const conv = await db.conversation.findUnique({ where: { id } });
    if (!conv || conv.ownerId !== user.id) throw ApiError.notFound("Conversation not found");
    await db.conversation.delete({ where: { id } });
    return jsonOk({ id }, "Conversation deleted");
  }
);
