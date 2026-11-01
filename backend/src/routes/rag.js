// RAG query route — the core endpoint.
// Body: { question, conversationId?, companyId?, documentId? }
import { Router } from "express";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { requireUser } from "../middleware/auth.js";
import { answer, loadHistory } from "../services/rag.js";
import { asyncHandler, jsonOk, ApiError } from "../utils/api-response.js";

const router = Router();

router.post("/query", requireUser, asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const question = String(body.question ?? "").trim();
  if (!question) throw ApiError.badRequest("question is required");
  if (question.length > 2000) throw ApiError.badRequest("Question is too long (max 2000 chars).");

  let conversationId = body.conversationId;
  let companyId = body.companyId;
  let documentId = body.documentId;

  let history = [];
  if (conversationId) {
    const conv = await Conversation.findById(conversationId);
    if (!conv || String(conv.ownerId) !== String(req.user._id)) throw ApiError.notFound("Conversation not found");
    if (conv.companyId) companyId = String(conv.companyId);
    if (conv.documentId) documentId = String(conv.documentId);
    history = await loadHistory(conversationId);
  }

  const result = await answer(question, {
    ownerId: req.user._id,
    companyId,
    documentId,
    history,
  });

  if (conversationId) {
    await Message.create({ conversationId, role: "user", content: question });
    const assistantMsg = await Message.create({
      conversationId,
      role: "assistant",
      content: result.answer,
      citations: JSON.stringify(result.citations),
      evidenceType: result.evidenceType,
    });
    if (history.length === 0) {
      const title = question.length > 60 ? question.slice(0, 57) + "…" : question;
      await Conversation.updateOne({ _id: conversationId }, { title });
    }
    jsonOk(res, { ...result, conversationId, messageId: String(assistantMsg._id) });
  } else {
    jsonOk(res, result);
  }
}));

export default router;
