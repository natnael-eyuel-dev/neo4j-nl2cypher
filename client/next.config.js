/** @type {import('next').NextConfig} */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google OAuth profile pictures
  },
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Neo4j Natural Language Query System',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`, // use top-level variable
      },
      {
        source: '/auth/:path*',
        destination: `${API_URL}/auth/:path*`,
      },
    ];
  },
  webpack: (config) => {
    // Handle D3.js and other libraries that might not work with SSR
    config.externals = config.externals || [];
    config.externals.push({
      d3: 'd3',
      'vis-network': 'vis-network',
      'vis-data': 'vis-data',
    });
    
    return config;
  },
};

module.exports = nextConfig;