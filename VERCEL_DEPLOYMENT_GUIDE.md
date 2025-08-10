# Vercel Deployment Guide

## Step-by-Step Deployment Instructions

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Fix vercel.json and prepare for deployment"
git push origin main
```

### 2. Configure Environment Variables in Vercel Dashboard

**IMPORTANT**: Environment variables must be set in Vercel's dashboard, not in the vercel.json file.

#### Go to Vercel Dashboard:
1. Visit [vercel.com](https://vercel.com)
2. Navigate to your project
3. Go to **Settings** → **Environment Variables**

#### Add these required variables:

**Database Configuration:**
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_gfXwAK8CL2tb@ep-cool-resonance-adrhpfph-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Environments: Production, Preview, Development
```

```
Name: NEON_DATABASE_URL
Value: postgresql://neondb_owner:npg_gfXwAK8CL2tb@ep-cool-resonance-adrhpfph-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Environments: Production, Preview, Development
```

```
Name: NEON_NEON_DATABASE_URL
Value: postgresql://neondb_owner:npg_gfXwAK8CL2tb@ep-cool-resonance-adrhpfph-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Environments: Production, Preview, Development
```

**Authentication Configuration:**
```
Name: NEXTAUTH_SECRET
Value: your-secure-random-string-minimum-32-characters-here
Environments: Production, Preview, Development
```

```
Name: JWT_SECRET
Value: your-jwt-secret-minimum-32-characters-here
Environments: Production, Preview, Development
```

```
Name: NEXTAUTH_URL
Value: https://your-app-name.vercel.app
Environments: Production, Preview
```

**Application Configuration:**
```
Name: NODE_ENV
Value: production
Environments: Production, Preview
```

```
Name: NEXT_PUBLIC_APP_URL
Value: https://your-app-name.vercel.app
Environments: Production, Preview, Development
```

### 3. Generate Secure Secrets

For NEXTAUTH_SECRET and JWT_SECRET, generate secure random strings:

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL

Replace `your-app-name` with your actual Vercel app name:
- If your Vercel app is `zoolyum-crm`, use `https://zoolyum-crm.vercel.app`
- Check your Vercel dashboard for the exact URL

### 5. Redeploy

After setting all environment variables:
1. Go to **Deployments** tab in Vercel dashboard
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

### 6. Verify Deployment

Check the build logs in Vercel dashboard to ensure:
- ✅ Environment variables are found
- ✅ Database connection is successful
- ✅ Build completes without errors

## Troubleshooting

### If you still get "Database URL not found" error:
1. Double-check all environment variable names are exactly correct
2. Ensure variables are set for the correct environments (Production, Preview)
3. Try redeploying after setting variables
4. Check build logs for specific error messages

### Common Issues:
- **Case sensitivity**: Variable names must match exactly
- **Scope**: Ensure variables are set for Production and Preview environments
- **URL format**: Database URL must include all connection parameters
- **Secrets**: NEXTAUTH_SECRET and JWT_SECRET must be at least 32 characters

## Files Modified
- ✅ `vercel.json` - Simplified configuration
- ✅ Environment variables moved to Vercel dashboard
- ✅ JSON syntax errors fixed

Your deployment should now work successfully! 🚀