// GET    /api/documents/[id]  -> document metadata + chunks (paginated)
// DELETE /api/documents/[id]  -> delete a document and all its chunks
//   (ownership checked — users can only access their own documents)
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const GET = asyncHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const chunkLimit = Math.min(50, Number(url.searchParams.get("chunkLimit") ?? 20));
    const chunkOffset = Math.max(0, Number(url.searchParams.get("chunkOffset") ?? 0));

    const doc = await db.financialDocument.findUnique({
      where: { id },
      include: { company: { select: { id: true, symbol: true, name: true } } },
    });
    if (!doc || doc.ownerId !== user.id) throw ApiError.notFound("Document not found");

    const [chunks, chunkTotal] = await Promise.all([
      db.documentChunk.findMany({
        where: { documentId: id },
        orderBy: { chunkIndex: "asc" },
        take: chunkLimit,
        skip: chunkOffset,
        select: { id: true, chunkIndex: true, page: true, text: true, tokenCount: true, charCount: true },
      }),
      db.documentChunk.count({ where: { documentId: id } }),
    ]);

    return jsonOk({
      document: {
        id: doc.id,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        size: doc.size,
        status: doc.status,
        totalPages: doc.totalPages,
        chunkCount: doc.chunkCount,
        charCount: doc.charCount,
        errorMessage: doc.errorMessage,
        uploadedAt: doc.uploadedAt,
        processedAt: doc.processedAt,
        company: doc.company,
      },
      chunks,
      chunkTotal,
      chunkLimit,
      chunkOffset,
    });
  }
);

export const DELETE = asyncHandler(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;

    const doc = await db.financialDocument.findUnique({ where: { id } });
    if (!doc || doc.ownerId !== user.id) throw ApiError.notFound("Document not found");

    // Cascade-delete chunks (Prisma onDelete: Cascade on DocumentChunk handles this
    // automatically, but we delete the parent which cascades).
    await db.financialDocument.delete({ where: { id } });
    return jsonOk({ id }, "Document deleted");
  }
);
