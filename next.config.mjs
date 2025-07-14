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
    NEON_NEON_DATABASE_URL: process.env.NEON_NEON_DATABASE_URL || process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
  
  // Experimental features for better performance
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
  
  // Webpack configuration for better bundling
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@neondatabase/serverless')
    }
    return config
  },
}

export default nextConfig