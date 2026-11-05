// Conversations routes — list, create, detail, rename, delete.
import { Router } from "express";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { FinancialDocument } from "../models/FinancialDocument.js";
import { requireUser } from "../middleware/auth.js";
import { asyncHandler, jsonOk, ApiError } from "../utils/api-response.js";

const router = Router();
const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };

// GET /api/conversations?limit=
router.get("/", requireUser, asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit ?? 50));
  const convs = await Conversation.find({ ownerId: req.user._id }).sort({ updatedAt: -1 }).limit(limit).lean();
  const ids = convs.map((c) => c._id);
  const counts = await Message.aggregate([
    { $match: { conversationId: { $in: ids } } },
    { $group: { _id: "$conversationId", count: { $sum: 1 } } },
  ]);
  const countMap = {}; counts.forEach((c) => { countMap[String(c._id)] = c.count; });
  const lastMsgs = await Message.find({ conversationId: { $in: ids } }).sort({ createdAt: -1 }).lean();
  const lastMap = {}; lastMsgs.forEach((m) => { const k = String(m.conversationId); if (!lastMap[k]) lastMap[k] = m; });

  jsonOk(res, {
    conversations: convs.map((c) => ({
      id: String(c._id), title: c.title, companyId: c.companyId ? String(c.companyId) : null,
      messageCount: countMap[String(c._id)] ?? 0,
      lastMessage: lastMap[String(c._id)]?.content?.slice(0, 140) ?? null,
      lastMessageAt: lastMap[String(c._id)]?.createdAt ?? c.updatedAt,
      createdAt: c.createdAt, updatedAt: c.updatedAt,
    })),
  });
}));

// POST /api/conversations  body: { title?, companyId?, documentId? }
router.post("/", requireUser, asyncHandler(async (req, res) => {
  const { title, companyId, documentId } = req.body ?? {};
  if (documentId) {
    const doc = await FinancialDocument.findById(documentId);
    if (!doc || String(doc.ownerId) !== String(req.user._id))
      throw ApiError.forbidden("You can only attach your own documents to a conversation.");
  }
  const conv = await Conversation.create({
    ownerId: req.user._id,
    title: title ? String(title) : "New conversation",
    companyId: companyId ?? null,
    documentId: documentId ?? null,
  });
  jsonOk(res, { id: String(conv._id), title: conv.title }, "Conversation created");
}));

// GET /api/conversations/:id
router.get("/:id", requireUser, asyncHandler(async (req, res) => {
  const conv = await Conversation.findById(req.params.id).lean();
  if (!conv || String(conv.ownerId) !== String(req.user._id)) throw ApiError.notFound("Conversation not found");
  const messages = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean();
  jsonOk(res, {
    conversation: {
      ...conv, id: String(conv._id), ownerId: String(conv.ownerId),
      companyId: conv.companyId ? String(conv.companyId) : null,
      documentId: conv.documentId ? String(conv.documentId) : null,
    },
    messages: messages.map((m) => ({
      ...m, id: String(m._id), conversationId: String(m.conversationId),
      citations: m.citations ? safeParse(m.citations) : null,
    })),
  });
}));

// PATCH /api/conversations/:id
router.patch("/:id", requireUser, asyncHandler(async (req, res) => {
  const conv = await Conversation.findById(req.params.id);
  if (!conv || String(conv.ownerId) !== String(req.user._id)) throw ApiError.notFound("Conversation not found");
  const { title, companyId, documentId } = req.body ?? {};
  const data = {};
  if (typeof title === "string") data.title = title.slice(0, 200);
  if ("companyId" in req.body) data.companyId = companyId ? String(companyId) : null;
  if ("documentId" in req.body) data.documentId = documentId ? String(documentId) : null;
  const updated = await Conversation.findByIdAndUpdate(conv._id, { $set: data }, { new: true });
  jsonOk(res, { id: String(updated._id), title: updated.title }, "Conversation updated");
}));

// DELETE /api/conversations/:id
router.delete("/:id", requireUser, asyncHandler(async (req, res) => {
  const conv = await Conversation.findById(req.params.id);
  if (!conv || String(conv.ownerId) !== String(req.user._id)) throw ApiError.notFound("Conversation not found");
  await Message.deleteMany({ conversationId: conv._id });
  await Conversation.deleteOne({ _id: conv._id });
  jsonOk(res, { id: String(conv._id) }, "Conversation deleted");
}));

export default router;
