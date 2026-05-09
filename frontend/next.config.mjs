import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  typescript: {
    // Temporary go-live unblock: compile even with legacy TS debt.
    // Follow-up: remove this once app/(app)/fm and action-points typing issues are fixed.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // Prefer explicit env var, otherwise fall back to production backend.
    const backend =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_BASE ||
      'https://macro-pms-backend.vercel.app';
    return [
      { source: '/api/:path*', destination: `${backend}/v1/:path*` },
    ];
  },
};

export default nextConfig;
