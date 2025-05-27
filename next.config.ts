
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
  // Add allowedDevOrigins to permit requests from specific origins during development
  allowedDevOrigins: ['https://9003-firebase-studio-1748341914825.cluster-sumfw3zmzzhzkx4mpvz3ogth4y.cloudworkstations.dev'],
  webpack: (config, { isServer }) => {
    // Ensure resolve, alias, and fallback objects exist
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.fallback = config.resolve.fallback || {};

    // For client-side bundles, prevent errors when Node.js-specific modules are imported.
    if (!isServer) {
      const shimPath = path.resolve(__dirname, 'src/lib/empty-async-hooks-shim.ts');
      
      // Use fallback 'false' for Node.js core modules like 'async_hooks' to prevent resolution errors
      config.resolve.fallback.async_hooks = false; 
      
      // Alias problematic OpenTelemetry modules to the same empty shim.
      // This attempts to prevent these server-side modules from being bundled entirely on the client.
      config.resolve.alias['@opentelemetry/context-async-hooks'] = shimPath;
      config.resolve.alias['@opentelemetry/sdk-trace-node'] = shimPath;
    }

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
