#!/bin/bash

# EC2 Ubuntu Server Setup Script for FundFast Deployment
# Run this script on your EC2 instance to prepare it for GitHub Actions deployment

echo "🚀 Setting up EC2 Ubuntu Server for FundFast deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    print_warning "This script should be run as the ubuntu user"
    print_status "Switching to ubuntu user..."
    sudo -u ubuntu -H bash -c "$(cat << 'SCRIPT_EOF'
#!/bin/bash

# Ensure we're in the home directory
cd /home/ubuntu

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "Installing essential packages..."
sudo apt install -y curl wget git build-essential

# Install Node.js 18
echo "Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "Node.js installed: $(node --version)"
else
    echo "Node.js already installed: $(node --version)"
fi

# Install PM2 globally
echo "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo "PM2 installed successfully"
else
    echo "PM2 already installed"
fi

# Create application directory
echo "Setting up application directory..."
sudo mkdir -p /home/ubuntu/kopesha-loan-app
sudo chown -R ubuntu:ubuntu /home/ubuntu/kopesha-loan-app

# Setup SSH directory with proper permissions
echo "Setting up SSH directory..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Install and configure firewall
echo "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp

# Install Nginx (optional but recommended)
echo "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Create basic Nginx configuration
sudo tee /etc/nginx/sites-available/fundfast > /dev/null << 'NGINX_CONF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://kopesha.mkopaji.com:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
NGINX_CONF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/fundfast /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Create logs directory for PM2
sudo mkdir -p /var/log/pm2
sudo chown -R ubuntu:ubuntu /var/log/pm2

# Setup log rotation for PM2
echo "Setting up log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Setup PM2 startup script
echo "Setting up PM2 startup..."
pm2 startup | grep 'sudo' | bash
pm2 save

echo "✅ EC2 server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Add your public SSH key to ~/.ssh/authorized_keys"
echo "2. Configure GitHub repository secrets:"
echo "   - EC2_SSH_PRIVATE_KEY: Your private SSH key"
echo "   - EC2_HOST: $(curl -s ifconfig.me)"
echo "3. Test SSH connection from your local machine"
echo "4. Push code to main branch to trigger deployment"
echo ""
echo "🔍 Server information:"
echo "- Server IP: $(curl -s ifconfig.me)"
echo "- Node.js version: $(node --version)"
echo "- npm version: $(npm --version)"
echo "- PM2 version: $(pm2 --version)"
echo "- Git version: $(git --version)"
echo ""
echo "📝 SSH public key setup:"
echo "Run this command on your local machine:"
echo "ssh-copy-id ubuntu@$(curl -s ifconfig.me)"
echo ""
echo "Or manually add your public key:"
echo "echo 'your-public-key-here' >> ~/.ssh/authorized_keys"

SCRIPT_EOF
)"
    exit 0
fi

# If we're already running as ubuntu, execute the setup
print_status "Running setup as ubuntu user..."

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git build-essential

# Install Node.js 18
print_status "Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed: $(node --version)"
else
    print_success "Node.js already installed: $(node --version)"
fi

# Install PM2 globally
print_status "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_success "PM2 already installed"
fi

# Create application directory
print_status "Setting up application directory..."
sudo mkdir -p /home/ubuntu/kopesha-loan-app
sudo chown -R ubuntu:ubuntu /home/ubuntu/kopesha-loan-app

# Setup SSH directory with proper permissions
print_status "Setting up SSH directory..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Install and configure firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp

# Install Nginx (optional but recommended)
print_status "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Create basic Nginx configuration
sudo tee /etc/nginx/sites-available/fundfast > /dev/null << 'NGINX_CONF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
NGINX_CONF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/fundfast /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Create logs directory for PM2
sudo mkdir -p /var/log/pm2
sudo chown -R ubuntu:ubuntu /var/log/pm2

# Setup log rotation for PM2
print_status "Setting up log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Setup PM2 startup script
print_status "Setting up PM2 startup..."
pm2 startup | grep 'sudo' | bash
pm2 save

print_success "✅ EC2 server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Add your public SSH key to ~/.ssh/authorized_keys"
echo "2. Configure GitHub repository secrets:"
echo "   - EC2_SSH_PRIVATE_KEY: Your private SSH key"
echo "   - EC2_HOST: $(curl -s ifconfig.me)"
echo "3. Test SSH connection from your local machine"
echo "4. Push code to main branch to trigger deployment"
echo ""
echo "🔍 Server information:"
echo "- Server IP: $(curl -s ifconfig.me)"
echo "- Node.js version: $(node --version)"
echo "- npm version: $(npm --version)"
echo "- PM2 version: $(pm2 --version)"
echo "- Git version: $(git --version)"
echo ""
echo "📝 SSH public key setup:"
echo "Run this command on your local machine:"
echo "ssh-copy-id ubuntu@$(curl -s ifconfig.me)"
echo ""
echo "Or manually add your public key:"
echo "echo 'your-public-key-here' >> ~/.ssh/authorized_keys"