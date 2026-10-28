// POST /api/auth/login — validate credentials and set the session cookie.
import { db } from "@/lib/db";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";
import { asyncHandler, jsonOk, ApiError } from "@/lib/api-response";

export const POST = asyncHandler(async (req: Request) => {
  const { email, password } = await req.json().catch(() => ({}));
  const e = String(email ?? "").trim().toLowerCase();
  const p = String(password ?? "");
  if (!e || !p) throw ApiError.badRequest("Email and password are required.");

  const user = await db.user.findUnique({ where: { email: e } });
  // Constant-time-ish: still run a hash compare even when the user is
  // missing so response timing doesn't leak account existence.
  const okUser = user ?? { passwordHash: "$2a$10$invalidinvalidinvalidinvalidinvalidinvalid" };
  const ok = await verifyPassword(p, okUser.passwordHash);
  if (!user || !ok) throw ApiError.unauthorized("Invalid email or password.");

  const token = signSession({ id: user.id, email: user.email, role: user.role });
  const res = jsonOk({ id: user.id, email: user.email, name: user.name }, "Signed in");
  setSessionCookie(res, token);
  return res;
});
