const axios = require('axios');
const mpesaConfig = require('../config/mpesa-config');

class MPesaService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
        
        // Check if we're in production mode
        this.isProduction = process.env.MPESA_ENVIRONMENT === 'production';
        
        console.log(`[Service] Initialized for ${this.isProduction ? 'PRODUCTION' : 'SANDBOX'}`);
        
        if (this.isProduction) {
            this.validateProductionConfig();
        }
    }

    validateProductionConfig() {
        const required = [
            'MPESA_CONSUMER_KEY',
            'MPESA_CONSUMER_SECRET', 
            'MPESA_BUSINESS_SHORTCODE',
            'MPESA_PASSKEY',
            'MPESA_CALLBACK_URL'
        ];
        
        const missing = required.filter(key => 
            !process.env[key] || 
            process.env[key].includes('YOUR_') ||
            process.env[key] === 'YOUR_PRODUCTION_CONSUMER_KEY'
        );
        
        if (missing.length > 0) {
            console.error('❌ PRODUCTION MODE - Missing required configuration:');
            missing.forEach(key => console.error(`   - ${key}: ${process.env[key] || 'MISSING'}`));
            console.error('\n🔧 Run: node production-setup.js to configure production');
            throw new Error('Production configuration incomplete');
        }
        
        // Validate callback URLs are HTTPS in production
        if (!process.env.MPESA_CALLBACK_URL.startsWith('https://')) {
            throw new Error('Production callback URLs must use HTTPS');
        }
        
        console.log('✅ Production configuration validated');
        console.log(`📱 Business Short Code: ${process.env.BUSINESS_SHORTCODE}`);
        console.log(`🌐 Callback URL: ${process.env.CALLBACK_URL}`);
    }

    async getAccessToken() {
        try {
            if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                console.log('[Service] Using cached access token');
                return this.accessToken;
            }

            console.log('[Service] Requesting new access token...');
            console.log('[Service] Auth URL:', mpesaConfig.OAUTH_URL);
            console.log('[Service] Consumer Key:', mpesaConfig.CONSUMER_KEY?.substring(0, 10) + '...');

            const auth = Buffer.from(`${mpesaConfig.CONSUMER_KEY}:${mpesaConfig.CONSUMER_SECRET}`).toString('base64');
            
            const response = await axios.get(mpesaConfig.OAUTH_URL, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('[Service] Token response status:', response.status);
            console.log('[Service] Token response data:', response.data);

            if (response.data && response.data.access_token) {
                this.accessToken = response.data.access_token;
                this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
                console.log('[Service] Access token obtained successfully');
                return this.accessToken;
            } else {
                throw new Error('Invalid token response');
            }
        } catch (error) {
            console.error('[MPesa Service] Access token error:', error.response?.data || error.message);
            throw new Error('Failed to get access token: ' + error.message);
        }
    }

    async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
        try {
            console.log('[MPesa Service] Initiating STK Push...');
            console.log('[MPesa Service] Environment:', this.isProduction ? 'PRODUCTION' : 'SANDBOX');
            console.log('[MPesa Service] Phone:', phoneNumber, 'Amount:', amount);
            console.log('[MPesa Service] Business Short Code:', mpesaConfig.BUSINESS_SHORT_CODE);
            
            const accessToken = await this.getAccessToken();
            
            let formattedPhone = phoneNumber.toString().replace(/[^0-9]/g, '');
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '254' + formattedPhone.substring(1);
            } else if (!formattedPhone.startsWith('254')) {
                formattedPhone = '254' + formattedPhone;
            }

            console.log('[MPesa Service] Formatted phone:', formattedPhone);

            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);
            const password = Buffer.from(mpesaConfig.BUSINESS_SHORT_CODE + mpesaConfig.PASSKEY + timestamp).toString('base64');

            // Use Buy Goods transaction type with Till number for production
            const payload = {
                BusinessShortCode: mpesaConfig.BUSINESS_SHORT_CODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerBuyGoodsOnline', // Buy Goods for Till number
                Amount: parseFloat(amount), // Use parseFloat for accurate amount handling
                PartyA: formattedPhone,
                PartyB: '5892851', // Use Till number instead of business shortcode
                PhoneNumber: formattedPhone,
                CallBackURL: mpesaConfig.CALLBACK_URL,
                AccountReference: accountReference || 'MKOPAJI-LOAN',
                TransactionDesc: transactionDesc || 'MKOPAJI Loan Processing Fee'
            };

            console.log('[MPesa Service] STK Push payload:', JSON.stringify(payload, null, 2));
            console.log('[MPesa Service] STK Push URL:', mpesaConfig.STK_PUSH_URL);
            console.log('[MPesa Service] Callback URL:', mpesaConfig.CALLBACK_URL);

            const response = await axios.post(mpesaConfig.STK_PUSH_URL, payload, {
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // Increased timeout for production
            });

            console.log('[MPesa Service] STK Push response status:', response.status);
            console.log('[MPesa Service] STK Push response data:', JSON.stringify(response.data, null, 2));

            if (response.data && response.data.ResponseCode === '0') {
                console.log('[MPesa Service] STK Push successful!');
                return {
                    success: true,
                    CheckoutRequestID: response.data.CheckoutRequestID,
                    MerchantRequestID: response.data.MerchantRequestID,
                    ResponseDescription: response.data.ResponseDescription,
                    ResponseCode: response.data.ResponseCode,
                    provider: 'mpesa'
                };
            } else {
                console.error('[MPesa Service] STK Push failed with response:', response.data);
                throw new Error(response.data?.ResponseDescription || response.data?.errorMessage || 'STK Push failed');
            }
        } catch (error) {
            console.error('[MPesa Service] STK Push error details:');
            console.error('Error message:', error.message);
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
            console.error('Response headers:', error.response?.headers);
            
            // Provide more specific error messages
            let errorMessage = 'STK Push failed';
            if (error.response?.data) {
                const data = error.response.data;
                if (data.errorMessage) {
                    errorMessage = data.errorMessage;
                } else if (data.ResponseDescription) {
                    errorMessage = data.ResponseDescription;
                } else if (data.message) {
                    errorMessage = data.message;
                }
            }
            
            throw new Error(errorMessage + ': ' + error.message);
        }
    }

    async checkTransactionStatus(checkoutRequestId) {
        try {
            const accessToken = await this.getAccessToken();
            
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);
            const password = Buffer.from(mpesaConfig.BUSINESS_SHORT_CODE + mpesaConfig.PASSKEY + timestamp).toString('base64');

            const payload = {
                BusinessShortCode: mpesaConfig.BUSINESS_SHORT_CODE,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId
            };

            const response = await axios.post(mpesaConfig.STK_QUERY_URL, payload, {
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('[MPesa Service] Status response:', JSON.stringify(response.data, null, 2));

            // Enhanced response parsing for better activity detection
            const data = response.data;
            let status = 'pending';
            let mpesaReceiptNumber = null;
            let activityDetected = false;

            if (data.ResultCode !== undefined) {
                activityDetected = true; // We got a definitive result
                
                if (data.ResultCode === '0') {
                    status = 'completed';
                    console.log('[MPesa Service] ✅ PAYMENT COMPLETED!');
                    // Extract receipt number if available
                    if (data.CallbackMetadata && data.CallbackMetadata.Item) {
                        const receiptItem = data.CallbackMetadata.Item.find(item => 
                            item.Name === 'MpesaReceiptNumber'
                        );
                        if (receiptItem) {
                            mpesaReceiptNumber = receiptItem.Value;
                        }
                    }
                } else if (data.ResultCode === '1032') {
                    status = 'cancelled';
                    console.log('[MPesa Service] ❌ Payment cancelled by user');
                } else if (data.ResultCode === '1037') {
                    status = 'timeout';
                    console.log('[MPesa Service] ⏰ Payment timeout');
                } else if (data.ResultCode === '1') {
                    status = 'failed';
                    console.log('[MPesa Service] ❌ Payment failed');
                } else if (data.ResultCode === '1001') {
                    status = 'failed';
                    console.log('[MPesa Service] 💰 Insufficient funds');
                } else {
                    status = 'pending';
                    console.log('[MPesa Service] ⏳ Still processing, ResultCode:', data.ResultCode);
                }
            } else if (data.ResponseCode === '0') {
                // Request is still being processed, no activity yet
                status = 'pending';
                console.log('[MPesa Service] ⏳ Request still being processed');
            }

            return {
                success: true,
                data: data,
                status: status,
                mpesaReceiptNumber: mpesaReceiptNumber,
                activityDetected: activityDetected,
                provider: 'mpesa'
            };
        } catch (error) {
            // Handle rate limiting (429) and other errors gracefully
            if (error.response && error.response.status === 429) {
                console.log('[MPesa Service] Rate limit hit, suggesting manual confirmation');
                return {
                    success: false,
                    rateLimited: true,
                    message: 'Rate limit reached. Please confirm payment manually.',
                    provider: 'mpesa'
                };
            }
            console.log('[MPesa Service] Status check error:', error.message);
            return {
                success: false,
                rateLimited: false,
                message: error.message,
                provider: 'mpesa'
            };
        }
    }

    isConfigured() {
        return !!(mpesaConfig.CONSUMER_KEY && mpesaConfig.CONSUMER_SECRET && mpesaConfig.BUSINESS_SHORT_CODE && mpesaConfig.PASSKEY);
    }
}

module.exports = new MPesaService();
