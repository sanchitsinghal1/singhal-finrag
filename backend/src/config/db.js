// ============================================================================
// MongoDB Connection — Mongoose singleton with graceful error handling
// ============================================================================
// This module connects the backend to MongoDB using Mongoose (the ODM).
//
// HOW IT WORKS:
//   - connectDB() is called once on server startup (see server.js).
//   - It reads MONGODB_URI from the environment (backend/.env).
//   - The connection is cached on `global.mongooseConn` so hot-reloads during
//     development don't open dozens of connections.
//   - If the connection fails, we THROW (server.js catches and continues, so
//     the API returns clear per-request errors instead of crashing the process).
//
// CONNECTION STRINGS:
//   Local:  mongodb://127.0.0.1:27017/singhal_finrag
//   Atlas:  mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
//
// Mongoose models (in models/*.js) use this connection automatically — you
// never call connectDB() from a route or service; it's done once at boot.
// ============================================================================

import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/singhal_finrag";
// Atlas often encodes the DB in the URI; for local you can leave this blank.
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || undefined;

// Cache the connection on globalThis so Bun's --hot reload doesn't spawn
// duplicate Mongoose connections (which would leak + cause warnings).
let cached = global.mongooseConn || null;

export async function connectDB() {
  if (cached) return cached;
  if (mongoose.connection.readyState >= 1) {
    cached = mongoose.connection;
    return cached;
  }
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 5000, // fail fast if MongoDB isn't reachable
    });
    cached = conn.connection;
    console.log("[db] MongoDB connected:", conn.connection.host, "/", conn.connection.name);
    return cached;
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    throw err; // server.js catches this and continues (API returns per-request errors)
  }
}

// --- Graceful shutdown ---
// When the process is killed (Ctrl+C / deploy restart), close the DB
// connection cleanly so no write is left half-finished.
process.on("SIGINT", async () => {
  try { await mongoose.disconnect(); console.log("[db] disconnected on SIGINT"); } catch {}
  process.exit(0);
});
process.on("SIGTERM", async () => {
  try { await mongoose.disconnect(); console.log("[db] disconnected on SIGTERM"); } catch {}
  process.exit(0);
});
