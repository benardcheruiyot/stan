@echo off
echo 🚀 FUNDFAST - Activating Production Mode
echo =========================================
echo.

echo 📋 Step 1: Backing up current configuration...
if exist .env (
    copy .env .env.backup
    echo ✅ Current .env backed up to .env.backup
) else (
    echo ℹ️  No existing .env file found
)

echo.
echo 📋 Step 2: Activating production configuration...
copy .env.production.ready .env
echo ✅ Production configuration activated

echo.
echo 📋 Step 3: Setting up webhook for callbacks...
echo 🌐 Go to: https://webhook.site/
echo 📝 Copy your unique URL from webhook.site
echo ⚙️  Replace the webhook URLs in .env with your URL
echo.

echo 📋 Next steps:
echo 1. Open .env file and update webhook URLs
echo 2. Run: node backend/server.js
echo 3. Test with small amounts (KES 1-10)
echo 4. Watch webhook.site for M-Pesa callbacks
echo.

echo 🔴 PRODUCTION MODE - Real money transactions!
echo 💰 Start with KES 1-10 for testing
echo.

pause