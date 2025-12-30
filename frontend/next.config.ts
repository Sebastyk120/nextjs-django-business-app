import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        // Rewrite with trailing slash
        source: '/django-api/:path*/',
        destination: 'http://localhost:8000/:path*/',
      },
      {
        // Rewrite without trailing slash
        source: '/django-api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
