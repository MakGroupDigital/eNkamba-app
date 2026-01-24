import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Pour Capacitor avec URL externe, pas besoin d'export statique
  // L'APK chargera directement depuis https://www.enkamba.io
  // output: 'export', // Désactivé temporairement pour le build - à réactiver pour Capacitor
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Requis pour l'export statique Capacitor
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
