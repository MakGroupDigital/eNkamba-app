import type { NextConfig } from 'next';
import { BUSINESS_PORTAL_ORIGIN, BUSINESS_ROUTE_ROOTS } from './src/lib/business-portal';

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Mode serveur pour Capacitor - charge depuis URL de production
  // output: 'export', // Désactivé car incompatible avec les routes API
  trailingSlash: true,
  async redirects() {
    return [
      ...BUSINESS_ROUTE_ROOTS.map((path) => ({ source: `${path}/:path*`, destination: `${BUSINESS_PORTAL_ORIGIN}${path}/:path*`, permanent: false })),
      { source: '/dashboard/nkampa/seller', destination: `${BUSINESS_PORTAL_ORIGIN}/dashboard/nkampa/seller`, permanent: false },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
