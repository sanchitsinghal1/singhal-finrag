// POST /api/auth/register — create a user account.
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";

export const POST = asyncHandler(async (req: Request) => {
  const { email, password, name } = await req.json().catch(() => ({}));
  const e = String(email ?? "").trim().toLowerCase();
  const p = String(password ?? "");

  if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
    throw ApiError.badRequest("A valid email is required.");
  if (p.length < 8)
    throw ApiError.badRequest("Password must be at least 8 characters.");

  const existing = await db.user.findUnique({ where: { email: e } });
  if (existing) throw ApiError.conflict("An account with this email already exists.");

  const user = await db.user.create({
    data: {
      email: e,
      name: name ? String(name).trim() : null,
      passwordHash: await hashPassword(p),
    },
  });

  const token = signSession({ id: user.id, email: user.email, role: user.role });
  const res = jsonOk({ id: user.id, email: user.email, name: user.name }, "Account created");
  setSessionCookie(res, token);
  return res;
});
