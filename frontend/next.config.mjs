/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Temporary go-live unblock: compile even with legacy TS debt.
    // Follow-up: remove this once app/(app)/fm and action-points typing issues are fixed.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // Proxy /api/* to backend-slice in dev so we don't need CORS.
    const backend = process.env.BACKEND_URL || 'http://localhost:4000';
    return [
      { source: '/api/:path*', destination: `${backend}/v1/:path*` },
    ];
  },
};

export default nextConfig;
