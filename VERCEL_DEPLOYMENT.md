# Vercel Deployment Guide

## Prerequisites

1. **Neon Database**: Ensure you have a Neon PostgreSQL database set up
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **GitHub Repository**: Push your code to GitHub

## Environment Variables Setup

In your Vercel dashboard, add the following environment variables:

### Required Variables

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
NEON_NEON_DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
DIRECT_URL="postgresql://username:password@host/database?sslmode=require"

# Authentication
NEXTAUTH_SECRET="your-secure-random-string-here"
NEXTAUTH_URL="https://your-app-name.vercel.app"

# Environment
NODE_ENV="production"
NEXT_RUNTIME="nodejs"
```

### How to Add Environment Variables in Vercel

1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with the appropriate value
4. Make sure to select the correct environments (Production, Preview, Development)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the repository containing your CRM project

2. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (if project is in root)
   - Build Command: `npm run build`
   - Install Command: `npm install`

3. **Add Environment Variables**:
   - Add all the environment variables listed above
   - Ensure `DATABASE_URL` points to your Neon database

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts to configure your project
```

## Database Setup for Production

### 1. Neon Database Configuration

```bash
# Your Neon connection string should look like:
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 2. Run Database Migrations

After deployment, you may need to run migrations:

```bash
# If using Prisma
npx prisma db push

# Or run custom migration scripts
node run-migration.js
```

## Troubleshooting Common Issues

### 1. Environment Variable Not Found

**Error**: `NEON_DATABASE_URL environment variable is not set`

**Solution**:
- Ensure all environment variables are added in Vercel dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

### 2. Database Connection Issues

**Error**: `Connection refused` or `SSL required`

**Solution**:
- Ensure your Neon database allows connections
- Verify the connection string includes `?sslmode=require`
- Check if your Neon database is in sleep mode

### 3. Build Failures

**Error**: `Build failed` or `Module not found`

**Solution**:
- Check that all dependencies are in `package.json`
- Ensure TypeScript types are correct
- Verify all imports are valid

### 4. Function Timeout

**Error**: `Function execution timed out`

**Solution**:
- Database queries are optimized
- Consider upgrading Vercel plan for longer timeouts
- Implement connection pooling

## Performance Optimization

### 1. Database Connection Pooling

Neon automatically provides connection pooling, but ensure you're using it:

```typescript
// Use pooled connection string
const databaseUrl = process.env.DATABASE_URL // Should include pooler endpoint
```

### 2. Edge Runtime (Optional)

For better performance, consider using Edge Runtime for simple API routes:

```typescript
export const runtime = 'edge'
```

### 3. Static Generation

Use static generation where possible:

```typescript
export const revalidate = 3600 // Revalidate every hour
```

## Monitoring and Logs

### 1. Vercel Analytics

Enable Vercel Analytics in your dashboard for performance monitoring.

### 2. Function Logs

View function logs in Vercel dashboard:
- Go to **Functions** tab
- Click on any function to view logs
- Monitor for errors and performance issues

### 3. Database Monitoring

Monitor your Neon database:
- Check connection count
- Monitor query performance
- Set up alerts for high usage

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Database Access**: Ensure database is only accessible via SSL
3. **API Routes**: Implement proper authentication and validation
4. **CORS**: Configure CORS properly for your domain

## Custom Domain Setup

1. **Add Domain in Vercel**:
   - Go to **Settings** → **Domains**
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**:
   - Update `NEXTAUTH_URL` to your custom domain
   - Redeploy the application

## Continuous Deployment

Vercel automatically deploys when you push to your main branch:

1. **Automatic Deployments**: Enabled by default
2. **Preview Deployments**: Created for pull requests
3. **Production Deployments**: Triggered by pushes to main branch

## Support

If you encounter issues:

1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Review Neon documentation: [neon.tech/docs](https://neon.tech/docs)
3. Check the Vercel community: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)