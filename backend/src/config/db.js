// MongoDB connection — Mongoose singleton with graceful error handling.
// Supports both MongoDB Atlas (MONGODB_URI=mongodb+srv://...) and local
// MongoDB (mongodb://127.0.0.1:27017/...). Connection is reused across
// hot reloads in dev.
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/singhal_finrag";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || undefined; // Atlas often encodes db in URI

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
      serverSelectionTimeoutMS: 5000,
    });
    cached = conn.connection;
    console.log("[db] MongoDB connected:", conn.connection.host, "/", conn.connection.name);
    return cached;
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    // Don't crash — the API will return clear DB errors per request.
    throw err;
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  try { await mongoose.disconnect(); console.log("[db] disconnected on SIGINT"); } catch {}
  process.exit(0);
});
process.on("SIGTERM", async () => {
  try { await mongoose.disconnect(); console.log("[db] disconnected on SIGTERM"); } catch {}
  process.exit(0);
});
