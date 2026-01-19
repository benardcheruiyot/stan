// Admin endpoint to reset circuit breakers (protect with authentication in production!)
app.post('/api/admin/reset-circuit-breakers', (req, res) => {
    try {
        // Access the real MPesaService instance
        if (typeof PaymentService.prototype.mpesaService.resetCircuitBreakers === 'function') {
            PaymentService.prototype.mpesaService.resetCircuitBreakers();
        } else if (typeof PaymentService.prototype.resetCircuitBreakers === 'function') {
            PaymentService.prototype.resetCircuitBreakers();
        }
        res.json({ success: true, message: 'Circuit breakers reset.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to reset circuit breakers', error: err.message });
    }
});
// Load environment variables FIRST
require('dotenv').config();
const fs = require('fs');

const express = require('express');
const cors = require('cors');
const path = require('path');

const mongoose = require('mongoose');
const PaymentService = require('./services/payment-service');
const Transaction = require('./models/Transaction');
// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mpesa';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

const app = express();
const PORT = process.env.PORT || 3007;
const ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';

console.log(`🚀 Starting MKOPAJI Server in ${ENVIRONMENT.toUpperCase()} mode`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for M-Pesa callbacks
app.use(express.urlencoded({ extended: true }));
// Serve static files with no-cache headers in development to ensure edits show immediately
// Serve static files. In development disable caching for HTML/CSS/JS so edits appear immediately.
const staticOptions = {};
if (process.env.NODE_ENV !== 'production') {
    staticOptions.etag = false;
    staticOptions.setHeaders = (res, filePath) => {
        if (/\.(html|css|js)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    };
}

app.use(express.static(path.join(__dirname, '../frontend'), staticOptions));

// Serve static files
app.get('/', (req, res) => {
    // Serve `landing-exact.html` only in development when explicitly enabled.
    // Set `SERVE_REFERENCE=true` in your local `.env` to preview the saved landing.
    const serveReference = (process.env.SERVE_REFERENCE === 'true') && (process.env.NODE_ENV !== 'production');
    const landing = path.join(__dirname, '../frontend/landing-exact.html');
    if (serveReference && fs.existsSync(landing)) {
        console.log('Serving development reference landing: landing-exact.html');
        return res.sendFile(landing);
    }
    return res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/apply', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/apply.html'));
});

// Initialize Payment service
const paymentService = new PaymentService();

// Health check endpoint for monitoring service and circuit breaker status
app.get('/api/health', (req, res) => {
    let serviceStatus = {};
    if (typeof paymentService.getServiceStatus === 'function') {
        serviceStatus = paymentService.getServiceStatus();
    }
    res.json({
        success: true,
        status: 'ok',
        environment: ENVIRONMENT,
        serviceStatus
    });
});

// In-memory storage for transactions (use database in production)
const transactions = new Map();
const applications = new Map();

// === Background job to resolve stuck pending transactions ===
const PENDING_TIMEOUT_MINUTES = 10; // Mark as failed after 10 minutes
const PENDING_CHECK_INTERVAL_MS = 2 * 60 * 1000; // Check every 2 minutes

async function checkAndResolvePendingTransactions() {
    const now = Date.now();
    for (const [id, tx] of transactions.entries()) {
        if (tx.status === 'pending') {
            const created = new Date(tx.timestamp).getTime();
            const ageMinutes = (now - created) / 60000;
            if (ageMinutes > PENDING_TIMEOUT_MINUTES) {
                // Mark as failed due to timeout
                tx.status = 'timeout';
                tx.failedAt = new Date().toISOString();
                tx.failureReason = 'Timed out after pending too long';
                transactions.set(id, tx);
                console.warn(`⏰ Transaction ${id} marked as timeout after ${PENDING_TIMEOUT_MINUTES} min.`);
            } else {
                // Try to re-check status with paymentService
                try {
                    const statusResult = await paymentService.checkTransactionStatus(id, tx.provider || 'mpesa');
                    if (statusResult.success && statusResult.status !== 'pending') {
                        tx.status = statusResult.status;
                        if (statusResult.mpesaReceiptNumber) {
                            tx.mpesaReceiptNumber = statusResult.mpesaReceiptNumber;
                        }
                        transactions.set(id, tx);
                        console.log(`🔄 Transaction ${id} status auto-updated to: ${statusResult.status}`);
                    }
                } catch (err) {
                    console.error(`Error auto-checking status for ${id}:`, err.message);
                }
            }
        }
    }
}

