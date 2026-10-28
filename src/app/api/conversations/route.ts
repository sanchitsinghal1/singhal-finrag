// GET  /api/conversations            -> list user's conversations (with last message preview)
// POST /api/conversations            -> create a new conversation
//   body: { title?, companyId?, documentId? }
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const GET = asyncHandler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const limit = Math.min(50, Number(url.searchParams.get("limit") ?? 50));

  const conversations = await db.conversation.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      company: { select: { id: true, symbol: true, name: true } },
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, createdAt: true } },
    },
  });

  return jsonOk({
    conversations: conversations.map((c) => ({
      id: c.id,
      title: c.title,
      companyId: c.companyId,
      company: c.company,
      messageCount: c._count.messages,
      lastMessage: c.messages[0]?.content?.slice(0, 140) ?? null,
      lastMessageAt: c.messages[0]?.createdAt ?? c.updatedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
});

export const POST = asyncHandler(async (req: Request) => {
  const user = await requireUser();
  const { title, companyId, documentId } = await req.json().catch(() => ({}));

  // Validate the optional scope references belong to the user.
  let company: { id: string } | null = null;
  let document: { id: string; ownerId: string } | null = null;
  if (companyId) {
    company = await db.company.findUnique({ where: { id: String(companyId) }, select: { id: true } });
    if (!company) throw ApiError.badRequest("companyId not found");
  }
  if (documentId) {
    document = await db.financialDocument.findUnique({ where: { id: String(documentId) }, select: { id: true, ownerId: true } });
    if (!document || document.ownerId !== user.id)
      throw ApiError.forbidden("You can only attach your own documents to a conversation.");
  }

  const conv = await db.conversation.create({
    data: {
      ownerId: user.id,
      title: title ? String(title) : "New conversation",
      companyId: company?.id ?? null,
      documentId: document?.id ?? null,
    },
  });
  return jsonOk({ id: conv.id, title: conv.title }, "Conversation created");
});
