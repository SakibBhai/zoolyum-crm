# Environment Variables Setup Guide

## Overview

This guide explains how to configure environment variables for the Zoolyum CRM application. Proper environment configuration is crucial for database connectivity, authentication, and feature functionality.

## Quick Setup

1. **Copy the template file:**
   ```bash
   cp .env.template .env.local
   ```

2. **Edit `.env.local` with your actual values**

3. **Verify your setup by running:**
   ```bash
   npm run dev
   ```

## Required Environment Variables

### 🗄️ Database Configuration

**DATABASE_URL** (Required)
- Your primary Neon PostgreSQL connection string
- Format: `postgresql://username:password@host:port/database?sslmode=require&channel_binding=require`
- Example: `postgresql://user:pass@ep-cool-lab-123456.us-east-1.aws.neon.tech/neondb?sslmode=require`

### 🔐 Authentication

**NEXTAUTH_SECRET** (Required)
- Minimum 32 characters for JWT signing
- Generate with: `openssl rand -base64 32`

**NEXTAUTH_URL** (Required)
- Your application URL
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

### 🌐 Application URLs

**NEXT_PUBLIC_APP_URL** (Required)
- Public-facing application URL
- Must match NEXTAUTH_URL

**NEXT_PUBLIC_API_URL** (Required)
- API endpoint base URL
- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

## Optional Configurations

### 📧 Email Service (SMTP)

For notifications and user communications:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="your-email@gmail.com"
```

### 💳 Payment Integration (Stripe)

For invoice payments and subscriptions:

```env
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### 🔑 OAuth Providers

**Google OAuth:**
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**GitHub OAuth:**
```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### ☁️ File Storage (AWS S3)

For document and avatar uploads:

```env
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket-name"
```

### 📊 Analytics & Monitoring

**Sentry Error Tracking:**
```env
SENTRY_DSN="https://your-sentry-dsn"
```

**Google Analytics:**
```env
NEXT_PUBLIC_GA_TRACKING_ID="GA-XXXXXXXXX"
```

## Environment-Specific Setup

### Development Environment

```env
NODE_ENV="development"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
LOG_LEVEL="debug"
ENABLE_QUERY_LOGGING="true"
```

### Production Environment

```env
NODE_ENV="production"
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://yourdomain.com/api"
LOG_LEVEL="error"
ENABLE_QUERY_LOGGING="false"
```

## Security Best Practices

### 🔒 Secret Generation

Generate secure secrets using:

```bash
# For NEXTAUTH_SECRET, JWT_SECRET, CSRF_SECRET
openssl rand -base64 32

# Alternative using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 🛡️ Environment File Security

- **Never commit `.env.local` to version control**
- Add `.env.local` to your `.gitignore`
- Use different secrets for each environment
- Rotate secrets regularly in production
- Use environment-specific service accounts

### 🔐 Production Deployment

For Vercel deployment:

1. Set environment variables in Vercel dashboard
2. Use Vercel CLI: `vercel env add`
3. Import from `.env.local`: `vercel env pull`

## Troubleshooting

### Common Issues

**Database Connection Errors:**
- Verify DATABASE_URL format
- Check Neon database status
- Ensure SSL mode is enabled

**Authentication Issues:**
- Confirm NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your domain
- Check OAuth provider configurations

**API Endpoint Errors:**
- Ensure NEXT_PUBLIC_API_URL is correct
- Verify CORS_ORIGIN settings
- Check API rate limiting configuration

### Validation Commands

```bash
# Test database connection
npm run db:test

# Validate environment variables
npm run env:check

# Run health checks
npm run health:check
```

## Feature Flags

Control application features with these flags:

```env
ENABLE_ANALYTICS="true"          # Google Analytics integration
ENABLE_NOTIFICATIONS="true"      # Email notifications
ENABLE_FILE_UPLOAD="true"        # File upload functionality
```

## Support

For additional help:
- Check the main [README.md](./README.md)
- Review [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- Consult [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Note:** Always use `.env.local` for local development and never commit sensitive environment variables to version control.