
# 🚀 Modern Finance App


A modern, secure finance application platform. Built with Node.js, Express, and vanilla JavaScript with a beautiful, modern UI.


## ✨ Features

- 🏦 **Fast Processing**
- 📱 **Mobile Integration**
- 🎨 **Modern UI/UX**
- 🔒 **Secure Transactions**
- ⚡ **Optimized for performance**
- 📊 **Real-time Status**
- 🎯 **Mobile Responsive**


## 🏗️ Project Structure

```
app/
├── frontend/                 # Frontend HTML files
│   ├── index.html           # Homepage
│   └── apply.html           # Application interface
├── backend/                 # Node.js backend
│   ├── server.js           # Main Express server
│   └── service.js          # API integration
├── config/                 # Configuration files
│   └── config.js           # App credentials & settings
├── docs/                   # Documentation
│   └── README.md           # This file
├── .github/                # GitHub workflows & templates
└── package.json            # Node.js dependencies
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+)
- npm (v6+)
- Safaricom Daraja Portal account
- Internet connection for M-Pesa API

### 1. Installation

```bash
# Clone or navigate to project directory
cd MLOAN

# Install dependencies
npm install
```

### 2. M-Pesa Configuration

1. **Create Daraja Account**:
   - Go to [Safaricom Daraja Portal](https://developer.safaricom.co.ke/)
   - Create account and new app
   - Get Consumer Key and Consumer Secret

2. **Configure Credentials**:
   ```bash
   # Edit config/mpesa-config.js
   CONSUMER_KEY: 'your_consumer_key_here'
   CONSUMER_SECRET: 'your_consumer_secret_here'
   BUSINESS_SHORT_CODE: 'your_shortcode'
   PASSKEY: 'your_passkey'
   ```

3. **Set Callback URL**:
   ```bash
   # For local development with ngrok
   CALLBACK_URL: 'https://your-ngrok-url.com/api/mpesa-callback'
   ```

### 3. Environment Setup

Create `.env` file (optional):
```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa-callback
MPESA_ENVIRONMENT=sandbox
PORT=3000
```

### 4. Start Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Access the application at: `http://localhost:3000`

## 🔧 M-Pesa Integration Setup

### Development (Sandbox)

1. **Use Test Credentials**:
   - Business Short Code: `174379` (Safaricom test)
   - Passkey: Provided by Safaricom
   - Test phone numbers: `254708374149` or `254711XXXXXX`

2. **Expose Local Server**:
   ```bash
   # Install ngrok globally
   npm install -g ngrok
   
   # Expose port 3000
   ngrok http 3000
   
   # Update callback URL in config with ngrok URL
   ```

### Production

1. **Get Live Credentials**:
   - Apply for Go-Live on Daraja Portal
   - Get production Consumer Key/Secret
   - Get live Business Short Code and Passkey

2. **Update Configuration**:
   ```javascript
   ENVIRONMENT: 'production'
   CONSUMER_KEY: 'live_consumer_key'
   CONSUMER_SECRET: 'live_consumer_secret'
   CALLBACK_URL: 'https://yourdomain.com/api/mpesa-callback'
   ```

## 📱 API Endpoints

### Public Endpoints

- `GET /` - Homepage
- `GET /apply` - Loan application page
- `GET /api/health` - Health check

### M-Pesa Integration

- `POST /api/initiate-stk-push` - Initiate STK Push payment
- `GET /api/check-transaction-status/:id` - Check payment status
- `POST /api/mpesa-callback` - M-Pesa callback (internal)

### Example STK Push Request

```javascript
POST /api/initiate-stk-push
{
  "phoneNumber": "254712345678",
  "amount": 250,
  "accountReference": "LOAN-12345",
  "transactionDesc": "Loan processing fee",
  "applicationData": {
    "fullName": "John Doe",
    "loanAmount": 15000,
    // ... other application data
  }
}
```

## 🎨 Design Features

### Visual Elements

