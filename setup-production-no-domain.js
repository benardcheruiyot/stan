#!/usr/bin/env node

/**
 * Production Setup (NO DOMAIN REQUIRED)
 * Use webhook services for callback testing
 */

console.log('🚀 Production Setup (No Domain Required)');
console.log('====================================================\n');

console.log('📋 PRODUCTION SETUP WITHOUT DOMAIN:');
console.log('=====================================\n');

console.log('1. 🔑 GET PRODUCTION CREDENTIALS:');
console.log('   - Visit: https://developer.safaricom.co.ke/');
console.log('   - Create PRODUCTION app (not sandbox)');
console.log('   - Get: Consumer Key, Secret, Business Code, Passkey\n');

console.log('2. 🌐 SETUP CALLBACK URLs (No domain needed):');
console.log('   - Go to: https://webhook.site/');
console.log('   - Copy your unique URL (e.g., https://webhook.site/abc123)');
console.log('   - Use this URL for all M-Pesa callbacks\n');

console.log('3. ⚙️ CONFIGURE ENVIRONMENT:');
console.log('   - Copy .env.production.no-domain to .env');
console.log('   - Replace placeholder values with your real credentials');
console.log('   - Update callback URLs with your webhook.site URL\n');

console.log('4. 🧪 TEST PRODUCTION:');
console.log('   - Start with KES 1-10 amounts');
console.log('   - Watch webhook.site for M-Pesa callbacks');
console.log('   - Verify payments work correctly\n');

console.log('📝 CONFIGURATION TEMPLATE:');
console.log('==========================');
console.log(`
# Production Configuration (No Domain)
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_BUSINESS_SHORTCODE=your_till_number
MPESA_PASSKEY=your_production_passkey

# Webhook.site URLs (replace with your unique URL)
MPESA_CALLBACK_URL=https://webhook.site/your-unique-id
MPESA_TIMEOUT_URL=https://webhook.site/your-unique-id
MPESA_RESULT_URL=https://webhook.site/your-unique-id

MPESA_ENVIRONMENT=production
`);

console.log('🔧 QUICK COMMANDS:');
console.log('==================');
console.log('# Copy template:');
console.log('cp .env.production.no-domain .env');
console.log('');
console.log('# Edit configuration:');
console.log('notepad .env');
console.log('');
console.log('# Start server:');
console.log('node backend/server.js');
console.log('');

console.log('💡 WEBHOOK ALTERNATIVES:');
console.log('========================');
console.log('- https://webhook.site/ (Free, easy to use)');
console.log('- https://requestbin.com/ (Alternative)');
console.log('- https://ngrok.com/ (Tunnel local server)');
console.log('- https://smee.io/ (GitHub alternative)');
console.log('');

console.log('⚠️ IMPORTANT NOTES:');
console.log('===================');
console.log('- Webhook services are for TESTING only');
console.log('- For production deployment, you need your own domain');
console.log('- Start with small amounts (KES 1-10)');
console.log('- Monitor all transactions carefully');
console.log('');

console.log('📞 SAFARICOM SUPPORT:');
console.log('=====================');
console.log('- Technical: +254 722 000 000');
console.log('- Portal: https://developer.safaricom.co.ke/');
console.log('');

console.log('✅ Ready to test production without a domain!');
console.log('🔗 Start at: https://webhook.site/');