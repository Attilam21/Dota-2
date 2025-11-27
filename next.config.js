/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Redirect demo diretto a pagina demo
        {
          source: '/demo/:path*',
          destination: '/demo/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;

