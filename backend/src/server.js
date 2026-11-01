// Singhal FinRAG — backend Express server.
// Port: 3001 (the Next.js frontend on 3000 proxies /api/* here via rewrites).
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { seedCompanies } from "./services/market-data.js";
import authRoutes from "./routes/auth.js";
import companyRoutes from "./routes/companies.js";
import marketRoutes from "./routes/market.js";
import documentRoutes from "./routes/documents.js";
import ragRoutes from "./routes/rag.js";
import conversationRoutes from "./routes/conversations.js";
import watchlistRoutes from "./routes/watchlists.js";
import researchNoteRoutes from "./routes/research-notes.js";
import analysisRoutes from "./routes/analysis.js";

const PORT = process.env.PORT || 3001;

const app = express();

// CORS: the frontend (Next.js on :3000) proxies requests here, so the
// browser never calls us directly. We still allow the dev origin for
// safety and for any direct admin/testing calls.
app.use(cors({
  origin: (origin, cb) => cb(null, true), // accept any origin (proxy handles same-origin)
  credentials: true,
}));
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => res.json({ ok: true, db: mongooseConnectionState() }));

// Routes (all mounted under /api to match the frontend's expectations)
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/watchlists", watchlistRoutes);
app.use("/api/research-notes", researchNoteRoutes);
app.use("/api/analysis", analysisRoutes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.url}` }));

// Centralised error handler (catches errors passed via next(err))
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error("[api:error]", status, err.message);
  res.status(status).json({ success: false, message: err.message || "Internal server error", ...(err.details ? { details: err.details } : {}) });
});

function mongooseConnectionState() {
  return mongoose.connection.readyState; // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
}

// Start: connect DB, seed directory, listen.
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
