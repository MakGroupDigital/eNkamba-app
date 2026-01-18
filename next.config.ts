import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Pour Capacitor, décommentez: output: 'export' et images.unoptimized: true
  // Pour Vercel, laissez ces lignes commentées (Vercel optimise automatiquement)
  // output: 'export',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false, // Vercel optimise les images automatiquement
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
