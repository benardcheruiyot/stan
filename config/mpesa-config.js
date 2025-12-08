/**
 * M-Pesa Daraja API Configuration for SANDBOX
 * 
 * This configuration is set up for Safaricom sandbox testing.
 * For production, update credentials and set ENVIRONMENT to 'production'
 */

module.exports = {
        TILL_NUMBER: process.env.MPESA_TILL_NUMBER || '4530674',
    // Daraja API Credentials (SANDBOX)
    CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || 'bEt4KlPbQbUHCLq3dSCBzWwK9vyGrN2n',
    CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || 'PbJRUt5KWAC8z3Z6',
    
    // Business Details (SANDBOX)
    BUSINESS_SHORT_CODE: process.env.MPESA_BUSINESS_SHORTCODE || '174379',
    BUSINESS_NAME: 'Test Organization',
    
    // STK Push Passkey (SANDBOX)
    PASSKEY: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    
    // Callback URLs (SANDBOX)
    CALLBACK_URL: process.env.MPESA_CALLBACK_URL || 'https://mydomain.com/path',
    TIMEOUT_URL: process.env.MPESA_TIMEOUT_URL || 'https://mydomain.com/path',
    RESULT_URL: process.env.MPESA_RESULT_URL || 'https://mydomain.com/path',
    
    // B2C Configuration (SANDBOX)
    INITIATOR_NAME: process.env.MPESA_INITIATOR_NAME || 'testapi',
    SECURITY_CREDENTIAL: process.env.MPESA_SECURITY_CREDENTIAL || 'Safaricom999!*!',
    
    // Environment Configuration
    ENVIRONMENT: process.env.MPESA_ENVIRONMENT || 'sandbox',
    
    // API URLs (automatically set based on environment)
    get BASE_URL() {
        return this.ENVIRONMENT === 'production' 
            ? 'https://api.safaricom.co.ke' 
            : 'https://sandbox.safaricom.co.ke';
    },
    
    get OAUTH_URL() {
        return `${this.BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
    },
    
    get STK_PUSH_URL() {
        return `${this.BASE_URL}/mpesa/stkpush/v1/processrequest`;
    },
    
    get STK_QUERY_URL() {
        return `${this.BASE_URL}/mpesa/stkpushquery/v1/query`;
    },
    
    get B2C_URL() {
        return `${this.BASE_URL}/mpesa/b2c/v1/paymentrequest`;
    },
    
    // Lowercase aliases for service compatibility
    get consumerKey() { return this.CONSUMER_KEY; },
    get consumerSecret() { return this.CONSUMER_SECRET; },
    get shortCode() { return this.BUSINESS_SHORT_CODE; },
    get passkey() { return this.PASSKEY; },
    get callbackUrl() { return this.CALLBACK_URL; },
    get authUrl() { return this.AUTH_URL; },
    get stkPushUrl() { return this.STK_PUSH_URL; },
    get queryUrl() { return this.STK_QUERY_URL; }
};

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. DEVELOPMENT SETUP:
 *    - Go to https://developer.safaricom.co.ke/
 *    - Create account and new app
 *    - Use sandbox credentials for testing
 *    - Use ngrok to expose your local server: `ngrok http kopesha.mkopaji.com:3004`
 *    - Update CALLBACK_URL with your ngrok URL
 * 
 * 2. PRODUCTION SETUP:
 *    - Get production credentials from Safaricom
 *    - Set ENVIRONMENT to 'production'
 *    - Use your actual domain for callback URLs
 *    - Generate security credential for B2C payments
 * 
 * 3. ENVIRONMENT VARIABLES:
 *    Create a .env file with:
 *    MPESA_CONSUMER_KEY=your_consumer_key
 *    MPESA_CONSUMER_SECRET=your_consumer_secret
 *    MPESA_BUSINESS_SHORTCODE=your_shortcode
 *    MPESA_PASSKEY=your_passkey
 *    MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa-callback
 *    MPESA_ENVIRONMENT=sandbox
 * 
 * 4. TESTING:
 *    - Use test phone numbers provided by Safaricom
 *    - Test with small amounts (1-100 KSh)
 *    - Check Daraja Portal for transaction logs
 * 
 * 5. SECURITY:
 *    - Never commit real credentials to git
 *    - Use environment variables in production
 *    - Implement proper callback URL validation
 *    - Use HTTPS for all callback URLs
 */