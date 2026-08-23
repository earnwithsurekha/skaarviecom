/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker deployment
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'localhost',
      's3.amazonaws.com',
      'skaarvi-marketplace.s3.amazonaws.com',
      'skaarvi-marketplace.s3.ap-south-1.amazonaws.com',
      'skaarvi-reseller-files.s3.amazonaws.com',
      'skaarvi-reseller-files.s3.ap-south-1.amazonaws.com'
    ],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'skaarvi-reseller-files.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'skaarvi-reseller-files.s3.ap-south-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  // Proxy /uploads requests to backend server
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      // Admin dashboard endpoints (direct to backend with auth header)
      {
        source: '/api/admin/dashboard/:path*',
        destination: `${apiUrl}/api/admin/dashboard/:path*`,
      },
      // Admin list endpoints (direct to backend with auth header)
      {
        source: '/api/admin/products',
        destination: `${apiUrl}/api/admin/products`,
      },
      {
        source: '/api/admin/manufacturers/:path*',
        destination: `${apiUrl}/api/admin/manufacturers/:path*`,
      },
      {
        source: '/api/admin/resellers/:path*',
        destination: `${apiUrl}/api/admin/resellers/:path*`,
      },
      {
        source: '/api/admin/orders/:path*',
        destination: `${apiUrl}/api/admin/orders/:path*`,
      },
      {
        source: '/api/admin/categories/:path*',
        destination: `${apiUrl}/api/admin/categories/:path*`,
      },
      {
        source: '/api/admin/wallets/:path*',
        destination: `${apiUrl}/api/admin/wallets/:path*`,
      },
      {
        source: '/api/admin/withdrawals/:path*',
        destination: `${apiUrl}/api/admin/withdrawals/:path*`,
      },
      {
        source: '/api/admin/settlements/:path*',
        destination: `${apiUrl}/api/admin/settlements/:path*`,
      },
      // Customer API routes (direct to backend with auth header)
      {
        source: '/api/customer/:path*',
        destination: `${apiUrl}/api/customer/:path*`,
      },
      // Public API routes (direct to backend)
      {
        source: '/api/products/:path*',
        destination: `${apiUrl}/api/products/:path*`,
      },
      {
        source: '/api/categories/:path*',
        destination: `${apiUrl}/api/categories/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
  // Webpack configuration for handling node modules in API routes
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, 'mysql2', 'sequelize'];
    }
    return config;
  },
}

module.exports = nextConfig
