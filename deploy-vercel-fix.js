#!/usr/bin/env node

/**
 * Vercel Deployment Fix Script
 * Automates the deployment process with proper error handling
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel Deployment Fix Process...');

// Step 1: Verify local environment
console.log('\n📋 Step 1: Verifying local environment...');

try {
  // Check if .env file exists and has correct format
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('channel_binding=require')) {
      console.log('⚠️  Warning: .env file still contains channel_binding=require');
      console.log('   This has been fixed in the application code, but consider updating .env');
    } else {
      console.log('✅ .env file format is correct');
    }
  }

  // Check if vercel.json is properly configured
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  if (fs.existsSync(vercelConfigPath)) {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    if (vercelConfig.buildCommand && vercelConfig.buildCommand.includes('prisma generate')) {
      console.log('✅ vercel.json build command includes prisma generate');
    } else {
      console.log('❌ vercel.json build command missing prisma generate');
    }
  }

} catch (error) {
  console.log('⚠️  Warning: Could not verify all configuration files');
}

// Step 2: Test local build
console.log('\n🔨 Step 2: Testing local build...');
try {
  console.log('Running: npm run build');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Local build successful');
} catch (error) {
  console.log('❌ Local build failed. Please fix local issues before deploying.');
  console.log('Error:', error.message);
  process.exit(1);
}

// Step 3: Check git status
console.log('\n📦 Step 3: Checking git status...');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.log('📝 Uncommitted changes detected:');
    console.log(gitStatus);
    console.log('\n🔄 Committing changes...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Fix Vercel deployment configuration and database connection"', { stdio: 'inherit' });
  } else {
    console.log('✅ No uncommitted changes');
  }
} catch (error) {
  console.log('⚠️  Warning: Could not check git status');
}

// Step 4: Push to repository
console.log('\n⬆️  Step 4: Pushing to repository...');
try {
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ Code pushed successfully');
} catch (error) {
  console.log('❌ Failed to push code:', error.message);
  console.log('Please push manually: git push origin main');
}

// Step 5: Display deployment instructions
console.log('\n🎯 Step 5: Vercel Deployment Instructions');
console.log('==========================================');
console.log('\n1. Go to Vercel Dashboard: https://vercel.com/dashboard');
console.log('2. Navigate to your project');
console.log('3. Go to Settings → Environment Variables');
console.log('\n4. Ensure these environment variables are set:');
console.log('   ✅ DATABASE_URL (without channel_binding=require)');
console.log('   ✅ NEON_DATABASE_URL (without channel_binding=require)');
console.log('   ✅ NEXTAUTH_SECRET');
console.log('   ✅ NEXTAUTH_URL');
console.log('\n5. Go to Deployments tab');
console.log('6. Click "Redeploy" on the latest deployment');
console.log('7. Uncheck "Use existing Build Cache"');
console.log('8. Click "Redeploy"');

console.log('\n📊 Expected Build Process:');
console.log('   1. Install dependencies');
console.log('   2. Run prisma generate');
console.log('   3. Build Next.js application');
console.log('   4. Collect page data');
console.log('   5. Deploy successfully');

console.log('\n🔍 If deployment fails:');
console.log('   - Check build logs in Vercel dashboard');
console.log('   - Verify environment variables are correct');
console.log('   - Ensure database is accessible');
console.log('   - Review VERCEL_DEPLOYMENT_FIX_COMPLETE.md');

console.log('\n✨ Deployment fix process completed!');
console.log('📖 For detailed troubleshooting, see: VERCEL_DEPLOYMENT_FIX_COMPLETE.md');