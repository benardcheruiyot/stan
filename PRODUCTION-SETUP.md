# 🚀 FUNDFAST Production Setup Guide

## M-Pesa Direct API Configuration

### Step 1: Safaricom Daraja Portal Setup
1. Visit https://developer.safaricom.co.ke/
2. Create a developer account
3. Create a new app in the Daraja portal
4. Get your production credentials:
   - Consumer Key
   - Consumer Secret
   - Business Short Code (Paybill/Till Number)
   - Passkey

### Step 2: Configure Environment Variables
Create `.env.production` file with:

```bash
# Production Environment
NODE_ENV=production

# M-Pesa Production Configuration
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_BUSINESS_SHORTCODE=3700945
MPESA_PASSKEY=your_production_passkey

# Payment Provider
PAYMENT_PROVIDER=mpesa

# Server Configuration
PORT=3000
HOST=0.0.0.0

# Business Information
BUSINESS_NAME=Your Business Name

# Production Callback URLs (Your actual domain)
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa-callback
MPESA_TIMEOUT_URL=https://yourdomain.com/api/mpesa-timeout
MPESA_RESULT_URL=https://yourdomain.com/api/mpesa-result
MPESA_ENVIRONMENT=production
JWT_SECRET=your-super-secure-jwt-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password

# SMS Configuration (for notifications)
AFRICASTALKING_USERNAME=your-username
AFRICASTALKING_API_KEY=your-api-key
```

### Step 4: Update IntaSend Service for Production
The service automatically detects production environment and switches to live mode.

### Step 5: Domain Setup
1. Get a domain (e.g., fundfast.co.ke)
2. Setup SSL certificate
3. Point domain to your server
4. Update callback URLs in IntaSend dashboard

### Step 6: Production Deployment Checklist

#### Server Requirements:
- ✅ Node.js 16+ installed
- ✅ SSL certificate configured
- ✅ Firewall configured (ports 80, 443, 3000)
- ✅ Process manager (PM2) installed
- ✅ Database setup (MongoDB/PostgreSQL)
- ✅ Backup strategy in place

#### Security:
- ✅ Environment variables secured
- ✅ API keys not in code
- ✅ HTTPS enforced
- ✅ Rate limiting enabled
- ✅ Input validation active
- ✅ Error logging configured

#### Monitoring:
- ✅ Health checks setup
- ✅ Payment monitoring active
- ✅ Error alerts configured
- ✅ Performance monitoring
- ✅ Uptime monitoring

### Step 7: Testing Production Setup
1. Run health check: `curl https://yourdomain.com/api/health`
2. Test small payment (KSh 1)
3. Verify webhook delivery
4. Check transaction status
5. Test failure scenarios

### Step 8: Go Live
1. Update website with live domain
2. Test with real customers
3. Monitor transaction success rates
4. Setup customer support

---

## Important Production Notes:

### 🔒 Security:
- Never commit production keys to version control
- Use environment variables only
- Implement rate limiting
- Log all transactions for audit

### 💰 Business:
- IntaSend charges 3.5% + KSh 10 per transaction
- Minimum payout is KSh 100
- Funds settle to your account in 24-48 hours
- Keep transaction records for compliance

### 📞 Support:
- IntaSend Business Support: support@intasend.com
- WhatsApp: +254 713 086 500
- Documentation: https://developers.intasend.com/

### 🚨 Emergency Contacts:
- Technical Issues: tech@intasend.com
- Payment Disputes: disputes@intasend.com
- Account Issues: accounts@intasend.com