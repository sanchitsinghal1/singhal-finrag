// =====================================================================
// Client-side API helper. Wraps fetch, attaches credentials, parses the
// standard { success, data, message } envelope, and throws an Error with
// the server's message on failure so callers can use try/catch + toasts.
// (JavaScript port — types stripped, runtime behaviour identical.)
// =====================================================================

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, url, body, init) {
  const res = await fetch(url, {
    method,
    credentials: "include", // send/receive the httpOnly session cookie
    headers: body
      ? { "content-type": "application/json", ...(init?.headers ?? {}) }
      : { ...(init?.headers ?? {}) },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

  // Special case: multipart upload already has its own body.
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
    return {};
  }

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message ?? `Request failed (${res.status})`, json.details);
  }
  // Preserve `null` explicitly (e.g. /api/auth/me when not logged in).
  // Only fall back to an empty object when `data` is literally absent.
  return json.data === undefined ? {} : json.data;
}

export const api = {
  get: (url, init) => request("GET", url, undefined, init),
  post: (url, body, init) => request("POST", url, body, init),
  patch: (url, body, init) => request("PATCH", url, body, init),
  del: (url, init) => request("DELETE", url, undefined, init),
};

// Convenience for multipart file uploads (FormData sets its own Content-Type).
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
