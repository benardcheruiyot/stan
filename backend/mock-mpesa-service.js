const PaymentService = require('./services/payment-service');

class MockService {
    constructor() {
        console.log('[Mock Service] Initialized for testing');
    }

    async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
        console.log('[Mock Service] Simulating Payment Push...');
        console.log('Phone:', phoneNumber, 'Amount:', amount);
        
        // Simulate a successful response
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
        
        return {
            success: true,
            CheckoutRequestID: 'ws_CO_mock_' + Date.now(),
            MerchantRequestID: 'mock_merchant_' + Date.now(),
            ResponseDescription: 'Mock Payment Push successful - Testing Mode',
            provider: 'test'
        };
    }

    async checkTransactionStatus(checkoutRequestId) {
        console.log('[Mock Service] Checking status for:', checkoutRequestId);
        
        return {
            success: true,
            data: {
                ResponseCode: '0',
                ResponseDescription: 'Mock transaction successful',
                ResultCode: '0',
                ResultDesc: 'The service request is processed successfully.'
            },
            provider: 'mpesa'
        };
    }

    isConfigured() {
        return true;
    }
}

module.exports = new MockMPesaService();