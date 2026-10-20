import type { NextConfig } from "next";

const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Auth and the API live in the backend. Proxying them through this origin keeps the
  // session cookie first-party and the Google OAuth callback URL unchanged.
  // Ops endpoints are internal and deliberately not exposed here.
  async rewrites() {
    return [
      { source: "/api/auth/:path*", destination: `${backendUrl}/api/auth/:path*` },
      { source: "/api/v1/:path((?!ops(?:/|$)).*)", destination: `${backendUrl}/api/v1/:path` },
    ];
  },
};

export default nextConfig;
