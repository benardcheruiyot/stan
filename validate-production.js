#!/usr/bin/env node

/**
 * Production Validation Script
 * This script validates your production setup before going live
 */

require('dotenv').config({ path: '.env.production' });

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function printStatus(message, color = 'blue') {
    console.log(`${colors[color]}[${color.toUpperCase()}]${colors.reset} ${message}`);
}

function printSuccess(message) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function printError(message) {
    console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function printWarning(message) {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

async function validateProduction() {
    console.log('\n🚀 Production Validation\n');
    console.log('='.repeat(50));
    
    let passed = 0;
    let failed = 0;
    let warnings = 0;

    // 1. Environment Variables Check
    printStatus('Checking environment variables...');
    
    const requiredEnvVars = [
        'NODE_ENV',
        'INTASEND_PUBLISHABLE_KEY',
        'INTASEND_SECRET_KEY',
        'PAYMENT_PROVIDER'
    ];

    requiredEnvVars.forEach(envVar => {
        if (process.env[envVar]) {
            if (envVar.includes('KEY') || envVar.includes('SECRET')) {
                if (process.env[envVar].includes('YOUR_ACTUAL_') || process.env[envVar].includes('test_')) {
                    printError(`${envVar} contains placeholder or test value`);
                    failed++;
                } else {
                    printSuccess(`${envVar} is configured`);
                    passed++;
                }
            } else {
                printSuccess(`${envVar} is set: ${process.env[envVar]}`);
                passed++;
            }
        } else {
            printError(`${envVar} is not set`);
            failed++;
        }
    });

    // 2. IntaSend Configuration Check
    printStatus('\nChecking IntaSend configuration...');
    
    if (process.env.INTASEND_PUBLISHABLE_KEY && process.env.INTASEND_SECRET_KEY) {
        const isLiveKey = process.env.INTASEND_PUBLISHABLE_KEY.includes('_live_');
        const isLiveSecret = process.env.INTASEND_SECRET_KEY.includes('_live_');
        
        if (isLiveKey && isLiveSecret) {
            printSuccess('Using IntaSend production keys');
            passed++;
        } else {
            printWarning('Using IntaSend test keys in production environment');
            warnings++;
        }
    } else {
        printError('IntaSend keys not configured');
        failed++;
    }

    // 3. File Structure Check
    printStatus('\nChecking file structure...');
    
    const requiredFiles = [
        'backend/server.js',
        'backend/services/intasend-service.js',
        'backend/services/payment-service.js',
        'frontend/index.html',
        'frontend/apply.html',
        'package.json'
    ];

    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            printSuccess(`${file} exists`);
            passed++;
        } else {
            printError(`${file} is missing`);
            failed++;
        }
    });

    // 4. Dependencies Check
    printStatus('\nChecking dependencies...');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredDeps = ['express', 'cors', 'axios', 'dotenv', 'intasend-node'];
        
        requiredDeps.forEach(dep => {
            if (packageJson.dependencies && packageJson.dependencies[dep]) {
                printSuccess(`${dep} is installed`);
                passed++;
            } else {
                printError(`${dep} is missing from dependencies`);
                failed++;
            }
        });
    } catch (error) {
        printError('Could not read package.json');
        failed++;
    }

    // 5. Security Check
    printStatus('\nChecking security configuration...');
    
    // Check if .env files are in .gitignore
    if (fs.existsSync('.gitignore')) {
        const gitignore = fs.readFileSync('.gitignore', 'utf8');
        if (gitignore.includes('.env')) {
            printSuccess('.env files are ignored by git');
            passed++;
        } else {
            printError('.env files are not in .gitignore - SECURITY RISK!');
            failed++;
        }
    } else {
        printWarning('.gitignore file not found');
        warnings++;
    }

    // Check for hardcoded secrets
    try {
        const serverJs = fs.readFileSync('backend/server.js', 'utf8');
        if (serverJs.includes('ISPubKey_test_') || serverJs.includes('ISSecretKey_test_')) {
            printError('Hardcoded test keys found in server.js');
            failed++;
        } else {
            printSuccess('No hardcoded keys found');
            passed++;
        }
    } catch (error) {
        printWarning('Could not check server.js for hardcoded keys');
        warnings++;
    }

    // 6. Port Configuration
    printStatus('\nChecking port configuration...');
    
    const port = process.env.PORT || 3007;
    if (port == 3007) {
        printSuccess(`Application will run on port ${port}`);
        passed++;
    } else {
        printWarning(`Application will run on custom port ${port}`);
        warnings++;
    }

    // 7. Business Configuration
    printStatus('\nChecking business configuration...');
    
    const businessShortCode = process.env.BUSINESS_SHORTCODE || process.env.BUSINESS_SHORT_CODE;
    if (businessShortCode === '5892851') {
        printSuccess('Suan Enterprises Till Number configured correctly');
        passed++;
    } else if (businessShortCode) {
        printWarning(`Custom Till Number configured: ${businessShortCode}`);
        warnings++;
    } else {
        printError('No business short code configured');
        failed++;
    }

    // 8. Production Mode Check
    printStatus('\nChecking production mode...');
    
    if (process.env.NODE_ENV === 'production') {
        printSuccess('NODE_ENV is set to production');
        passed++;
    } else {
        printError(`NODE_ENV is set to: ${process.env.NODE_ENV || 'undefined'}`);
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${warnings}${colors.reset}`);
    
    if (failed === 0) {
        printSuccess('\n🎉 Production validation PASSED! You are ready to deploy.');
        console.log('\nNext steps:');
        console.log('1. Deploy to your production server');
        console.log('2. Setup SSL certificate');
        console.log('3. Configure domain and DNS');
        console.log('4. Test with small transactions');
        console.log('5. Monitor for the first 24 hours');
        return true;
    } else {
        printError(`\n💥 Production validation FAILED! ${failed} issues must be fixed.`);
        console.log('\nPlease fix the failed items above before deploying to production.');
        return false;
    }
}

// Run validation
if (require.main === module) {
    validateProduction().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        printError(`Validation error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { validateProduction };