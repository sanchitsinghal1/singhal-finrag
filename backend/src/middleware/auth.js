// Auth middleware — bcrypt password hashing + JWT in an httpOnly cookie.
// Ported from src/lib/auth.ts. Uses cookie-parser (Express) instead of
// next/headers cookies(). Same security properties: HttpOnly + SameSite=Lax.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { ApiError } from "../utils/api-response.js";

const COOKIE_NAME = "sirag_session";
const TOKEN_TTL = "7d";
const SECRET =
  process.env.JWT_SECRET ||
  "dev-only-secret-change-me-please-use-a-long-random-string";

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}
export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signSession(user) {
  return jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, SECRET, {
    expiresIn: TOKEN_TTL,
  });
}
export function verifySession(token) {
  return jwt.verify(token, SECRET);
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7 * 1000,
    path: "/",
  });
}
export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

// Read the current user from the request cookie. Returns null if not authed.
export async function getCurrentUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = verifySession(token);
    const user = await User.findById(payload.sub);
    return user;
  } catch {
    return null;
  }
}

// Express middleware: require auth, attach user to req.
export async function requireUser(req, _res, next) {
  try {
    const user = await getCurrentUser(req);
    if (!user) throw ApiError.unauthorized("Authentication required");
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export { COOKIE_NAME };
