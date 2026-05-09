/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy /api/* to backend-slice in dev so we don't need CORS.
    const backend = process.env.BACKEND_URL || 'http://localhost:4000';
    return [
      { source: '/api/:path*', destination: `${backend}/v1/:path*` },
    ];
  },
};

export default nextConfig;
