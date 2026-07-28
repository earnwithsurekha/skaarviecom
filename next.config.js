/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
  // Proxy /uploads requests to backend server
  async rewrites() {
    return [
      // Admin dashboard endpoints (direct to backend with auth header)
      {
        source: '/api/admin/dashboard/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/admin/dashboard/:path*`,
      },
      // Admin list endpoints (direct to backend with auth header)
      {
        source: '/api/admin/products',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/admin/products`,
      },
      {
        source: '/api/admin/manufacturers/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/admin/manufacturers/:path*`,
      },
      {
        source: '/api/admin/resellers/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/admin/resellers/:path*`,
      },
      {
        source: '/api/admin/orders/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/admin/orders/:path*`,
      },
      {
        source: '/api/admin/categories/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/admin/categories/:path*`,
      },
      {
        source: '/api/admin/wallets/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/admin/wallets/:path*`,
      },
      {
        source: '/api/admin/withdrawals/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/admin/withdrawals/:path*`,
      },
      {
        source: '/api/admin/settlements/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/admin/settlements/:path*`,
      },
      // Customer API routes (direct to backend with auth header)
      {
        source: '/api/customer/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/customer/:path*`,
      },
      // Public API routes (direct to backend)
      {
        source: '/api/products/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/products/:path*`,
      },
      {
        source: '/api/categories/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/categories/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/uploads/:path*`,
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
