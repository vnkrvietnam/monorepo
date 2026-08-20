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
    // alias "@vnkr/ui-kit" → "@vnkrvietnam/ui-kit" (legacy import path used in pages)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@vnkr/ui-kit": path.resolve(__dirname, "../../packages/ui-kit/src/index.ts"),
    };
    return config;
  },
};

export default nextConfig;
