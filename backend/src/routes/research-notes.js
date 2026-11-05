// Research notes routes — list, create, update, delete.
import { Router } from "express";
import { ResearchNote } from "../models/ResearchNote.js";
import { requireUser } from "../middleware/auth.js";
import { asyncHandler, jsonOk, ApiError } from "../utils/api-response.js";

const router = Router();

router.get("/", requireUser, asyncHandler(async (req, res) => {
  const filter = { ownerId: req.user._id };
  if (req.query.companyId) filter.companyId = req.query.companyId;
  const notes = await ResearchNote.find(filter).sort({ updatedAt: -1 })
    .populate({ path: "companyId", select: "_id symbol name" }).lean();
  notes.forEach((n) => { n.company = n.companyId; });
  jsonOk(res, { notes: notes.map((n) => ({ ...n, id: String(n._id), ownerId: String(n.ownerId),
    company: n.company ? { id: String(n.company._id), symbol: n.company.symbol, name: n.company.name } : null })) });
}));

router.post("/", requireUser, asyncHandler(async (req, res) => {
  const { title, content, companyId, tags } = req.body ?? {};
  if (!title || !content) throw ApiError.badRequest("title and content are required");
  const note = await ResearchNote.create({
    ownerId: req.user._id,
    title: String(title).slice(0, 300),
    content: String(content),
    companyId: companyId ? String(companyId) : null,
    tags: tags ? String(tags) : null,
  });
  jsonOk(res, { id: String(note._id) }, "Note saved");
}));

router.patch("/:id", requireUser, asyncHandler(async (req, res) => {
  const note = await ResearchNote.findById(req.params.id);
  if (!note || String(note.ownerId) !== String(req.user._id)) throw ApiError.notFound("Note not found");
  const { title, content, tags } = req.body ?? {};
  const data = {};
  if (typeof title === "string") data.title = title.slice(0, 300);
  if (typeof content === "string") data.content = content;
  if (tags !== undefined) data.tags = tags ? String(tags) : null;
  const updated = await ResearchNote.findByIdAndUpdate(note._id, { $set: data }, { new: true });
  jsonOk(res, { id: String(updated._id) }, "Note updated");
}));

router.delete("/:id", requireUser, asyncHandler(async (req, res) => {
  const note = await ResearchNote.findById(req.params.id);
  if (!note || String(note.ownerId) !== String(req.user._id)) throw ApiError.notFound("Note not found");
  await ResearchNote.deleteOne({ _id: note._id });
  jsonOk(res, { id: String(note._id) }, "Note deleted");
}));

export default router;
