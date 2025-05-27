import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
    ],
  },
  webpack: (config, { isServer }) => {
    // For client-side bundles, prevent errors when Node.js-specific modules are imported.
    if (!isServer) {
      // Ensure resolve and alias objects exist
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};

      // Alias 'async_hooks' to false for client-side bundles
      // This effectively makes require('async_hooks') return false on the client.
      config.resolve.alias.async_hooks = false;
    }

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
