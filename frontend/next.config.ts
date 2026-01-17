import type { NextConfig } from "next";

// Backend API URL - defaults to localhost for development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Parse the URL to extract hostname and protocol
const apiUrlParts = new URL(API_URL);

const nextConfig: NextConfig = {
  // Temporarily ignore TypeScript errors during build
  // TODO: Fix TypeScript errors and remove this
  typescript: {
    ignoreBuildErrors: true,
  },
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
      {
        protocol: 'https',
        hostname: 'heavens-server-private.up.railway.app',
        pathname: '/media/**',
      },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: `${API_URL}/media/:path*`,
      },
      {
        // Rewrite with trailing slash
        source: '/django-api/:path*/',
        destination: `${API_URL}/:path*/`,
      },
      {
        // Rewrite without trailing slash
        source: '/django-api/:path*',
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;

