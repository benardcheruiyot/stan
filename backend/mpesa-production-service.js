
const axios = require('axios');
const crypto = require('crypto');

// Simple Circuit Breaker
class CircuitBreaker {
        reset() {
            this.failures = 0;
            this.open = false;
            this.lastFailureTime = null;
            console.log('[CircuitBreaker] Manually reset.');
        }
    constructor(failureThreshold = 5, cooldownTime = 60000) {
        this.failureThreshold = failureThreshold;
        this.cooldownTime = cooldownTime;
        this.failures = 0;
        this.lastFailureTime = null;
        this.open = false;
    }
    canRequest() {
        if (!this.open) return true;
        if (Date.now() - this.lastFailureTime > this.cooldownTime) {
            this.open = false;
            this.failures = 0;
            console.warn('[CircuitBreaker] Closed after cooldown. Requests allowed again.');
            return true;
        }
        if (this.open) {
            console.error('[CircuitBreaker] OPEN: Requests blocked. Wait for cooldown.');
        }
        return false;
    }
    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.failureThreshold) {
            if (!this.open) {
                console.error(`[CircuitBreaker] OPENED after ${this.failures} failures. Cooldown: ${this.cooldownTime/1000}s`);
            }
            this.open = true;
        }
    }
    recordSuccess() {
        if (this.open) {
            console.log('[CircuitBreaker] CLOSED: Success resets breaker.');
        }
        this.failures = 0;
        this.open = false;
    }
    getStatus() {
        return {
            open: this.open,
            failures: this.failures,
            lastFailureTime: this.lastFailureTime,
            cooldownTime: this.cooldownTime
        };
    }
}

class ProductionMPesaService {
        // Admin: Reset circuit breakers
        resetCircuitBreakers() {
            this.tokenBreaker.reset();
            this.stkBreaker.reset();
            console.log('[ProductionMPesaService] All circuit breakers reset by admin.');
        }
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
        
        // Production Configuration
        this.config = {
            consumerKey: process.env.MPESA_CONSUMER_KEY,
            consumerSecret: process.env.MPESA_CONSUMER_SECRET,
            shortCode: process.env.MPESA_BUSINESS_SHORTCODE,
            passkey: process.env.MPESA_PASSKEY,
            callbackUrl: process.env.MPESA_CALLBACK_URL,
            timeoutUrl: process.env.MPESA_TIMEOUT_URL,
            resultUrl: process.env.MPESA_RESULT_URL,
            environment: process.env.MPESA_ENVIRONMENT || 'sandbox'
        };

        // API URLs
        this.baseUrl = this.config.environment === 'production' 
            ? 'https://api.safaricom.co.ke' 
            : 'https://sandbox.safaricom.co.ke';

        this.authUrl = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
        this.stkPushUrl = `${this.baseUrl}/mpesa/stkpush/v1/processrequest`;
        this.queryUrl = `${this.baseUrl}/mpesa/stkpushquery/v1/query`;

        console.log(`[Production Service] Initialized for ${this.config.environment.toUpperCase()}`);
        console.log(`[Production Service] Business Short Code: ${this.config.shortCode}`);
        console.log(`[Production Service] Base URL: ${this.baseUrl}`);
        
