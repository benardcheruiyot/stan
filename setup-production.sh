# Test Production Configuration
# This demonstrates how to configure production M-Pesa

# Copy your current .env to .env.sandbox for safekeeping
cp .env .env.sandbox

# Example production configuration


echo "✅ Created .env.production template"
echo ""
echo "🔧 TO SWITCH TO PRODUCTION:"
echo "1. Update .env.production with your real credentials"
echo "2. Run: cp .env.production .env"
echo "3. Start server: node backend/server.js"
echo ""
echo "🔧 TO SWITCH BACK TO SANDBOX:"
echo "1. Run: cp .env.sandbox .env"
echo "2. Start server: node backend/server.js"