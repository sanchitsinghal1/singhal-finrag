// GET /api/auth/me — return the currently authenticated user (or null).
import { asyncHandler, jsonOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export const GET = asyncHandler(async () => {
  const user = await getCurrentUser();
  return jsonOk(user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null);
});
