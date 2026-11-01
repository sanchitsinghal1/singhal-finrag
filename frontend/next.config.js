// ============================================================================
// Next.js Configuration — the proxy that connects frontend to backend
// ============================================================================
// This is THE file that makes the frontend/backend split work seamlessly.
//
// WHAT IT DOES:
//   When the browser calls /api/auth/login, Next.js intercepts it (via the
//   rewrites() rule below) and forwards it to the Express backend at
//   BACKEND_URL (default http://127.0.0.1:3001).
//
//   Browser --> Next.js (:3000) --[rewrite proxy]--> Express (:3001)
//                                          |
//                                          | Cookie + Set-Cookie headers
//                                          | pass straight through, so the
//                                          | browser sees it as same-origin.
//
// WHY A PROXY (not direct cross-origin calls):
//   If the frontend called the backend directly (localhost:3001), the browser
//   would treat it as cross-origin. The httpOnly session cookie would need
//   SameSite=None + Secure (HTTPS only) — which breaks local dev over HTTP.
//   The rewrite proxy keeps everything same-origin (localhost:3000), so the
//   cookie works with SameSite=Lax even in dev. Clean.
//
// `output: "standalone"` produces a self-contained production build.
// ============================================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: false,

  // Proxy every /api/* request to the Express backend.
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://127.0.0.1:3001";
    return [
      // "/api/auth/login" -> "${BACKEND_URL}/api/auth/login"
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
    ];
  },
};

export default nextConfig;
