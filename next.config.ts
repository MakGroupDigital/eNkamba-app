import path from 'node:path';
import type { NextConfig } from 'next';
import { BUSINESS_PORTAL_ORIGIN, BUSINESS_ROUTE_ROOTS } from './src/lib/business-portal';

// Le code de functions/src est réutilisé par /api/fn/[name] : « firebase-functions » y est remplacé par un shim,
// et « firebase-admin » doit être celui de l'app (une seule instance, initialisée avec le compte de service).
const FUNCTIONS_SHIM = './src/lib/server/firebase-functions-shim.ts';

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      'firebase-functions': FUNCTIONS_SHIM,
      'firebase-admin': './node_modules/firebase-admin',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase-functions$': path.resolve(process.cwd(), FUNCTIONS_SHIM),
      'firebase-admin$': path.resolve(process.cwd(), 'node_modules/firebase-admin'),
    };
    return config;
  },
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
