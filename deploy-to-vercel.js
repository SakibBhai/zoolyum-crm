#!/usr/bin/env node

/**
 * Vercel Deployment Helper Script
 * 
 * This script helps automate the deployment process to Vercel
 * and ensures all required environment variables are properly configured.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkRequiredFiles() {
  log('\n🔍 Checking required files...', 'blue');
  
  const requiredFiles = [
    'package.json',
    'next.config.mjs',
    'vercel.json',
    '.env.local'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    log(`❌ Missing required files: ${missingFiles.join(', ')}`, 'red');
    return false;
  }
  
  log('✅ All required files present', 'green');
  return true;
}

function checkEnvironmentVariables() {
  log('\n🔍 Checking environment variables...', 'blue');
  
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEON_NEON_DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log(`❌ Missing environment variables: ${missingVars.join(', ')}`, 'red');
    log('📝 Please check your .env.local file', 'yellow');
    return false;
  }
  
  log('✅ All required environment variables present', 'green');
  return true;
}

function testDatabaseConnection() {
  log('\n🔍 Testing database connection...', 'blue');
  
  try {
    execSync('node test-db-connection.js', { stdio: 'pipe' });
    log('✅ Database connection successful', 'green');
    return true;
  } catch (error) {
    log('❌ Database connection failed', 'red');
    log('📝 Please check your database URL and ensure Neon database is active', 'yellow');
    return false;
  }
}

function runBuild() {
  log('\n🔨 Running build process...', 'blue');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('✅ Build successful', 'green');
    return true;
  } catch (error) {
    log('❌ Build failed', 'red');
    log('📝 Please fix build errors before deploying', 'yellow');
    return false;
  }
}

function deployToVercel() {
  log('\n🚀 Deploying to Vercel...', 'blue');
  
  try {
    // Check if Vercel CLI is installed
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    log('❌ Vercel CLI not found', 'red');
    log('📝 Install with: npm i -g vercel', 'yellow');
    return false;
  }
  
  try {
    execSync('vercel --prod', { stdio: 'inherit' });
    log('✅ Deployment successful', 'green');
    return true;
  } catch (error) {
    log('❌ Deployment failed', 'red');
    return false;
  }
}

function showEnvironmentVariablesGuide() {
  log('\n📋 Environment Variables Setup Guide', 'cyan');
  log('=' .repeat(50), 'cyan');
  log('\nAdd these variables to your Vercel project:', 'yellow');
  log('\n1. Go to your Vercel project dashboard');
  log('2. Navigate to Settings → Environment Variables');
  log('3. Add the following variables:\n');
  
  const envVars = [
    'DATABASE_URL',
    'NEON_NEON_DATABASE_URL',
    'NEON_DATABASE_URL',
    'DIRECT_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NODE_ENV=production',
    'NEXT_RUNTIME=nodejs'
  ];
  
  envVars.forEach(varName => {
    log(`   ${varName}`, 'green');
  });
  
  log('\n📝 For detailed setup instructions, see:', 'yellow');
  log('   - VERCEL_DEPLOYMENT_FIX.md');
  log('   - VERCEL_ENV_TEMPLATE.md');
}

function main() {
  log('🚀 Vercel Deployment Helper', 'magenta');
  log('=' .repeat(30), 'magenta');
  
  const checks = [
    checkRequiredFiles,
    checkEnvironmentVariables,
    testDatabaseConnection,
    runBuild
  ];
  
  // Run all checks
  for (const check of checks) {
    if (!check()) {
      log('\n❌ Pre-deployment checks failed', 'red');
      showEnvironmentVariablesGuide();
      process.exit(1);
    }
  }
  
  log('\n✅ All pre-deployment checks passed!', 'green');
  
  // Ask user if they want to deploy
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n🚀 Deploy to Vercel now? (y/N): ', (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      if (deployToVercel()) {
        log('\n🎉 Deployment completed successfully!', 'green');
        log('\n📝 Next steps:', 'yellow');
        log('1. Check your Vercel dashboard for deployment status');
        log('2. Test your deployed application');
        log('3. Monitor function logs for any errors');
      } else {
        log('\n❌ Deployment failed', 'red');
        showEnvironmentVariablesGuide();
        process.exit(1);
      }
    } else {
      log('\n📝 Deployment skipped. Run this script again when ready to deploy.', 'yellow');
      showEnvironmentVariablesGuide();
    }
  });
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  checkRequiredFiles,
  checkEnvironmentVariables,
  testDatabaseConnection,
  runBuild,
  deployToVercel
};