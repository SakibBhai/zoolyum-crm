/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Environment variables validation
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  
  // Build optimization
  swcMinify: true,
  
  // Output configuration for Vercel
  output: 'standalone',
}

export default nextConfig