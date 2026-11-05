// POST /api/auth/logout — clear the session cookie.
import { asyncHandler, jsonOk } from "@/lib/api-response";
import { clearSessionCookie } from "@/lib/auth";

export const POST = asyncHandler(async () => {
  const res = jsonOk({}, "Signed out");
  clearSessionCookie(res);
  return res;
});
