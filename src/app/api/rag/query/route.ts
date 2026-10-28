// POST /api/rag/query  -> ask a question against the user's documents.
//
// Body: { question, conversationId?, companyId?, documentId? }
//   - conversationId: when provided, we load prior messages as context,
//     persist both the question and the answer, and attach citations.
//   - companyId / documentId: narrow the retrieval scope.
//
// Returns: { answer, citations, evidenceType, retrievedCount, topScore }
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { answer, loadHistory, type Citation } from "@/lib/rag";
import { db } from "@/lib/db";

export const POST = asyncHandler(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const question = String(body.question ?? "").trim();
  if (!question) throw ApiError.badRequest("question is required");
  if (question.length > 2000)
    throw ApiError.badRequest("Question is too long (max 2000 chars).");

  let conversationId: string | undefined = body.conversationId;
  let companyId: string | undefined = body.companyId;
  let documentId: string | undefined = body.documentId;

  // Resolve / verify the optional conversation scope.
  let history: { role: "user" | "assistant"; content: string }[] = [];
  if (conversationId) {
    const conv = await db.conversation.findUnique({ where: { id: conversationId } });
    if (!conv || conv.ownerId !== user.id) throw ApiError.notFound("Conversation not found");
    if (conv.companyId) companyId = conv.companyId;
    if (conv.documentId) documentId = conv.documentId;
    history = await loadHistory(conversationId);
  }

  // Run the RAG pipeline (retrieve -> build prompt -> LLM -> citations).
  const result = await answer(question, {
    ownerId: user.id,
    companyId,
    documentId,
    history,
  });

  // Persist the exchange when a conversation context exists.
  if (conversationId) {
    await db.message.create({
      data: { conversationId, role: "user", content: question },
    });
    const assistantMsg = await db.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: result.answer,
        citations: JSON.stringify(result.citations),
        evidenceType: result.evidenceType,
      },
    });
    // Auto-title the conversation from the first question for convenience.
    if (history.length === 0) {
      const title = question.length > 60 ? question.slice(0, 57) + "…" : question;
      await db.conversation.update({ where: { id: conversationId }, data: { title } });
    }
    return jsonOk({ ...result, conversationId, messageId: assistantMsg.id });
  }

  return jsonOk({ ...result, citations: result.citations as Citation[] });
});
