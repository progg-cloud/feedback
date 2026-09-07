import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next auto-generates AGENTS.md / CLAUDE.md on dev; we manage our own docs.
  agentRules: false,
};

export default nextConfig;
