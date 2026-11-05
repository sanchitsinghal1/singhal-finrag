// Auth routes — register, login, logout, me.
import { Router } from "express";
import { User } from "../models/User.js";
import { hashPassword, setSessionCookie, clearSessionCookie, verifyPassword, signSession } from "../middleware/auth.js";
import { asyncHandler, jsonOk, ApiError } from "../utils/api-response.js";

const router = Router();

router.post("/register", asyncHandler(async (req, res) => {
  const { email, password, name } = req.body ?? {};
  const e = String(email ?? "").trim().toLowerCase();
  const p = String(password ?? "");
  if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw ApiError.badRequest("A valid email is required.");
  if (p.length < 8) throw ApiError.badRequest("Password must be at least 8 characters.");

  const existing = await User.findOne({ email: e });
  if (existing) throw ApiError.conflict("An account with this email already exists.");

  const user = await User.create({
    email: e,
    name: name ? String(name).trim() : null,
    passwordHash: await hashPassword(p),
  });

  const token = signSession(user);
  setSessionCookie(res, token);
  jsonOk(res, { id: String(user._id), email: user.email, name: user.name }, "Account created");
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  const e = String(email ?? "").trim().toLowerCase();
  const p = String(password ?? "");
  if (!e || !p) throw ApiError.badRequest("Email and password are required.");

  const user = await User.findOne({ email: e });
  // Constant-time-ish: run a hash compare even on user-miss so timing
  // doesn't leak account existence.
  const okUser = user ?? { passwordHash: "$2a$10$invalidinvalidinvalidinvalidinvalidinvalid" };
  const ok = await verifyPassword(p, okUser.passwordHash);
  if (!user || !ok) throw ApiError.unauthorized("Invalid email or password.");

  const token = signSession(user);
  setSessionCookie(res, token);
  jsonOk(res, { id: String(user._id), email: user.email, name: user.name }, "Signed in");
}));

router.post("/logout", asyncHandler(async (req, res) => {
  clearSessionCookie(res);
  jsonOk(res, {}, "Signed out");
}));

router.get("/me", asyncHandler(async (req, res) => {
  // Optional auth — return user if cookie present, else null.
  const { getCurrentUser } = await import("../middleware/auth.js");
  const user = await getCurrentUser(req);
  jsonOk(res, user ? { id: String(user._id), email: user.email, name: user.name, role: user.role } : null);
}));

export default router;