- **Glass Morphism**: Advanced backdrop-filter effects
- **Gold Theme**: Elegant #f59e0b color scheme
- **Animations**: CSS3 transforms and keyframes
- **Particles**: Dynamic background effects
- **Typography**: Inter font with weight variations

### Responsive Design

- Mobile-first approach
- Bootstrap 5.3.3 grid system
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🔒 Security Features

- Input validation and sanitization
- Phone number format validation
- Amount validation and limits
- Secure M-Pesa token handling
- Error handling and logging
- HTTPS enforcement (production)

## 📊 Loan Options

| Amount | Period | Processing Fee | Features |
|--------|--------|----------------|----------|
| KSh 15,000 | 30 days | KSh 250 | Instant approval |
| KSh 25,000 | 45 days | KSh 400 | Extended repayment |
| KSh 50,000 | 60 days | KSh 650 | Business friendly |
| KSh 75,000 | 90 days | KSh 900 | Premium tier |
| KSh 100,000 | 120 days | KSh 1,200 | Maximum amount |

## 🛠️ Development

### Available Scripts

```bash
npm run dev        # Start with nodemon
npm start          # Start production server
npm run setup      # Install deps and show setup message
npm run lint       # ESLint code checking
npm run format     # Prettier code formatting
```

### Adding Features

1. **Frontend Changes**: Edit `frontend/` HTML files
2. **Backend Logic**: Modify `backend/server.js`
3. **M-Pesa Integration**: Update `backend/mpesa-service.js`
4. **Configuration**: Adjust `config/mpesa-config.js`

### Testing

1. **Sandbox Testing**:
   - Use Safaricom test numbers
   - Test with amounts 1-100 KSh
   - Check Daraja Portal logs

2. **Local Testing**:
   ```bash
   curl -X POST http://localhost:3000/api/health
   ```

## 🚀 Deployment

### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create kopesha-loan-app

# Set environment variables
heroku config:set MPESA_CONSUMER_KEY=your_key
heroku config:set MPESA_CONSUMER_SECRET=your_secret
heroku config:set MPESA_CALLBACK_URL=https://kopesha-loan-app.herokuapp.com/api/mpesa-callback

# Deploy
git push heroku main
```

### VPS Deployment

```bash
# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start backend/server.js --name "kopesha-loan"

# Setup nginx reverse proxy
sudo nano /etc/nginx/sites-available/kopesha

# Enable SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

## 🔧 Troubleshooting

### Common Issues

1. **M-Pesa "Invalid Access Token"**:
   - Check Consumer Key/Secret
   - Verify credentials are for correct environment
   - Ensure internet connectivity

2. **STK Push Not Received**:
   - Verify phone number format (254XXXXXXXXX)
   - Check if number is M-Pesa registered
   - Confirm Business Short Code is correct

3. **Callback Not Working**:
   - Ensure callback URL is publicly accessible
   - Use HTTPS for production callbacks
   - Check firewall settings

4. **Server Not Starting**:
   ```bash
   # Check if port is in use
   netstat -ano | findstr :3000
   
   # Kill process using port
   taskkill /PID <PID> /F
   ```

### Debug Mode

```bash
# Enable detailed logging
DEBUG=* npm run dev

# Check M-Pesa configuration
node -e "console.log(require('./config/mpesa-config'))"
```

## 📚 Resources

- [Safaricom Daraja API Documentation](https://developer.safaricom.co.ke/Documentation)
- [M-Pesa STK Push Guide](https://developer.safaricom.co.ke/docs?javascript#lipa-na-m-pesa-online-payment)
- [Express.js Documentation](https://expressjs.com/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/5.3/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] Advanced credit scoring
- [ ] SMS notifications
- [ ] Email integration
- [ ] Admin dashboard
- [ ] Mobile app (React Native)
- [ ] Machine learning risk assessment
- [ ] Multiple payment methods
- [ ] Loan history tracking

## 📞 Support

For support and questions:
- Email: support@kopesha.com
- Phone: +254 700 000 000
- Website: https://kopesha.com

---

**⚡ Built with ❤️ for instant financial solutions in Kenya**