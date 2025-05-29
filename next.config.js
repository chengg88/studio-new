const createNextIntlPlugin = require('next-intl/plugin'); // 使用 require()

const withNextIntl = createNextIntlPlugin(); // 初始化插件

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [],
  },
};

module.exports = withNextIntl(nextConfig); // 使用 module.exports
