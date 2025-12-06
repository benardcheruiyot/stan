#!/usr/bin/env node

/**
 * FUNDFAST Production Setup Script
 * This script helps you configure M-Pesa production settings
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 FUNDFAST - M-Pesa Production Setup');
console.log('=====================================\n');

const questions = [
    {
        key: 'MPESA_CONSUMER_KEY',
        prompt: '🔑 Enter your PRODUCTION Consumer Key: ',
        validator: (value) => value && value.length > 20 && !value.includes('YOUR_')
    },
    {
        key: 'MPESA_CONSUMER_SECRET', 
        prompt: '🔐 Enter your PRODUCTION Consumer Secret: ',
        validator: (value) => value && value.length > 20 && !value.includes('YOUR_')
    },
    {
        key: 'MPESA_BUSINESS_SHORTCODE',
        prompt: '🏢 Enter your Business Short Code (Till/Paybill): ',
        validator: (value) => /^\d+$/.test(value) && value !== '174379'
    },
    {
        key: 'MPESA_PASSKEY',
        prompt: '🗝️  Enter your PRODUCTION Passkey: ',
        validator: (value) => value && value.length > 30 && !value.includes('YOUR_')
    },
    {
        key: 'DOMAIN',
        prompt: '🌐 Enter your domain (e.g., yourdomain.com): ',
        validator: (value) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
    }
];

let config = {};
let currentQuestion = 0;

function askQuestion() {
    if (currentQuestion >= questions.length) {
        setupProduction();
        return;
    }

    const question = questions[currentQuestion];
    rl.question(question.prompt, (answer) => {
        if (question.validator(answer.trim())) {
            config[question.key] = answer.trim();
            currentQuestion++;
            askQuestion();
        } else {
            console.log('❌ Invalid input. Please try again.\n');
            askQuestion();
        }
    });
}

function setupProduction() {
    console.log('\n📝 Generating production configuration...\n');

    // Generate production .env file
    const prodEnv = `# M-Pesa Production Configuration - Generated on ${new Date().toISOString()}
# ==========================================
# 🔴 CRITICAL: These are PRODUCTION credentials - Keep them SECURE!

# Production M-Pesa Credentials
MPESA_CONSUMER_KEY=${config.MPESA_CONSUMER_KEY}
MPESA_CONSUMER_SECRET=${config.MPESA_CONSUMER_SECRET}

# Production Business Details  
MPESA_BUSINESS_SHORTCODE=${config.MPESA_BUSINESS_SHORTCODE}
MPESA_PASSKEY=${config.MPESA_PASSKEY}

# Production Callback URLs (HTTPS Required)
MPESA_CALLBACK_URL=https://${config.DOMAIN}/api/mpesa-callback
MPESA_TIMEOUT_URL=https://${config.DOMAIN}/api/mpesa-timeout
MPESA_RESULT_URL=https://${config.DOMAIN}/api/mpesa-result

# Environment
MPESA_ENVIRONMENT=production

# Server Configuration
PORT=3007

# Security
SESSION_SECRET=${generateSecureSecret()}
JWT_SECRET=${generateSecureSecret()}

# ==========================================
# 🔴 PRODUCTION SECURITY CHECKLIST:
# ==========================================
# ✅ HTTPS enabled on your domain
# ✅ Firewall configured
# ✅ Regular security updates
# ✅ Environment variables secured
# ✅ Callback URLs accessible from internet
# ✅ M-Pesa credentials from production app
# ==========================================
`;

    // Write production .env file
    fs.writeFileSync('.env.production', prodEnv);
    console.log('✅ Created .env.production file');

    // Create production start script
    const startScript = `#!/bin/bash
# FUNDFAST Production Startup Script
echo "🚀 Starting FUNDFAST in PRODUCTION mode..."

# Load production environment
export NODE_ENV=production
cp .env.production .env

# Start the server
echo "📱 PRODUCTION M-Pesa Integration Active"
echo "🌐 Domain: ${config.DOMAIN}"
echo "🏢 Business Code: ${config.MPESA_BUSINESS_SHORTCODE}"
echo ""
echo "🔴 PRODUCTION MODE - Real money transactions!"
echo ""

node backend/server.js
`;

    fs.writeFileSync('start-production.sh', startScript);
    fs.chmodSync('start-production.sh', 0o755);
    console.log('✅ Created start-production.sh script');

    // Create deployment checklist
    const checklist = `# 🚀 FUNDFAST Production Deployment Checklist

## Pre-Deployment
- [ ] Domain registered and configured
- [ ] SSL/TLS certificate installed (HTTPS)
- [ ] M-Pesa production app created on Daraja portal
- [ ] Business short code registered for STK Push
- [ ] Production credentials obtained

## Server Setup
- [ ] Server configured with Node.js
- [ ] Firewall rules configured (allow HTTPS)
- [ ] Environment variables secured
- [ ] Backup system in place
- [ ] Monitoring tools installed

## M-Pesa Configuration
- [ ] Production Consumer Key: ✓
- [ ] Production Consumer Secret: ✓  
- [ ] Business Short Code: ${config.MPESA_BUSINESS_SHORTCODE}
- [ ] Production Passkey: ✓
- [ ] Callback URLs configured:
  - [ ] https://${config.DOMAIN}/api/mpesa-callback
  - [ ] https://${config.DOMAIN}/api/mpesa-timeout
  - [ ] https://${config.DOMAIN}/api/mpesa-result

## Testing
- [ ] Test with small amounts (KES 1-10)
- [ ] Verify callbacks are received
- [ ] Test payment success flow
- [ ] Test payment failure flow
- [ ] Test timeout handling

## Go Live
- [ ] Start with limited users
- [ ] Monitor all transactions
- [ ] Have support channels ready
- [ ] Document any issues

## Post-Launch
- [ ] Daily transaction monitoring
- [ ] Regular backup verification
- [ ] Security audit schedule
- [ ] Performance monitoring

---
Generated on: ${new Date().toISOString()}
Domain: ${config.DOMAIN}
Business Code: ${config.MPESA_BUSINESS_SHORTCODE}
`;

    fs.writeFileSync('PRODUCTION-CHECKLIST.md', checklist);
    console.log('✅ Created PRODUCTION-CHECKLIST.md');

    console.log('\n🎉 Production setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Review PRODUCTION-CHECKLIST.md');
    console.log('2. Deploy to your production server');
    console.log('3. Run: chmod +x start-production.sh');
    console.log('4. Run: ./start-production.sh');
    console.log('\n🔴 IMPORTANT: Test with small amounts first!');
    console.log('📞 Safaricom Support: +254 722 000 000\n');

    rl.close();
}

function generateSecureSecret(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Start the setup
console.log('This script will help you configure FUNDFAST for production use.');
console.log('Make sure you have your M-Pesa production credentials ready.\n');

askQuestion();