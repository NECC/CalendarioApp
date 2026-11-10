import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Identifica cada deploy. A app compara-o com o de /api/version para saber que há
  // uma versão nova, porque no iPhone a app instalada nunca recarrega sozinha.
  env: {
    APP_VERSION:
      process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now()),
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // O browser procura sempre uma nova versão do service worker, que só pode
  // carregar código deste site.
  async headers() {
    return [
      {
        // Proteções básicas em todas as páginas: não pode ser metida dentro de outro
        // site (clickjacking) e o browser não adivinha tipos de ficheiro.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
