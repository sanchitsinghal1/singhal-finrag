// =====================================================================
// Client-side API helper. Wraps fetch, attaches credentials, parses the
// standard { success, data, message } envelope, and throws an Error with
// the server's message on failure so callers can use try/catch + toasts.
// =====================================================================

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
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
    return {} as T;
  }

  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message ?? `Request failed (${res.status})`, json.details);
  }
  // Preserve `null` explicitly (e.g. /api/auth/me when not logged in).
  // Only fall back to an empty object when `data` is literally absent.
  return (json.data === undefined ? ({} as T) : (json.data as T));
}

export const api = {
  get: <T>(url: string, init?: RequestInit) => request<T>("GET", url, undefined, init),
  post: <T>(url: string, body?: unknown, init?: RequestInit) => request<T>("POST", url, body, init),
  patch: <T>(url: string, body?: unknown, init?: RequestInit) => request<T>("PATCH", url, body, init),
  del: <T>(url: string, init?: RequestInit) => request<T>("DELETE", url, undefined, init),
};

// Convenience for multipart file uploads (FormData sets its own Content-Type).
export async function uploadFile<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", credentials: "include", body: formData });
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    if (!res.ok) throw new ApiError(res.status, `Upload failed (${res.status})`);
    return {} as T;
  }
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message ?? "Upload failed", json.details);
  }
  return (json.data ?? ({} as T)) as T;
}
