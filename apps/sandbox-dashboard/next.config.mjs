import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
  transpilePackages: ["@vnkrvietnam/ui-kit"],
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@vnkr/ui-kit":    path.resolve(__dirname, "../../packages/ui-kit/src/index.ts"),
      "@vnkr/types":     path.resolve(__dirname, "../../packages/types/src/index.ts"),
      "@vnkr/config":    path.resolve(__dirname, "../../packages/config/src/index.ts"),
      "@vnkr/core-sdk":  path.resolve(__dirname, "../../packages/core-sdk/src/index.ts"),
    };
    return config;
  },
};

export default nextConfig;
