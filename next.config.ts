
import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin'; // Import the plugin

const withNextIntl = createNextIntlPlugin(); // Initialize the plugin

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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'via.placeholder.com', // Add placeholder.com hostname
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig); // Wrap the config with the plugin