setInterval(checkAndResolvePendingTransactions, PENDING_CHECK_INTERVAL_MS);
console.log(`⏰ Pending transaction monitor started: checks every ${PENDING_CHECK_INTERVAL_MS/60000} min, timeout = ${PENDING_TIMEOUT_MINUTES} min.`);

// STK Push initiation endpoint
app.post('/api/initiate-stk-push', async (req, res) => {
    try {
        const { phoneNumber, amount, accountReference, transactionDesc, applicationData } = req.body;

        console.log('Initiating STK Push:', {
            phoneNumber,
            amount,
            accountReference,
            transactionDesc
        });

        // Validate input
        if (!phoneNumber || !amount || !accountReference) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: phoneNumber, amount, accountReference'
            });
        }

        // Validate phone number format
        const phoneRegex = /^254[0-9]{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format. Use 254XXXXXXXXX'
            });
        }

        // Initiate STK Push using Payment Service
        const result = await paymentService.initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc);

        if (result.success) {            
            // Store transaction in MongoDB
            const transactionDoc = new Transaction({
                phoneNumber,
                amount,
                accountReference,
                transactionDesc,
                status: 'pending',
                provider: result.provider || 'mpesa',
                applicationData,
                checkoutRequestId: result.CheckoutRequestID,
                merchantRequestId: result.MerchantRequestID,
                responseDescription: result.ResponseDescription,
                customerMessage: result.CustomerMessage,
                environment: ENVIRONMENT
            });
            await transactionDoc.save();
            console.log('STK Push initiated and saved:', result.CheckoutRequestID);
            res.json({
                success: true,
                message: 'STK Push initiated successfully',
                CheckoutRequestID: result.CheckoutRequestID,
                MerchantRequestID: result.MerchantRequestID
            });
        } else {
            console.error('STK Push failed:', result.message);
            res.status(400).json({
                success: false,
                message: result.message || 'Failed to initiate STK Push'
            });
        }

    } catch (error) {
        console.error('Error initiating STK Push:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Transaction status check endpoint
app.get('/api/check-transaction-status/:checkoutRequestID', async (req, res) => {
    try {
        const { checkoutRequestID } = req.params;

        console.log('Checking transaction status for:', checkoutRequestID);


        const transaction = await Transaction.findOne({ checkoutRequestId: checkoutRequestID });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Check status with Payment Service using the provider that was actually used
        const providerUsed = transaction.provider || 'mpesa';
        console.log(`🔍 Checking transaction status using ${providerUsed.toUpperCase()}`);
        
        const statusResult = await paymentService.checkTransactionStatus(checkoutRequestID, providerUsed);

        if (statusResult.success) {
            // Update transaction status in MongoDB
            transaction.status = statusResult.status;
            if (statusResult.mpesaReceiptNumber) {
                transaction.mpesaReceiptNumber = statusResult.mpesaReceiptNumber;
            }
            transaction.updatedAt = new Date();
            await transaction.save();

            console.log('Transaction status updated:', {
                checkoutRequestID,
                status: statusResult.status,
                mpesaReceiptNumber: statusResult.mpesaReceiptNumber
            });

            res.json({
                success: true,
                status: statusResult.status,
                mpesaReceiptNumber: statusResult.mpesaReceiptNumber,
                transaction: {
                    amount: transaction.amount,
                    phoneNumber: transaction.phoneNumber,
                    timestamp: transaction.createdAt
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: statusResult.message || 'Failed to check transaction status'
            });
        }

    } catch (error) {
        console.error('Error checking transaction status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Manual payment confirmation endpoint
app.post('/api/confirm-payment', async (req, res) => {
    try {
        const { checkoutRequestID, mpesaCode } = req.body;

        if (!checkoutRequestID) {
            return res.status(400).json({
                success: false,
                message: 'Checkout Request ID is required'
            });
        }

        const transaction = transactions.get(checkoutRequestID);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Update transaction status to completed
        transaction.status = 'completed';
        if (mpesaCode) {
            transaction.mpesaReceiptNumber = mpesaCode;
        }
        transactions.set(checkoutRequestID, transaction);

        console.log('✅ Payment manually confirmed:', {
            checkoutRequestID,
            mpesaReceiptNumber: mpesaCode,
            amount: transaction.amount
        });

        res.json({
            success: true,
            status: 'completed',
            mpesaReceiptNumber: mpesaCode,
            message: 'Payment confirmed successfully',
            transaction: {
                amount: transaction.amount,
                phoneNumber: transaction.phoneNumber,
                timestamp: transaction.timestamp
            }
        });

    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// TEST ONLY: Simulate successful payment (remove in production)
app.post('/api/simulate-payment-success', async (req, res) => {
    try {
        const { checkoutRequestID } = req.body;

        if (!checkoutRequestID) {
            return res.status(400).json({
                success: false,
                message: 'Checkout Request ID is required'
            });
        }


        const transaction = await Transaction.findOne({ checkoutRequestId: checkoutRequestID });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        // Simulate successful payment
        transaction.status = 'completed';
        transaction.mpesaReceiptNumber = mpesaCode || 'QEJ7Y6X2M1'; // Use provided or sample code
        transaction.updatedAt = new Date();
        await transaction.save();

        console.log('🧪 TEST: Payment simulated as successful:', {
            checkoutRequestID,
            mpesaReceiptNumber: transaction.mpesaReceiptNumber,
            amount: transaction.amount
        });

        res.json({
            success: true,
            status: 'completed',
            mpesaReceiptNumber: transaction.mpesaReceiptNumber,
            message: 'Payment simulated successfully',
            transaction: {
                amount: transaction.amount,
                phoneNumber: transaction.phoneNumber,
                timestamp: transaction.createdAt
            }
        });

    } catch (error) {
        console.error('Error simulating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// M-Pesa Production Callback Endpoints
app.post('/api/mpesa-callback', async (req, res) => {
    const startTime = Date.now();
    console.log('📞 M-Pesa Callback received at:', new Date().toISOString());
    console.log('📞 Raw callback data:', JSON.stringify(req.body, null, 2));

    try {
        // Quick acknowledgment to M-Pesa (must respond within 30 seconds)
        res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
        console.log('📞 ✅ Acknowledged callback to M-Pesa');

        // Process the callback data
        const { Body } = req.body;
        if (!Body || !Body.stkCallback) {
            console.error('📞 ❌ Invalid callback structure - missing Body.stkCallback');
            return;
        }

        const stkCallback = Body.stkCallback;
        const { CheckoutRequestID, MerchantRequestID, ResultCode, ResultDesc } = stkCallback;

        console.log('📞 Processing callback for:', {
            CheckoutRequestID,
            MerchantRequestID,
            ResultCode,
            ResultDesc
        });


        // Find the transaction in MongoDB
        const transaction = await Transaction.findOne({ checkoutRequestId: CheckoutRequestID });
        if (!transaction) {
            console.error(`📞 ❌ Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
            return;
        }

        // Update transaction based on result code
        if (ResultCode === 0) {
            // Payment successful
            console.log('📞 ✅ Payment successful!');
            transaction.status = 'completed';
            transaction.completedAt = new Date().toISOString();

            // Extract payment details from callback metadata
            const callbackMetadata = stkCallback.CallbackMetadata;
            if (callbackMetadata && callbackMetadata.Item) {
                for (const item of callbackMetadata.Item) {
                    switch (item.Name) {
                        case 'MpesaReceiptNumber':
                            transaction.mpesaReceiptNumber = item.Value;
                            console.log(`📞 💰 Receipt Number: ${item.Value}`);
                            break;
                        case 'TransactionDate':
                            transaction.transactionDate = item.Value;
                            console.log(`📞 📅 Transaction Date: ${item.Value}`);
                            break;
                        case 'Amount':
                            transaction.confirmedAmount = item.Value;
                            console.log(`📞 💵 Confirmed Amount: ${item.Value}`);
                            break;
                        case 'PhoneNumber':
                            transaction.confirmedPhone = item.Value;
                            console.log(`📞 📱 Confirmed Phone: ${item.Value}`);
                            break;
                    }
                }
            }

            // (Optional) Process loan disbursement for successful payments
            // You may need to refactor applicationData to be stored in MongoDB as well

        } else {
            // Payment failed, cancelled, or timed out
            console.log(`📞 ❌ Payment failed with code ${ResultCode}: ${ResultDesc}`);
            let status = 'failed';
            switch (ResultCode) {
                case 1032:
                    status = 'cancelled';
                    console.log('📞 User cancelled the payment');
                    break;
                case 1037:
                    status = 'timeout';
                    console.log('📞 Payment request timed out');
                    break;
                case 1001:
                    status = 'insufficient_funds';
                    console.log('📞 Insufficient funds in customer account');
                    break;
                default:
                    status = 'failed';
                    console.log(`📞 Payment failed with unknown code: ${ResultCode}`);
            }
            transaction.status = status;
            transaction.failureReason = ResultDesc;
            transaction.failedAt = new Date().toISOString();
        }

        transaction.updatedAt = new Date();
        await transaction.save();

        const processingTime = Date.now() - startTime;
        console.log(`📞 ✅ Callback processed in ${processingTime}ms`);
        console.log('📞 📊 Final transaction state:', {
            CheckoutRequestID,
            status: transaction.status,
            mpesaReceiptNumber: transaction.mpesaReceiptNumber || 'N/A'
        });

    } catch (error) {
        console.error('📞 ❌ Callback processing error:', error);
        
        // Even if processing fails, we already acknowledged to M-Pesa
        // Log the error for investigation
        console.error('📞 ❌ Error details:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
    }
});

// M-Pesa Timeout Callback (for when STK push times out)
app.post('/api/mpesa-timeout', (req, res) => {
    console.log('⏰ M-Pesa Timeout Callback received:', JSON.stringify(req.body, null, 2));
    res.status(200).json({ ResultCode: 0, ResultDesc: "Timeout acknowledged" });
});

// M-Pesa Result Callback (for B2C and other operations)
app.post('/api/mpesa-result', (req, res) => {
    console.log('📋 M-Pesa Result Callback received:', JSON.stringify(req.body, null, 2));
    res.status(200).json({ ResultCode: 0, ResultDesc: "Result acknowledged" });
});

// Function to process loan disbursement
async function processLoanDisbursement(applicationData, transaction) {
    try {
        console.log('Processing loan disbursement:', {
            applicant: applicationData.fullName,
            loanAmount: applicationData.amountToReceive,
            phoneNumber: applicationData.phoneNumber
        });

        // Here you would:
        // 1. Create customer record in database
        // 2. Create loan record
        // 3. Initiate B2C payment to customer
        // 4. Send SMS/email notifications
        // 5. Update credit score/history

        // Log the successful loan disbursement
        console.log('Loan disbursement processed successfully:', {
            customerName: applicationData.fullName,
            phoneNumber: applicationData.phoneNumber,
            loanAmount: applicationData.amountToReceive,
            processingFeeReceived: transaction.amount,
            mpesaReceiptNumber: transaction.mpesaReceiptNumber
        });

        // In production, you would initiate B2C payment here:
        // await mpesaService.b2cPayment(
        //     applicationData.phoneNumber,
        //     applicationData.amountToReceive,
        //     `Loan disbursement - ${applicationData.fullName}`,
        //     'BusinessPayment'
        // );

    } catch (error) {
        console.error('Error processing loan disbursement:', error);
    }
}

// Get all transactions (for admin/debugging)
app.get('/api/transactions', async (req, res) => {
    const allTransactions = await Transaction.find().sort({ createdAt: -1 }).lean();
    res.json(allTransactions);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const serviceStatus = paymentService.getServiceStatus();
    
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        paymentService: serviceStatus,
        configured: paymentService.isConfigured()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MKOPAJI Loan Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    
    const serviceStatus = paymentService.getServiceStatus();
    console.log(`� Payment Service Status:`, serviceStatus);
    console.log(`💰 Payment integration: ${paymentService.isConfigured() ? 'ENABLED' : 'DISABLED - Check config'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;