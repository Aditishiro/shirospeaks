
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
  allowedDevOrigins: [
    'https://9003-firebase-studio-1748341914825.cluster-sumfw3zmzzhzkx4mpvz3ogth4y.cloudworkstations.dev',
    'http://localhost:9003' // Added for local access within the environment
  ],
  webpack: (config, { isServer }) => {
    // Ensure resolve, alias, and fallback objects exist
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.fallback = config.resolve.fallback || {};

    const shimPath = path.resolve(__dirname, 'src/lib/empty-async-hooks-shim.ts');

    // Alias for @opentelemetry/exporter-jaeger to apply to both server and client.
    config.resolve.alias['@opentelemetry/exporter-jaeger'] = shimPath;

    // For client-side bundles, prevent errors when Node.js-specific modules are imported.
    if (!isServer) {
      config.resolve.fallback.async_hooks = false; 
      config.resolve.alias['@opentelemetry/context-async-hooks'] = shimPath;
      config.resolve.alias['@opentelemetry/sdk-trace-node'] = shimPath;
    }

    return config;
  },
  // Add custom headers for CORS in development
  async headers() {
    return [
      {
        // Apply these headers to all routes in development
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          // Dynamically set based on the request's Origin header if it's an allowed dev origin
          // For now, explicitly setting to your Firebase Studio URL.
          // A more dynamic approach might be needed if localhost access also needs these.
          { key: 'Access-Control-Allow-Origin', value: 'https://9003-firebase-studio-1748341914825.cluster-sumfw3zmzzhzkx4mpvz3ogth4y.cloudworkstations.dev' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Action' },
        ],
      },
    ];
  },
};

export default nextConfig;
