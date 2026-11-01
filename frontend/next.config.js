// Next.js config — JavaScript, standalone output, and a rewrite that proxies
// /api/* to the separate Express backend on port 3001. This keeps the browser
// same-origin (cookies work with SameSite=Lax) while giving a clean
// frontend/backend separation.
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: false,
  // Proxy all API requests to the Express backend.
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://127.0.0.1:3001";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
    ];
  },
};

export default nextConfig;
