#!/bin/bash

# FUNDFAST Production Deployment Script
# This script helps deploy FUNDFAST to a production server

echo "🚀 FUNDFAST Production Deployment Starting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user for security."
fi

# Check Node.js version
print_status "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check if version is 16 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_error "Node.js 16+ required. Current version: $NODE_VERSION"
        exit 1
    fi
else
    print_error "Node.js not found. Please install Node.js 16+ first."
    exit 1
fi

# Check npm
print_status "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm first."
    exit 1
fi

# Install dependencies
print_status "Installing production dependencies..."
npm ci --only=production
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_status "Creating template .env.production file..."
    cp .env.example .env.production
    print_warning "Please edit .env.production with your actual production credentials"
    print_warning "You need to add your IntaSend production keys:"
    print_warning "  - INTASEND_PUBLISHABLE_KEY=ISPubKey_live_your_key"
    print_warning "  - INTASEND_SECRET_KEY=ISSecretKey_live_your_secret"
    exit 1
fi

# Check environment variables
print_status "Checking production environment variables..."

# Check IntaSend keys
if grep -q "YOUR_ACTUAL_PRODUCTION_KEY_HERE" .env.production; then
    print_error "IntaSend production keys not configured in .env.production"
    print_status "Please get your production keys from https://intasend.com/"
    exit 1
fi

# Install PM2 if not present
print_status "Checking PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
    if [ $? -eq 0 ]; then
        print_success "PM2 installed successfully"
    else
        print_error "Failed to install PM2"
        exit 1
    fi
else
    print_success "PM2 already installed"
fi

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'fundfast',
    script: 'backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Test the application
print_status "Testing application startup..."
timeout 10s node backend/server.js &
APP_PID=$!
sleep 5

if kill -0 $APP_PID 2>/dev/null; then
    print_success "Application starts successfully"
    kill $APP_PID
else
    print_error "Application failed to start"
    exit 1
fi

# Start with PM2
print_status "Starting FUNDFAST with PM2..."
pm2 start ecosystem.config.js --env production

if [ $? -eq 0 ]; then
    print_success "FUNDFAST started successfully with PM2"
else
    print_error "Failed to start FUNDFAST with PM2"
    exit 1
fi

# Save PM2 configuration
pm2 save
pm2 startup

# Setup log rotation
print_status "Setting up log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Setup basic firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    print_status "Configuring firewall..."
    ufw allow 22    # SSH
    ufw allow 80    # HTTP
    ufw allow 443   # HTTPS
    ufw allow 3000  # Application port
    print_success "Firewall configured"
fi

# Final checks
print_status "Performing final health checks..."

# Check if application is responding
sleep 3
if curl -f http://localhost:3000/api/health &> /dev/null; then
    print_success "Application health check passed"
else
    print_warning "Application health check failed - please check logs"
fi

# Display status
print_status "Deployment Summary:"
echo "===================="
pm2 status
echo ""

print_success "🎉 FUNDFAST Production Deployment Complete!"
echo ""
print_status "Next Steps:"
echo "1. Configure your domain and SSL certificate"
echo "2. Update callback URLs in IntaSend dashboard"
echo "3. Test with a small transaction"
echo "4. Monitor logs: pm2 logs fundfast"
echo "5. Monitor application: pm2 monit"
echo ""
print_status "Useful Commands:"
echo "- View logs: pm2 logs fundfast"
echo "- Restart app: pm2 restart fundfast"
echo "- Stop app: pm2 stop fundfast"
echo "- Monitor: pm2 monit"
echo "- Health check: curl http://localhost:3000/api/health"
echo ""
print_warning "Remember to:"
echo "- Setup SSL certificate (Let's Encrypt recommended)"
echo "- Configure reverse proxy (Nginx recommended)"
echo "- Setup backup strategy"
echo "- Configure monitoring and alerts"

# Check for common issues
print_status "Checking for common issues..."

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    print_warning "Disk usage is $DISK_USAGE%. Consider cleaning up disk space."
fi

# Check memory
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    print_warning "Memory usage is $MEMORY_USAGE%. Consider adding more RAM."
fi

print_success "Deployment script completed successfully!"