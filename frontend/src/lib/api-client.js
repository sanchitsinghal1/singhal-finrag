// ============================================================================
// API Client — how the frontend talks to the backend
// ============================================================================
// Every frontend component that needs data calls these helpers instead of
// using fetch() directly. This centralises:
//
//   1. credentials: "include"  -> sends the httpOnly session cookie with every
//      request (required for auth — without it, the backend can't identify you)
//   2. The standard response envelope  -> { success, data, message }
//   3. Error handling  -> throws a typed ApiError so callers can toast it
//
// USAGE:
//   import { api } from "@/lib/api-client";
//   const user = await api.get("/api/auth/me");      // GET
//   await api.post("/api/rag/query", { question });   // POST with JSON body
//   await api.del("/api/documents/123");               // DELETE
//   await uploadFile("/api/documents", formData);      // multipart file upload
//
// All URLs are RELATIVE (start with /api/...). Next.js proxies them to the
// backend via next.config.js rewrites — the frontend never knows the backend
// port. This is what keeps the cookie same-origin.
// ============================================================================

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;   // HTTP status code (400, 401, 404, 500, ...)
    this.details = details; // optional extra info from the server
  }
}

// Core request function used by api.get / post / patch / del.
async function request(method, url, body, init) {
  const res = await fetch(url, {
    method,
    credentials: "include", // <-- CRITICAL: send the session cookie
    headers: body
      ? { "content-type": "application/json", ...(init?.headers ?? {}) }
      : { ...(init?.headers ?? {}) },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

  // Some responses (e.g. a failed non-JSON upstream) won't have a JSON body.
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
    return {};
  }

  // Parse the standard envelope.
  const json = await res.json();
  if (!res.ok || !json.success) {
    // Server returned an error — throw with the server's message.
    throw new ApiError(res.status, json.message ?? `Request failed (${res.status})`, json.details);
  }

  // IMPORTANT: preserve `null` explicitly. /api/auth/me returns data: null
  // when not logged in. If we defaulted null -> {}, an empty object would be
  // truthy and the app would think an empty user is logged in. This was a
  // real bug during development (see docs/MIGRATION_REPORT.md).
  return json.data === undefined ? {} : json.data;
}

// Convenience methods — these are what components actually import.
export const api = {
  get: (url, init) => request("GET", url, undefined, init),
  post: (url, body, init) => request("POST", url, body, init),
  patch: (url, body, init) => request("PATCH", url, body, init),
  del: (url, init) => request("DELETE", url, undefined, init),
};

// Multipart file upload — FormData sets its own Content-Type (with the
// boundary), so we DON'T set content-type manually here.
export async function uploadFile(url, formData) {
  const res = await fetch(url, { method: "POST", credentials: "include", body: formData });
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    if (!res.ok) throw new ApiError(res.status, `Upload failed (${res.status})`);
    return {};
  }
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message ?? "Upload failed", json.details);
  }
  return json.data ?? {};
}
