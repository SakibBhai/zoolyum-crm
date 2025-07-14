# Vercel Deployment Guide

## Prerequisites

1. **Neon PostgreSQL Database**
   - Create a database at [neon.tech](https://neon.tech)
   - Copy your connection string

2. **Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Install Vercel CLI: `npm i -g vercel`

## Environment Variables Setup

### Required Environment Variables

In your Vercel project settings, add these environment variables:

```bash
# Database (Required)
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Authentication (Required)
NEXTAUTH_SECRET="your-random-secret-key"
NEXTAUTH_URL="https://your-app.vercel.app"

# Optional
NODE_ENV="production"
```

### Setting Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable for all environments (Production, Preview, Development)

## Deployment Steps

### Option 1: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically deploy on every push

### Option 2: Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Database Setup

After deployment, you need to set up your database schema:

```bash
# Push schema to production database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure all environment variables are set
   - Check that `DATABASE_URL` is correctly formatted
   - Verify Prisma schema is valid

2. **Database Connection Issues**
   - Ensure your Neon database allows connections
   - Check connection string format
   - Verify SSL mode is set to `require`

3. **API Route Errors**
   - Check server logs in Vercel dashboard
   - Ensure all imports are correct
   - Verify API routes follow Next.js 15 patterns

### Build Configuration

The project includes optimized build settings in:
- `next.config.mjs` - Next.js configuration
- `vercel.json` - Vercel-specific settings
- `package.json` - Build scripts with Prisma generation

### Performance Optimization

- Database connection pooling is handled by Neon
- Static assets are optimized by Vercel
- API routes use serverless functions
- Images are optimized for production

## Post-Deployment

1. **Test all functionality**
   - Create, read, update, delete operations
   - Authentication flows
   - API endpoints

2. **Monitor performance**
   - Check Vercel analytics
   - Monitor database performance in Neon dashboard

3. **Set up monitoring**
   - Configure error tracking (Sentry recommended)
   - Set up uptime monitoring

## Support

If you encounter issues:
1. Check Vercel build logs
2. Review Neon database logs
3. Verify environment variables
4. Test locally with production environment variables