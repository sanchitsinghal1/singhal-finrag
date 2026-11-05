// =====================================================================
// Auth: bcrypt password hashing + JWT in an httpOnly cookie.
// ---------------------------------------------------------------------
// Why JWT-in-cookie instead of NextAuth here?  It keeps the auth layer
// fully self-contained and easy to read/learn, while still being secure
// for a portfolio project: httpOnly + SameSite=Lax + signed token.
// In production you would add Secure (HTTPS) and rotate JWT_SECRET.
// =====================================================================

import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";
import { ApiError } from "@/lib/api-response";

const COOKIE_NAME = "sirag_session";
const TOKEN_TTL = "7d";
// A dev fallback secret so the app still boots without configuration.
// Production MUST set a strong JWT_SECRET in .env.
const SECRET =
  process.env.JWT_SECRET ||
  "dev-only-secret-change-me-please-use-a-long-random-string";

// ---------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------
export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------
// Session tokens
// ---------------------------------------------------------------------
export function signSession(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

export function verifySession(token: string): JwtPayload & {
  sub: string;
  email: string;
  role: string;
} {
  const payload = jwt.verify(token, SECRET) as JwtPayload & {
    sub: string;
    email: string;
    role: string;
  };
  return payload;
}

// Set the session cookie on an outgoing response.
export function setSessionCookie(res: Response, token: string) {
  res.headers.append(
    "set-cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );
}

export function clearSessionCookie(res: Response) {
  res.headers.append(
    "set-cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

// ---------------------------------------------------------------------
// Read the current user from the request cookie (for API routes).
// ---------------------------------------------------------------------
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = verifySession(token);
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    return user;
  } catch {
    return null;
  }
}

// Require auth — throws 401 if not logged in.
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw ApiError.unauthorized("Authentication required");
  return user;
}

export { COOKIE_NAME };
