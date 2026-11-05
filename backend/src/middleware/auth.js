// ============================================================================
// Auth Middleware — bcrypt password hashing + JWT in an httpOnly cookie
// ============================================================================
// This module handles authentication for the Express backend. The flow:
//
//   REGISTER  -> hash password with bcrypt (cost 10) -> store User in MongoDB
//                -> sign a JWT -> set it in an httpOnly cookie -> user is in
//   LOGIN     -> find user by email -> bcrypt.compare the password
//                -> if OK, sign JWT + set cookie; if not, 401
//   ME        -> read the cookie -> verify the JWT -> load the User from MongoDB
//   LOGOUT    -> clear the cookie
//
// SECURITY DETAILS (the parts that aren't boilerplate):
//   - The cookie is HttpOnly (JavaScript can't read it -> XSS can't steal it)
//     and SameSite=Lax (blocks most CSRF).
//   - On login, even if the email doesn't exist we STILL run a bcrypt compare
//     against a dummy hash, so the response timing doesn't leak which emails
//     are registered (a timing-attack mitigation).
//   - requireUser is Express middleware: it throws 401 if there's no valid
//     session, and attaches the loaded user to req.user for the route handler.
//
// The frontend never sees the JWT directly — it just sends the cookie
// (credentials: "include" in api-client.js) and the backend reads it here.
// ============================================================================

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
