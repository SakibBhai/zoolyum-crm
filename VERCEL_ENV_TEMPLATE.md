# Vercel Environment Variables Template

## Required Environment Variables for Vercel Deployment

Copy these environment variables to your Vercel project dashboard:
**Settings → Environment Variables**

### Database Configuration
```bash
# Primary database URL (replace with your actual Neon database URL)
DATABASE_URL=postgresql://neondb_owner:npg_gfXwAK8CL2tb@ep-cool-resonance-adrhpfph-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Legacy Neon database URL (same as DATABASE_URL for compatibility)
NEON_NEON_DATABASE_URL=postgresql://neondb_owner:npg_gfXwAK8CL2tb@ep-cool-resonance-adrhpfph-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Alternative Neon database URL (same as DATABASE_URL for compatibility)
NEON_DATABASE_URL=postgresql://neondb_owner:npg_gfXwAK8CL2tb@ep-cool-resonance-adrhpfph-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Direct URL for migrations (same as DATABASE_URL)
DIRECT_URL=postgresql://neondb_owner:npg_gfXwAK8CL2tb@ep-cool-resonance-adrhpfph-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Authentication Configuration
```bash
# NextAuth secret (generate a secure random string)
NEXTAUTH_SECRET=your-secure-random-string-minimum-32-characters-here

# NextAuth URL (replace with your actual Vercel app URL)
NEXTAUTH_URL=https://your-app-name.vercel.app

# JWT Secret (generate a secure random string)
JWT_SECRET=your-jwt-secret-minimum-32-characters-here
```

### Application Configuration
```bash
# Environment
NODE_ENV=production

# Next.js Runtime
NEXT_RUNTIME=nodejs

# Public app URL (replace with your actual Vercel app URL)
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

### Optional Configuration
```bash
# File upload settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# API configuration
API_RATE_LIMIT=100
API_TIMEOUT=30000

# Logging
LOG_LEVEL=info
ENABLE_QUERY_LOGGING=false

# Security
CORS_ORIGIN=https://your-app-name.vercel.app
CSRF_SECRET=your-csrf-secret-minimum-32-characters

# Feature flags
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
ENABLE_FILE_UPLOAD=true
```

## How to Add These Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to your Vercel project dashboard**
2. **Click on "Settings" tab**
3. **Click on "Environment Variables" in the sidebar**
4. **For each variable above:**
   - Click "Add New"
   - Enter the variable name (e.g., `DATABASE_URL`)
   - Enter the variable value
   - Select environments: **Production**, **Preview**, **Development**
   - Click "Save"

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add DATABASE_URL production
vercel env add NEON_NEON_DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... continue for all variables
```

## Important Notes

### Database URL Format
Your Neon database URL should follow this format:
```
postgresql://username:password@host/database?sslmode=require&channel_binding=require
```

### Security Best Practices
1. **Never commit these values to version control**
2. **Use strong, unique secrets for NEXTAUTH_SECRET and JWT_SECRET**
3. **Regularly rotate database credentials**
4. **Monitor access logs**

### Environment Scope
Make sure to add variables to all relevant environments:
- ✅ **Production** (required for live deployment)
- ✅ **Preview** (for preview deployments)
- ✅ **Development** (for local development with Vercel)

## Verification Steps

### 1. Check Variables Are Set
```bash
# Using Vercel CLI
vercel env ls
```

### 2. Test Deployment
1. Push changes to your repository
2. Monitor build logs in Vercel dashboard
3. Check for any remaining environment variable errors

### 3. Test Database Connection
1. Visit your deployed app
2. Try to load data from the database
3. Check Vercel function logs for any database errors

## Troubleshooting

### Common Issues

1. **Variable not found during build**
   - Ensure variable is added to all environments
   - Redeploy after adding variables

2. **Database connection fails**
   - Verify Neon database is active
   - Check connection string format
   - Ensure SSL is enabled

3. **Authentication errors**
   - Verify NEXTAUTH_URL matches your domain
   - Ensure NEXTAUTH_SECRET is at least 32 characters

### Getting Help

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Neon Database Documentation](https://neon.tech/docs)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)

---

**Quick Checklist:**
- [ ] All database URLs point to your Neon database
- [ ] NEXTAUTH_URL matches your Vercel app URL
- [ ] All secrets are secure and at least 32 characters
- [ ] Variables are added to Production environment
- [ ] Application redeployed after adding variables