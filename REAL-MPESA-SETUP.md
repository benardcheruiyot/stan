# 🚀 REAL M-PESA STK PUSH SETUP GUIDE

## ⚡ IMMEDIATE STEPS TO GET REAL STK PUSH WORKING

### Step 1: Get Safaricom Daraja API Credentials

1. **Visit Safaricom Daraja Portal**:
   - Go to: https://developer.safaricom.co.ke/
   - Click "Get Started" → "Create Account"
   - Verify your email and complete registration

2. **Create a New App**:
   - Login to Daraja Portal
   - Click "My Apps" → "Add a new app"
   - App Name: "Kopesha Loan App"
   - Select APIs: "Lipa Na M-Pesa" and "M-Pesa Express"
   - Click "Create App"

3. **Get Your Credentials**:
   - Click on your created app
   - Go to "Test Credentials" tab
   - Copy these values:
     - **Consumer Key** (starts with uppercase letters)
     - **Consumer Secret** (long string)
     - **Business Short Code** (usually 174379 for sandbox)
     - **Passkey** (long alphanumeric string)

### Step 2: Set Up Callback URL (CRITICAL for STK Push)

**Option A: Using ngrok (Recommended for testing)**
```bash
# Install ngrok globally
npm install -g ngrok

# In a new terminal, expose port 3000
ngrok http 3000
```

Copy the **https** URL (e.g., `https://abc123.ngrok.io`)

**Option B: Use a public domain**
If you have a domain, use: `https://yourdomain.com`

### Step 3: Configure Your Credentials

**Method 1: Using Environment Variables (Recommended)**
Create a `.env` file in your project root:

```env
MPESA_CONSUMER_KEY=your_actual_consumer_key_here
MPESA_CONSUMER_SECRET=your_actual_consumer_secret_here
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=your_actual_passkey_here
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/mpesa-callback
MPESA_ENVIRONMENT=sandbox
```

**Method 2: Direct Configuration**
Edit `config/mpesa-config.js` and replace:
```javascript
CONSUMER_KEY: 'your_actual_consumer_key_here',
CONSUMER_SECRET: 'your_actual_consumer_secret_here',
BUSINESS_SHORT_CODE: '174379',
PASSKEY: 'your_actual_passkey_here',
CALLBACK_URL: 'https://your-ngrok-url.ngrok.io/api/mpesa-callback',
```

### Step 4: Test Real STK Push

1. **Start your server**:
   ```bash
   npm start
   ```

2. **In another terminal, start ngrok**:
   ```bash
   ngrok http 3000
   ```

3. **Update callback URL** with your ngrok URL

4. **Test with Safaricom test numbers**:
   - Use: `254708374149` or `254711XXXXXX`
   - Test with small amounts: 1-100 KSh

### Step 5: Verify STK Push is Working

1. **Go to your loan app**: http://localhost:3000
2. **Register an account**
3. **Select a loan amount**
4. **You should receive actual STK Push** on the test phone number

## 🔧 TROUBLESHOOTING

### If STK Push not working:

1. **Check server logs** for error messages
2. **Verify credentials** are correct in Daraja Portal
3. **Ensure callback URL** is publicly accessible
4. **Use test phone numbers** from Safaricom
5. **Check Daraja Portal logs** for API calls

### Common Errors:

- **"Invalid Access Token"**: Wrong Consumer Key/Secret
- **"Invalid Phone Number"**: Use 254XXXXXXXXX format
- **"Callback timeout"**: URL not publicly accessible
- **"Invalid Business Short Code"**: Wrong shortcode

## 📱 TESTING CREDENTIALS

For immediate testing, use these Safaricom sandbox credentials:

```
Consumer Key: [Get from your Daraja app]
Consumer Secret: [Get from your Daraja app]
Business Short Code: 174379
Passkey: bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
Test Phone: 254708374149
```

## 🚀 PRODUCTION SETUP

For live M-Pesa (real money):

1. **Apply for Go-Live** on Daraja Portal
2. **Get production credentials**
3. **Update environment** to 'production'
4. **Use real business shortcode**
5. **Test with real phone numbers**

## ✅ VERIFICATION CHECKLIST

- [ ] Daraja Portal account created
- [ ] App created and credentials obtained
- [ ] ngrok installed and running
- [ ] Callback URL configured
- [ ] Credentials added to .env or config file
- [ ] Server restarted
- [ ] Test phone number ready
- [ ] Small test amount selected

## 🎯 NEXT STEPS

1. **Complete the setup wizard** running in your terminal
2. **Restart your server** after configuration
3. **Test STK Push** with small amount
4. **Check Daraja Portal logs** for API activity

Once configured correctly, you'll receive **REAL STK Push notifications** on your phone! 🎉