import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Pour Capacitor, utilisez: output: 'export'
  // Pour Vercel, ne pas utiliser output: 'export' (commenté ci-dessous)
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: false, // Vercel optimise les images automatiquement
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
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
