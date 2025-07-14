/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages for server components
  serverExternalPackages: ['@neondatabase/serverless'],
  
  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Environment variables validation
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  
  // Output configuration for Vercel
  output: 'standalone',
}

export default nextConfig