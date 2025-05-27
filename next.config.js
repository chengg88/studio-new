
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
    unoptimized: true, // Kept for flexibility, can be removed if a custom loader is used
    remotePatterns: [
      // No remote patterns - all images should be local
    ],
  },
};

export default withNextIntl(nextConfig); // Wrap the config with the plugin