        this.validateConfiguration();
        // Add circuit breakers for token and STK push
        this.tokenBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 min cooldown
        this.stkBreaker = new CircuitBreaker(5, 60000);
    }

    validateConfiguration() {
        const required = ['consumerKey', 'consumerSecret', 'shortCode', 'passkey', 'callbackUrl'];
        const missing = required.filter(key => !this.config[key] || this.config[key].includes('YOUR_'));
        
        if (missing.length > 0) {
            console.error('[M-Pesa Production] ❌ Missing or placeholder configuration:');
            missing.forEach(key => console.error(`   - ${key}: ${this.config[key] || 'MISSING'}`));
            
            if (this.config.environment === 'production') {
                throw new Error('❌ Production environment requires all credentials. Please update .env file.');
            }
        } else {
            console.log('[M-Pesa Production] ✅ Configuration validated');
        }
    }

    async getAccessToken(retries = 3) {
        if (!this.tokenBreaker.canRequest()) {
            throw new Error('Token circuit breaker open. Too many failures. Try again later.');
        }
        try {
            // Check if we have a valid cached token
            if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                this.tokenBreaker.recordSuccess();
                return this.accessToken;
            }
            console.log('[M-Pesa Production] 🔑 Requesting new access token...');
            const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
            const response = await axios.get(this.authUrl, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });
            if (response.data && response.data.access_token) {
                this.accessToken = response.data.access_token;
                // Set expiry 1 minute before actual expiry for safety
                this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
                console.log('[M-Pesa Production] ✅ Access token obtained successfully');
                console.log(`[M-Pesa Production] 📅 Token expires in ${response.data.expires_in} seconds`);
                this.tokenBreaker.recordSuccess();
                return this.accessToken;
            } else {
                throw new Error('Invalid token response structure');
            }
        } catch (error) {
            this.tokenBreaker.recordFailure();
            console.error('[M-Pesa Production] ❌ Token request failed:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: this.authUrl
            });
            if (retries > 0) {
                const delay = 1000 * Math.pow(2, 3 - retries); // Exponential backoff
                console.warn(`[M-Pesa Production] Retrying token request in ${delay / 1000}s... (${retries} retries left)`);
                await new Promise(res => setTimeout(res, delay));
                return this.getAccessToken(retries - 1);
            }
            throw new Error(`Failed to get access token after retries: ${error.message}`);
        }
    }

    async initiateSTKPush(phoneNumber, amount, accountReference = 'MKOPAJI', transactionDesc = 'Loan Processing Fee', retries = 2) {
        if (!this.stkBreaker.canRequest()) {
            throw new Error('STK Push circuit breaker open. Too many failures. Try again later.');
        }
        try {
            console.log('[M-Pesa Production] 🚀 Initiating STK Push...');
            console.log(`[M-Pesa Production] 📱 Phone: ${phoneNumber}`);
            console.log(`[M-Pesa Production] 💰 Amount: KES ${amount}`);
            console.log(`[M-Pesa Production] 📝 Reference: ${accountReference}`);

            let accessToken = await this.getAccessToken();
            let usedCachedToken = !!this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
            console.log(`[M-Pesa Production] 🔑 Using ${usedCachedToken ? 'cached' : 'new'} access token`);

            // Format phone number
            let formattedPhone = phoneNumber.toString().replace(/[^0-9]/g, '');
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '254' + formattedPhone.substring(1);
            } else if (formattedPhone.startsWith('+254')) {
                formattedPhone = formattedPhone.substring(1);
            } else if (!formattedPhone.startsWith('254')) {
                formattedPhone = '254' + formattedPhone;
            }

            // Validate phone number
            if (formattedPhone.length !== 12 || !formattedPhone.startsWith('254')) {
                throw new Error(`Invalid phone number format: ${phoneNumber}. Expected format: 254XXXXXXXXX`);
            }

            // Validate amount
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error(`Invalid amount: ${amount}. Must be a positive number.`);
            }

            // Production: Minimum amount validation
            if (this.config.environment === 'production' && numAmount < 1) {
                throw new Error('Production minimum amount is KES 1');
            }

            // Generate timestamp and password
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);
            const password = Buffer.from(this.config.shortCode + this.config.passkey + timestamp).toString('base64');

            console.log(`[M-Pesa Production] 📅 Timestamp: ${timestamp}`);
            console.log(`[M-Pesa Production] 🔐 Password generated`);

            constructor() {
                this.accessToken = null;
                this.tokenExpiry = null;
                // Production Configuration
                this.config = {
                    consumerKey: process.env.MPESA_CONSUMER_KEY,
                    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
                    shortCode: process.env.MPESA_BUSINESS_SHORTCODE,
                    passkey: process.env.MPESA_PASSKEY,
                    callbackUrl: process.env.MPESA_CALLBACK_URL,
                    timeoutUrl: process.env.MPESA_TIMEOUT_URL,
                    resultUrl: process.env.MPESA_RESULT_URL,
                    environment: process.env.MPESA_ENVIRONMENT || 'sandbox'
                };
                // API URLs
                this.baseUrl = this.config.environment === 'production' 
                    ? 'https://api.safaricom.co.ke' 
                    : 'https://sandbox.safaricom.co.ke';
                this.authUrl = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
                this.stkPushUrl = `${this.baseUrl}/mpesa/stkpush/v1/processrequest`;
                this.queryUrl = `${this.baseUrl}/mpesa/stkpushquery/v1/query`;
                console.log(`[Production Service] Initialized for ${this.config.environment.toUpperCase()}`);
                console.log(`[Production Service] Business Short Code: ${this.config.shortCode}`);
                console.log(`[Production Service] Base URL: ${this.baseUrl}`);
                this.validateConfiguration();
                // Add circuit breakers for token and STK push
                this.tokenBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 min cooldown
                this.stkBreaker = new CircuitBreaker(5, 60000);
            }

            // Expose service/circuit breaker status for health check
            getServiceStatus() {
                return {
                    tokenBreaker: this.tokenBreaker.getStatus(),
                    stkBreaker: this.stkBreaker.getStatus(),
                    accessTokenCached: !!this.accessToken,
                    tokenExpiry: this.tokenExpiry,
                    configLoaded: Object.values(this.config).every(Boolean),
                    environment: this.config.environment
                };
            }
            } catch (error) {
                // If token is invalid, force refresh and retry once
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.warn('[M-Pesa Production] ⚠️ Access token rejected, refreshing and retrying...');
                    this.accessToken = null;
                    this.tokenExpiry = null;
                    accessToken = await this.getAccessToken();
                    response = await axios.post(this.stkPushUrl, payload, {
                        headers: {
                            'Authorization': 'Bearer ' + accessToken,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    });
                } else if (retries > 0) {
                    const delay = 1000 * Math.pow(2, 2 - retries); // Exponential backoff
                    console.warn(`[M-Pesa Production] Retrying STK Push in ${delay / 1000}s... (${retries} retries left)`);
                    await new Promise(res => setTimeout(res, delay));
                    return this.initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc, retries - 1);
                } else {
                    this.stkBreaker.recordFailure();
                    throw error;
                }
            }

            console.log('[M-Pesa Production] 📥 STK Push response:', JSON.stringify(response.data, null, 2));

            if (response.data && response.data.ResponseCode === '0') {
                console.log('[M-Pesa Production] ✅ STK Push initiated successfully');
                console.log(`[M-Pesa Production] 🆔 CheckoutRequestID: ${response.data.CheckoutRequestID}`);
                this.stkBreaker.recordSuccess();
                return {
                    success: true,
                    CheckoutRequestID: response.data.CheckoutRequestID,
                    MerchantRequestID: response.data.MerchantRequestID,
                    ResponseDescription: response.data.ResponseDescription,
                    CustomerMessage: response.data.CustomerMessage,
                    timestamp: new Date().toISOString(),
                    provider: 'mpesa',
                    environment: this.config.environment
                };
            } else {
                this.stkBreaker.recordFailure();
                console.error('[M-Pesa Production] ❌ STK Push failed:', response.data);
                throw new Error(response.data?.ResponseDescription || response.data?.errorMessage || 'STK Push failed');
            }
        } catch (error) {
            this.stkBreaker.recordFailure();
            console.error('[M-Pesa Production] ❌ STK Push error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                phone: phoneNumber,
                amount: amount
            });

            // Enhanced error messages for common production issues
            let userFriendlyMessage = error.message;
            if (error.response?.data?.errorMessage) {
                userFriendlyMessage = error.response.data.errorMessage;
            } else if (error.response?.data?.ResponseDescription) {
                userFriendlyMessage = error.response.data.ResponseDescription;
            }

            // Map common error codes
            if (userFriendlyMessage.includes('2001')) {
                userFriendlyMessage = 'Invalid phone number. Please check and try again.';
            } else if (userFriendlyMessage.includes('2029')) {
                userFriendlyMessage = 'Business short code not configured for STK Push. Please contact support.';
            } else if (userFriendlyMessage.includes('2051')) {
                userFriendlyMessage = 'Business short code is not active. Please contact support.';
            }

            throw new Error(`STK Push failed: ${userFriendlyMessage}`);
        }
    }

    async checkTransactionStatus(checkoutRequestId) {
        try {
            console.log('[M-Pesa Production] 🔍 Checking transaction status...');
            console.log(`[M-Pesa Production] 🆔 CheckoutRequestID: ${checkoutRequestId}`);

            let accessToken = await this.getAccessToken();
            let usedCachedToken = !!this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
            console.log(`[M-Pesa Production] 🔑 Using ${usedCachedToken ? 'cached' : 'new'} access token`);

            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);
            const password = Buffer.from(this.config.shortCode + this.config.passkey + timestamp).toString('base64');

            const payload = {
                BusinessShortCode: parseInt(this.config.shortCode),
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId
            };

            console.log('[M-Pesa Production] 📤 Sending status query...');

            let response;
            try {
                response = await axios.post(this.queryUrl, payload, {
                    headers: {
                        'Authorization': 'Bearer ' + accessToken,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000 // 15 second timeout
                });
            } catch (error) {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.warn('[M-Pesa Production] ⚠️ Access token rejected during status check, refreshing and retrying...');
                    this.accessToken = null;
                    this.tokenExpiry = null;
                    accessToken = await this.getAccessToken();
                    response = await axios.post(this.queryUrl, payload, {
                        headers: {
                            'Authorization': 'Bearer ' + accessToken,
                            'Content-Type': 'application/json'
                        },
                        timeout: 15000
                    });
                } else {
                    throw error;
                }
            }

            console.log('[M-Pesa Production] 📥 Status response:', JSON.stringify(response.data, null, 2));

            // Enhanced response parsing for better activity detection
            const data = response.data;
            let status = 'pending';
            let mpesaReceiptNumber = null;
            let activityDetected = false;

            if (data.ResultCode !== undefined) {
                activityDetected = true; // We got a definitive result
                if (data.ResultCode === '0') {
                    status = 'completed';
                    console.log('[M-Pesa Production] ✅ PAYMENT COMPLETED!');
                    // Extract receipt number if available
                    if (data.CallbackMetadata && data.CallbackMetadata.Item) {
                        const receiptItem = data.CallbackMetadata.Item.find(item => 
                            item.Name === 'MpesaReceiptNumber'
                        );
                        if (receiptItem) {
                            mpesaReceiptNumber = receiptItem.Value;
                            console.log(`[M-Pesa Production] 🧾 Receipt: ${mpesaReceiptNumber}`);
                        }
                    }
                } else if (data.ResultCode === '1032') {
                    status = 'cancelled';
                    console.log('[M-Pesa Production] ❌ Payment cancelled by user');
                } else if (data.ResultCode === '1037') {
                    status = 'timeout';
                    console.log('[M-Pesa Production] ⏰ Payment timeout');
                } else if (data.ResultCode === '1') {
                    status = 'failed';
                    console.log('[M-Pesa Production] ❌ Payment failed');
                } else if (data.ResultCode === '1001') {
                    status = 'insufficient_funds';
                    console.log('[M-Pesa Production] 💰 Insufficient funds');
                } else {
                    status = 'pending';
                    console.log('[M-Pesa Production] ⏳ Still processing, ResultCode:', data.ResultCode);
                }
            } else if (data.ResponseCode === '0') {
                // Request is still being processed, no activity yet
                status = 'pending';
                console.log('[M-Pesa Production] ⏳ Request still being processed');
            }

            return {
                success: true,
                data: data,
                status: status,
                mpesaReceiptNumber: mpesaReceiptNumber,
                activityDetected: activityDetected,
                timestamp: new Date().toISOString(),
                provider: 'mpesa',
                environment: this.config.environment
            };
        } catch (error) {
            console.error('[M-Pesa Production] ❌ Status check error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                checkoutRequestId: checkoutRequestId
            });
            throw new Error(`Status check failed: ${error.message}`);
        }
    }

    // Production callback validation
    validateCallback(callbackData) {
        try {
            console.log('[M-Pesa Production] 🔍 Validating callback...');
            
            if (!callbackData || typeof callbackData !== 'object') {
                throw new Error('Invalid callback data structure');
            }

            const { Body } = callbackData;
            if (!Body || !Body.stkCallback) {
                throw new Error('Missing stkCallback in request body');
            }

            const callback = Body.stkCallback;
            
            // Validate required fields
            const required = ['MerchantRequestID', 'CheckoutRequestID', 'ResultCode'];
            const missing = required.filter(field => callback[field] === undefined);
            
            if (missing.length > 0) {
                throw new Error(`Missing required fields: ${missing.join(', ')}`);
            }

            console.log('[M-Pesa Production] ✅ Callback validation passed');
            return callback;
        } catch (error) {
            console.error('[M-Pesa Production] ❌ Callback validation failed:', error.message);
            throw error;
        }
    }
}

module.exports = new ProductionMPesaService();