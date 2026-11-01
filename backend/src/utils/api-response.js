// Consistent API error class + envelope helpers + async route wrapper.
// Ported from src/lib/api-response.ts — same contracts, JavaScript.

export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
  static badRequest(msg = "Bad request", details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = "Unauthorized") { return new ApiError(401, msg); }
  static forbidden(msg = "Forbidden") { return new ApiError(403, msg); }
  static notFound(msg = "Not found") { return new ApiError(404, msg); }
  static conflict(msg = "Conflict") { return new ApiError(409, msg); }
  static tooMany(msg = "Too many requests") { return new ApiError(429, msg); }
  static internal(msg = "Internal server error") { return new ApiError(500, msg); }
}

export function ok(data, message) {
  return { success: true, message, data };
}

// Build a JSON success response for Express.
export function jsonOk(res, data, message, status = 200) {
  return res.status(status).json(ok(data, message));
}

// Build a JSON error response for Express.
export function jsonError(res, err, status) {
  const e = err && err.statusCode ? err : { statusCode: status || 500, message: (err && err.message) || "Internal server error" };
  const body = { success: false, message: e.message };
  if (e.details) body.details = e.details;
  console.error("[api:error]", e.statusCode, e.message);
  return res.status(e.statusCode || 500).json(body);
}

// Wrap an async Express handler so thrown ApiErrors become JSON errors.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      jsonError(res, err);
    });
  };
}
