#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Environment Setup Script for Zoolyum CRM
 * Helps users quickly configure their environment variables
 */

class EnvSetup {
  constructor() {
    this.templateFile = '.env.template';
    this.envFile = '.env.local';
    this.projectRoot = process.cwd();
  }

  /**
   * Generate a secure random secret
   * @param {number} length - Length of the secret in bytes
   * @returns {string} Base64 encoded secret
   */
  generateSecret(length = 32) {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Check if required files exist
   * @returns {object} Status of required files
   */
  checkFiles() {
    const templateExists = fs.existsSync(path.join(this.projectRoot, this.templateFile));
    const envExists = fs.existsSync(path.join(this.projectRoot, this.envFile));
    
    return { templateExists, envExists };
  }

  /**
   * Copy template to .env.local with generated secrets
   */
  async setupEnvironment() {
    console.log('🚀 Setting up Zoolyum CRM Environment Variables\n');

    const { templateExists, envExists } = this.checkFiles();

    if (!templateExists) {
      console.error('❌ Error: .env.template file not found!');
      console.log('Please ensure you have the .env.template file in your project root.');
      process.exit(1);
    }

    if (envExists) {
      console.log('⚠️  .env.local already exists!');
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise((resolve) => {
        readline.question('Do you want to overwrite it? (y/N): ', (answer) => {
          readline.close();
          if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('Setup cancelled. Your existing .env.local was preserved.');
            process.exit(0);
          }
          resolve(this.createEnvFile());
        });
      });
    } else {
      return this.createEnvFile();
    }
  }

  /**
   * Create the .env.local file with generated secrets
   */
  createEnvFile() {
    try {
      // Read template
      const templatePath = path.join(this.projectRoot, this.templateFile);
      let envContent = fs.readFileSync(templatePath, 'utf8');

      // Generate secrets
      const nextAuthSecret = this.generateSecret(32);
      const jwtSecret = this.generateSecret(32);
      const csrfSecret = this.generateSecret(32);

      // Replace placeholder values with generated secrets
      envContent = envContent
        .replace('your-nextauth-secret-key-minimum-32-characters', nextAuthSecret)
        .replace('your-jwt-secret-key-minimum-32-characters', jwtSecret)
        .replace('your-csrf-secret-minimum-32-characters', csrfSecret);

      // Write to .env.local
      const envPath = path.join(this.projectRoot, this.envFile);
      fs.writeFileSync(envPath, envContent);

      console.log('✅ Successfully created .env.local with generated secrets!\n');
      
      this.displayNextSteps();
      
    } catch (error) {
      console.error('❌ Error creating .env.local:', error.message);
      process.exit(1);
    }
  }

  /**
   * Display next steps for the user
   */
  displayNextSteps() {
    console.log('📋 Next Steps:');
    console.log('1. Edit .env.local and add your database URL:');
    console.log('   DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"\n');
    
    console.log('2. Required variables to configure:');
    console.log('   • DATABASE_URL (Neon PostgreSQL connection)');
    console.log('   • NEXTAUTH_URL (your app URL)');
    console.log('   • NEXT_PUBLIC_APP_URL (public app URL)');
    console.log('   • NEXT_PUBLIC_API_URL (API endpoint URL)\n');
    
    console.log('3. Optional integrations:');
    console.log('   • SMTP settings for email notifications');
    console.log('   • OAuth providers (Google, GitHub)');
    console.log('   • Payment processing (Stripe)');
    console.log('   • File storage (AWS S3)');
    console.log('   • Analytics (Google Analytics, Sentry)\n');
    
    console.log('4. Start the development server:');
    console.log('   npm run dev\n');
    
    console.log('📖 For detailed setup instructions, see ENV_SETUP.md');
    console.log('🔒 Remember: Never commit .env.local to version control!');
  }

  /**
   * Validate existing environment configuration
   */
  validateEnvironment() {
    console.log('🔍 Validating Environment Configuration\n');

    const { envExists } = this.checkFiles();
    
    if (!envExists) {
      console.log('❌ .env.local not found. Run setup first.');
      return false;
    }

    try {
      // Load environment variables
      require('dotenv').config({ path: path.join(this.projectRoot, this.envFile) });

      const requiredVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'NEXT_PUBLIC_APP_URL',
        'NEXT_PUBLIC_API_URL'
      ];

      const missingVars = [];
      const configuredVars = [];

      requiredVars.forEach(varName => {
        if (!process.env[varName] || process.env[varName].includes('your-') || process.env[varName].includes('username:password')) {
          missingVars.push(varName);
        } else {
          configuredVars.push(varName);
        }
      });

      console.log('✅ Configured variables:');
      configuredVars.forEach(varName => {
        console.log(`   • ${varName}`);
      });

      if (missingVars.length > 0) {
        console.log('\n⚠️  Variables needing configuration:');
        missingVars.forEach(varName => {
          console.log(`   • ${varName}`);
        });
        console.log('\n📖 See ENV_SETUP.md for configuration details.');
        return false;
      }

      console.log('\n🎉 All required environment variables are configured!');
      return true;

    } catch (error) {
      console.error('❌ Error validating environment:', error.message);
      return false;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const setup = new EnvSetup();
  const command = process.argv[2];

  switch (command) {
    case 'validate':
    case 'check':
      setup.validateEnvironment();
      break;
    
    case 'setup':
    case undefined:
      setup.setupEnvironment();
      break;
    
    default:
      console.log('Zoolyum CRM Environment Setup\n');
      console.log('Usage:');
      console.log('  node setup-env.js [command]\n');
      console.log('Commands:');
      console.log('  setup     Create .env.local from template (default)');
      console.log('  validate  Check environment configuration');
      console.log('  check     Alias for validate\n');
      console.log('Examples:');
      console.log('  node setup-env.js');
      console.log('  node setup-env.js setup');
      console.log('  node setup-env.js validate');
      break;
  }
}

module.exports = EnvSetup;