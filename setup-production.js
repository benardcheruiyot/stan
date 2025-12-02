#!/usr/bin/env node

/**
 * Production Setup Script for Suan Enterprises
 * Till Number: 5892851
 * 
 * This script helps you switch to production M-Pesa configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 SUAN ENTERPRISES PRODUCTION SETUP');
console.log('======================================');
console.log('Till Number: 5892851');
console.log('Business Name: Suan Enterprises');
console.log('');

// Check if production env file exists
const prodEnvPath = path.join(__dirname, '.env.production');
const mainEnvPath = path.join(__dirname, '.env');

if (!fs.existsSync(prodEnvPath)) {
    console.log('❌ .env.production file not found!');
    console.log('   Please create .env.production with your production credentials');
    process.exit(1);
}

console.log('📋 BEFORE PROCEEDING:');
console.log('');
console.log('1. ✅ Ensure Till Number 5892851 is registered under "Suan Enterprises"');
console.log('2. ✅ Get production credentials from Safaricom Daraja Portal');
console.log('3. ✅ Update .env.production with your real credentials');
console.log('4. ✅ Set up public callback URLs (use ngrok or your domain)');
console.log('');

// Read production env template
const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8');

// Check if credentials are still placeholder values
if (prodEnvContent.includes('your_production_consumer_key_here') ||
    prodEnvContent.includes('your_production_passkey_for_till_5892851')) {
    console.log('⚠️  WARNING: Production credentials not configured!');
    console.log('   Please update .env.production with real Safaricom credentials');
    console.log('');
    console.log('📞 Contact Safaricom:');
    console.log('   Phone: 0711 999 999 or 0734 999 999');
    console.log('   Tell them: "I need Daraja API access for Till Number 5892851"');
    console.log('');
    process.exit(1);
}

// Copy production env to main env
fs.copyFileSync(prodEnvPath, mainEnvPath);

console.log('✅ Production environment configured!');
console.log('');
console.log('🎯 NEXT STEPS:');
console.log('1. Restart your server: npm start');
console.log('2. Test with small amounts first (1-10 KSh)');
console.log('3. Verify M-Pesa popup shows "Suan Enterprises"');
console.log('4. Confirm payments go to Till Number 5892851');
console.log('');
console.log('🚀 Your loan platform is ready for production!');