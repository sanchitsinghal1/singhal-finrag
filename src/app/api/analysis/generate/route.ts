// POST /api/analysis/generate  -> produce a structured research brief
//   body: { kind: "bull_bear" | "swot" | "summary", companyId }
// The LLM is grounded ONLY in the company's latest market snapshot (and any
// of the user's READY documents for that company, when available). Every
// major claim is tagged with its evidence type so the user can trace it.
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getZai } from "@/lib/zai";
import { getSnapshot } from "@/lib/market-data";

const KINDS = new Set(["bull_bear", "swot", "summary"]);

export const POST = asyncHandler(async (req: Request) => {
  const user = await requireUser();
  const { kind, companyId } = await req.json().catch(() => ({}));
  if (!KINDS.has(String(kind))) throw ApiError.badRequest("kind must be bull_bear | swot | summary");
  if (!companyId) throw ApiError.badRequest("companyId is required");

  const company = await db.company.findUnique({ where: { id: String(companyId) } });
  if (!company) throw ApiError.notFound("Company not found");

  // Gather grounding context: market snapshot + the user's docs for this company.
  const snapshot = await getSnapshot(company.id).catch(() => null);
  const docs = await db.financialDocument.findMany({
    where: { ownerId: user.id, companyId: company.id, status: "ready" },
    select: { originalName: true, charCount: true },
    take: 5,
  });

  const marketBlock = snapshot
    ? `MARKET SNAPSHOT (${company.symbol})\n` +
      `Name: ${company.name} | Sector: ${company.sector ?? "n/a"}\n` +
      `Price: ${snapshot.price ?? "n/a"} ${snapshot.currency ?? ""} | 1d change: ${snapshot.changePercent ?? "n/a"}%\n` +
      `Market cap: ${snapshot.marketCap ?? "n/a"} | P/E: ${snapshot.peRatio ?? "n/a"} | EPS: ${snapshot.eps ?? "n/a"}\n` +
      `52w range: ${snapshot.week52Low ?? "n/a"} - ${snapshot.week52High ?? "n/a"}\n` +
      `Summary (web-sourced): ${snapshot.summary ?? "n/a"}\n` +
      `Source: ${snapshot.source} @ ${snapshot.fetchedAt.toISOString()}`
    : "(No market snapshot available.)";

  const docBlock = docs.length
    ? `AVAILABLE USER DOCUMENTS (not inlined; the user can ask the Research chat for details):\n` +
      docs.map((d, i) => `[${i + 1}] ${d.originalName} (${d.charCount.toLocaleString()} chars)`).join("\n")
    : "(User has not uploaded any documents for this company.)";

  const briefByKind: Record<string, string> = {
    bull_bear: `Produce a concise Bull case vs Bear case brief for ${company.name}. Use a "Bull Case" and a "Bear Case" section, each with 3-5 bullet points. End with a one-line "Neutral observation". Only base points on the snapshot figures and document availability above.`,
    swot: `Produce a SWOT analysis for ${company.name}. Use sections Strengths, Weaknesses, Opportunities, Threats — each with 3-5 bullets. Only base points on the snapshot figures and document availability above.`,
    summary: `Produce a one-page equity research summary for ${company.name} covering: Business overview, Key financials, Recent observations, Risks, and Outlook. Only base claims on the snapshot figures above.`,
  };

  const messages = [
    {
      role: "assistant" as const,
      content:
        `You are an equity research analyst. Write ONLY from the provided context.\n` +
        `If a figure is missing, say "n/a" — do NOT invent numbers, ratios or news.\n` +
        `Mark each major claim with its evidence type in square brackets: [market data] or [user documents] or [analyst interpretation].\n\n` +
        `${marketBlock}\n\n${docBlock}`,
    },
    { role: "user" as const, content: briefByKind[String(kind)] },
  ];

  const zai = await getZai();
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
  });
  const text = completion.choices?.[0]?.message?.content?.trim() || "The AI service returned no content.";

  return jsonOk({
    kind,
    companyId: company.id,
    symbol: company.symbol,
    content: text,
    groundedOn: {
      market: !!snapshot,
      documents: docs.length,
      documentNames: docs.map((d) => d.originalName),
      snapshotFetchedAt: snapshot?.fetchedAt ?? null,
    },
  });
});
