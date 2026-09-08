import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next auto-generates AGENTS.md / CLAUDE.md on dev; we manage our own docs.
  agentRules: false,

  // Faster nav: only re-render the changed route segment on the client.
  experimental: {
    optimizePackageImports: ["recharts"],
  },

  // The logo is tiny and already optimised; skip the image pipeline.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
