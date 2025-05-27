
import type {NextConfig} from 'next';
import path from 'path'; // Import the 'path' module

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
    // Ensure resolve and alias objects exist
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // For client-side bundles, prevent errors when Node.js-specific modules are imported.
    if (!isServer) {
      const shimPath = path.resolve(__dirname, 'src/lib/empty-async-hooks-shim.ts');
      // Alias 'async_hooks' to an empty shim file for client-side bundles.
      config.resolve.alias.async_hooks = shimPath;
      // Alias the problematic OpenTelemetry module to the same empty shim.
      config.resolve.alias['@opentelemetry/context-async-hooks'] = shimPath;
    }

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
