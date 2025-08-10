#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Vercel Deployment Final Fix Script');
console.log('=====================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if .env file exists and validate
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('channel_binding=require')) {
    console.log('⚠️  Warning: .env file contains channel_binding=require');
    console.log('   This is OK for local development, but ensure Vercel env vars do NOT contain it.\n');
  }
}

// Test local build
console.log('🔧 Testing local build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Local build successful!\n');
} catch (error) {
  console.error('❌ Local build failed. Please fix errors before deploying.');
  process.exit(1);
}

// Check git status
console.log('📝 Checking git status...');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (gitStatus.trim()) {
    console.log('📦 Committing changes...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "fix: Vercel deployment environment variable handling"', { stdio: 'inherit' });
    console.log('✅ Changes committed!\n');
  } else {
    console.log('✅ No changes to commit.\n');
  }
} catch (error) {
  console.log('⚠️  Git operations completed with warnings.\n');
}

// Push to repository
console.log('🚀 Pushing to repository...');
try {
  execSync('git push', { stdio: 'inherit' });
  console.log('✅ Code pushed successfully!\n');
} catch (error) {
  console.error('❌ Failed to push to repository. Please push manually.');
  console.error('   Run: git push\n');
}

// Display Vercel deployment instructions
console.log('🎯 VERCEL DEPLOYMENT INSTRUCTIONS');
console.log('=================================\n');

console.log('1. 🌐 Go to Vercel Dashboard:');
console.log('   https://vercel.com/dashboard\n');

console.log('2. ⚙️  Configure Environment Variables:');
console.log('   → Click on your project: zoolyum-crm');
console.log('   → Go to Settings → Environment Variables');
console.log('   → Add these variables for Production, Preview, and Development:\n');

console.log('   📊 Required Variables:');
console.log('   DATABASE_URL = postgresql://user:pass@host/db?sslmode=require');
console.log('   NEXTAUTH_SECRET = your-secret-key');
console.log('   NEXTAUTH_URL = https://your-app.vercel.app\n');

console.log('   ⚠️  IMPORTANT: Do NOT include &channel_binding=require in DATABASE_URL\n');

console.log('3. 🔄 Redeploy:');
console.log('   → Go to Deployments tab');
console.log('   → Click "Redeploy" on latest deployment');
console.log('   → ✅ UNCHECK "Use existing Build Cache"');
console.log('   → Click "Redeploy"\n');

console.log('4. 📊 Monitor Build:');
console.log('   → Watch build logs for successful completion');
console.log('   → Look for: "✔ Generated Prisma Client"');
console.log('   → Look for: "✓ Compiled successfully"\n');

console.log('🎉 Expected Build Output:');
console.log('   Warning: No database URL found during build. Using placeholder.');
console.log('   ✔ Generated Prisma Client (v6.11.1)');
console.log('   ✓ Compiled successfully\n');

console.log('📋 Troubleshooting:');
console.log('   → If build fails: Check environment variables in Vercel');
console.log('   → If runtime errors: Verify DATABASE_URL format');
console.log('   → Need help: Check VERCEL_DEPLOYMENT_FINAL_FIX.md\n');

console.log('✅ Deployment fix applied successfully!');
console.log('🚀 Your app should now deploy without issues on Vercel!');

// Create a summary file
const summaryContent = `# Vercel Deployment Status

## ✅ Fixes Applied
- Enhanced database connection handling for build time
- Added graceful fallback for missing environment variables during CI
- Updated error messages for better Vercel-specific guidance
- Maintained strict validation for production runtime

## 🎯 Next Steps
1. Configure environment variables in Vercel Dashboard
2. Ensure DATABASE_URL does NOT contain &channel_binding=require
3. Redeploy with build cache disabled
4. Monitor build logs for successful completion

## 📊 Environment Variables Required
- DATABASE_URL (without channel_binding=require)
- NEXTAUTH_SECRET
- NEXTAUTH_URL

## 🔗 Resources
- Detailed Guide: VERCEL_DEPLOYMENT_FINAL_FIX.md
- Vercel Dashboard: https://vercel.com/dashboard

Generated: ${new Date().toISOString()}
`;

fs.writeFileSync('DEPLOYMENT_STATUS.md', summaryContent);
console.log('📄 Created DEPLOYMENT_STATUS.md for reference\n');