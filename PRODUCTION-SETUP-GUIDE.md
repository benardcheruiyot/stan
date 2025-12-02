# 🚀 PRODUCTION SETUP GUIDE FOR SUAN ENTERPRISES
# Till Number: 5892851

## 📋 STEP-BY-STEP PRODUCTION DEPLOYMENT

### STEP 1: Get Real Safaricom Credentials
**Contact Safaricom Business Team:**

� **EMAIL (Recommended):** business@safaricom.co.ke
   - Use the email template in `EMAIL-TEMPLATE-SAFARICOM.txt`
   - Professional and documented communication
   - Attach business documents if needed

📞 **PHONE:** 0711 999 999 or 0734 999 999
🌐 **Website:** https://www.safaricom.co.ke/business/mobile-money/till-number

**Email Subject:** "Request for Daraja API Production Credentials - Till Number 5892851 (Suan Enterprises)"

Requirements:
✅ Confirm Till Number 5892851 is registered under "Suan Enterprises"
✅ Request Daraja API access for this specific Till Number
✅ Get production Consumer Key & Consumer Secret
✅ Get production Passkey for Till Number 5892851

### STEP 2: Configure Production Environment
1. Rename `.env.production` to `.env`
2. Add your real credentials (received from Safaricom)
3. Set up public callback URLs (use ngrok or your domain)

### STEP 3: Deploy to Production
```bash
# Install dependencies
npm install

# Start production server
npm run prod
```

### STEP 4: Test Production STK Push
- Use real phone numbers
- Start with small amounts (1-10 KSh)
- Verify "Suan Enterprises" appears in M-Pesa popup
- Confirm payments go to Till Number 5892851

## 🎯 EXPECTED RESULT
Once production credentials are configured:
✅ M-Pesa popup will show "Suan Enterprises" (not "Daraja")
✅ Payments will go directly to Till Number 5892851
✅ Real money transactions will be processed
✅ Users will see professional Suan Enterprises branding

## 📞 SAFARICOM CONTACT CHECKLIST
**For EMAIL (business@safaricom.co.ke):**
1. Use the provided email template in `EMAIL-TEMPLATE-SAFARICOM.txt`
2. Customize with your personal details
3. Attach business registration documents if available
4. Request response timeline

**For PHONE (0711 999 999):**
When calling Safaricom, mention:
1. "I need Daraja API access for Till Number 5892851"
2. "Business name should be Suan Enterprises"
3. "I need production Consumer Key, Consumer Secret, and Passkey"
4. "This is for STK Push integration on my loan platform"

## 🔐 SECURITY NOTES
- Never share production credentials
- Use HTTPS for callback URLs
- Monitor transactions regularly
- Keep backup of all credentials