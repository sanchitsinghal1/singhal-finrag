// ============================================================================
// Singhal FinRAG — Backend Entry Point (Express server)
// ============================================================================
// This is the brain of the backend. It does three things:
//
//   1. Connects to MongoDB (via Mongoose) and seeds the company directory.
//   2. Wires up all the API route handlers (auth, companies, documents, RAG, etc.).
//   3. Starts listening on port 3001 for requests from the Next.js frontend.
//
// ARCHITECTURE — how a request flows:
//   Browser (user)  -->  Next.js frontend (port 3000)
//                          |
//                          | next.config.js rewrites /api/* -> http://127.0.0.1:3001
//                          v
//                        THIS Express server (port 3001)
//                          |
//                          | route handler -> service -> Mongoose -> MongoDB
//                          v
//                        JSON response  -->  back through the proxy  -->  browser
//
// The browser never talks to us directly — Next.js proxies every /api request.
// This keeps the browser same-origin so the httpOnly session cookie works with
// SameSite=Lax (no cross-origin cookie headaches in development).
//
// Port: 3001 (configurable via PORT env var). Don't change it unless you also
// update frontend/.env BACKEND_URL to match.
// ============================================================================

import express from "express";
import cookieParser from "cookie-parser"; // reads req.cookies from the Cookie header
import cors from "cors";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { seedCompanies } from "./services/market-data.js";

// --- Route handlers (each file = one resource group) ---
import authRoutes from "./routes/auth.js";                 // register/login/logout/me
import companyRoutes from "./routes/companies.js";         // list/create + detail
import marketRoutes from "./routes/market.js";             // snapshot + price history
import documentRoutes from "./routes/documents.js";        // upload/list/read/delete
import ragRoutes from "./routes/rag.js";                   // THE RAG query endpoint
import conversationRoutes from "./routes/conversations.js"; // research chat history
import watchlistRoutes from "./routes/watchlists.js";      // tracked companies
import researchNoteRoutes from "./routes/research-notes.js"; // saved notes
import analysisRoutes from "./routes/analysis.js";         // compare + AI briefs

const PORT = process.env.PORT || 3001;

const app = express();

// --- Middleware (runs for every request, in order) ---

// CORS: since the frontend proxies to us server-side, the browser never calls
// us cross-origin. We accept any origin anyway for direct/admin testing.
app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));

// Parse JSON request bodies (up to 12 MB for large document text).
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

// Read the httpOnly session cookie (set by /api/auth/login) into req.cookies.
app.use(cookieParser());

// --- Health check endpoint — used to verify the backend + DB are alive ---
app.get("/health", (req, res) => res.json({ ok: true, db: mongooseConnectionState() }));

// --- Mount all API routes under /api/* (matches the frontend's expectations) ---
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/rag", ragRoutes);                       // <-- POST /api/rag/query
app.use("/api/conversations", conversationRoutes);
app.use("/api/watchlists", watchlistRoutes);
app.use("/api/research-notes", researchNoteRoutes);
app.use("/api/analysis", analysisRoutes);

// --- 404 handler — anything that didn't match a route ---
app.use((req, res) => res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.url}` }));

// --- Centralised error handler ---
// Any route that calls next(err) or throws inside asyncHandler lands here.
// Converts ApiError.statusCode into the HTTP status; logs server-side only.
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error("[api:error]", status, err.message);
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    ...(err.details ? { details: err.details } : {}),
  });
});

// Helper for the /health endpoint: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
function mongooseConnectionState() {
  return mongoose.connection.readyState;
}

// --- Boot sequence ---
// 1. Connect to MongoDB (graceful: if it fails, the server still starts so
//    the API returns clear per-request DB errors instead of crashing).
// 2. Seed the curated company directory (20 popular tickers) — idempotent.
// 3. Start listening on PORT.
(async () => {
  try {
    await connectDB();
    await seedCompanies();
    console.log("[db] company directory seeded");
  } catch (err) {
    console.error("[startup] DB connection failed — API will return DB errors per request:", err.message);
  }
  app.listen(PORT, () => {
    console.log(`[server] Singhal FinRAG backend on http://127.0.0.1:${PORT}`);
  });
})();
