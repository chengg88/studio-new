
import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin'; // Import the plugin

const withNextIntl = createNextIntlPlugin(); // Initialize the plugin

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // Added for static export, ensure generateStaticParams is in relevant pages
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for static export with next/image if not using a custom loader
    remotePatterns: [
      // Removed remote patterns for picsum.photos, via.placeholder.com, and placehold.co
      // Ensure all images are now sourced locally (e.g., from the /public folder)
      // or use a custom loader if external images are absolutely necessary and can be proxied.
    ],
  },
};

export default withNextIntl(nextConfig); // Wrap the config with the plugin
