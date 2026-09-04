import type { NextConfig } from "next";
const config: NextConfig = {
  basePath: "/admin",
  transpilePackages: [
    "@formation-zero/domain",
    "@formation-zero/ui",
    "@formation-zero/knowledge",
  ],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), camera=(), microphone=()",
          },
        ],
      },
    ];
  },
};
export default config;
