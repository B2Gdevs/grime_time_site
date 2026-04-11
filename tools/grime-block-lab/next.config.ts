import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "esbuild",
    "vite",
    "@tailwindcss/postcss",
    "@tailwindcss/node",
    "@tailwindcss/oxide",
    "lightningcss",
  ],
  turbopack: {
    root: dirname,
  },
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    const vitePort = Number(process.env.WORKBENCH_VITE_PORT ?? "3173") || 3173;
    const destinationPrefix = `http://127.0.0.1:${vitePort}`;

    return [
      {
        source: "/__workbench_hmr/:path*",
        destination: `${destinationPrefix}/__workbench_hmr/:path*`,
      },
    ];
  },
};

export default nextConfig;
