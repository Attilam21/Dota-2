const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.opendota.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = withBundleAnalyzer(nextConfig)
