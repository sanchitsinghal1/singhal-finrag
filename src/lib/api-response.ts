// =====================================================================
// API response helpers — consistent success/error shape across routes.
// =====================================================================

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;
  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
  static badRequest(msg = "Bad request", details?: unknown) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = "Unauthorized") {
    return new ApiError(401, msg);
  }
  static forbidden(msg = "Forbidden") {
    return new ApiError(403, msg);
  }
  static notFound(msg = "Not found") {
    return new ApiError(404, msg);
  }
  static conflict(msg = "Conflict") {
    return new ApiError(409, msg);
  }
  static tooMany(msg = "Too many requests") {
    return new ApiError(429, msg);
  }
  static internal(msg = "Internal server error") {
    return new ApiError(500, msg);
  }
}

// Standard success envelope.
export function ok<T>(data: T, message?: string) {
  return { success: true, message, data };
}

// Wrap an async route handler so thrown ApiErrors are converted to a
// consistent JSON error response instead of crashing the request.
export function asyncHandler<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<NextResponse | Response>
) {
  return async (...args: TArgs) => {
    try {
      return await fn(...args);
    } catch (err) {
      const e = err as Error & { statusCode?: number; details?: unknown };
      const status = e.statusCode ?? 500;
      const body = {
        success: false,
        message: e.message || "Internal server error",
        ...(e.details ? { details: e.details } : {}),
      };
      // Log server-side only; never leak stack to client.
      console.error("[api:error]", status, e.message);
      return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });
    }
  };
}

// Small helper to build JSON responses.
import type { NextResponse } from "next/server";

// Build a JSON Response with the standard success envelope.
export function jsonOk<T>(data: T, message?: string, init?: ResponseInit) {
  return new Response(JSON.stringify(ok(data, message)), {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

// Build a JSON Response for an error (status + envelope).
export function jsonError(status: number, message: string, details?: unknown) {
  return new Response(
    JSON.stringify({ success: false, message, ...(details ? { details } : {}) }),
    { status, headers: { "content-type": "application/json" } }
  );
}

