# GitHub Actions Deployment Setup Guide

## Overview
This guide helps you set up automated deployment of your Express application to an EC2 Ubuntu server using GitHub Actions.

## Prerequisites

### 1. EC2 Server Setup
- Ubuntu 22.04 LTS or later
- Node.js 18+ installed
- PM2 installed globally
- Git installed
- Your application repository cloned to `/home/ubuntu/kopesha-loan-app`

### 2. EC2 Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt-get install -y git

# Create application directory
sudo mkdir -p /home/ubuntu/kopesha-loan-app
sudo chown ubuntu:ubuntu /home/ubuntu/kopesha-loan-app

# Clone your repository
cd /home/ubuntu
git clone https://github.com/benardcheruiyot/mloan.git kopesha-loan-app
cd kopesha-loan-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env.production
# Edit .env.production with your production settings
nano .env.production

# Initial PM2 setup
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## GitHub Secrets Configuration

### Required Secrets
Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### `EC2_SSH_PRIVATE_KEY`
Your private SSH key for connecting to EC2 instance:
```bash
# Generate SSH key pair (if not already done)
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com"

# Copy private key content
cat ~/.ssh/id_rsa
```
Copy the entire content including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

#### `EC2_HOST`
Your EC2 instance public IP address or domain name:
```
example: 12.34.56.78
or: your-domain.com
```

### Optional Secrets

#### `SLACK_WEBHOOK_URL`
For deployment notifications (optional):
```
https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

## SSH Key Setup on EC2

```bash
# On your EC2 instance, add the public key to authorized_keys
echo "your-public-key-content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

## Environment Variables

### Required Environment Files on Server
Create `/home/ubuntu/kopesha-loan-app/.env.production`:

```env
NODE_ENV=production
PORT=3000

# M-Pesa Configuration
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_PASSKEY=your_production_passkey
MPESA_SHORTCODE=your_production_shortcode

# Database (if applicable)
DATABASE_URL=your_production_database_url

# Other production settings
LOG_LEVEL=info
```

## Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Application port
sudo ufw status
```

## SSL Certificate (Recommended)

### Using Certbot for Let's Encrypt:
```bash
# Install Certbot
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Generate certificate
sudo certbot --nginx -d your-domain.com
```

### Nginx Reverse Proxy Setup:
```bash
# Install Nginx
sudo apt install nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/kopesha-loan-app
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kopesha-loan-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Monitoring Setup

### PM2 Monitoring
```bash
# Install PM2 monitoring
npm install -g @pm2/io

# Setup monitoring
pm2 install pm2-server-monit
```

### Log Rotation
```bash
# Install log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## Deployment Workflow

### Automatic Deployment
- Push to `main` branch triggers automatic deployment
- Tests run first, then deployment only if tests pass
pm2 logs --lines 50
- Rollback available if deployment fails

### Manual Deployment
- Go to GitHub Actions tab
- Select "Deploy to EC2 Ubuntu Server" workflow
- Click "Run workflow" button

### Monitoring Deployment
```bash
# On your EC2 server, monitor the deployment
pm2 logs fundfast-production --lines 50
pm2 logs
curl http://localhost:3000/api/health
```

## Troubleshooting

### Common Issues

#### SSH Connection Failed
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa
pm2 logs
```

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs fundfast-production
# Check environment variables
cat .env.production
# Check disk space
df -h
```

#### Health Check Failed
```bash
# Check if app is running
pm2 status
# Check application logs
pm2 logs fundfast-production
# Test manually
curl http://localhost:3000/api/health
```

### Debug Mode
To enable debug mode during deployment, add this secret:
- `DEBUG_MODE`: `true`

## Security Best Practices

1. **Use environment variables** for all sensitive data
2. **Rotate SSH keys** regularly
3. **Enable firewall** and limit open ports
4. **Use HTTPS** with SSL certificates
5. **Regular security updates** on the server
6. **Monitor logs** for suspicious activity
7. **Backup strategy** for data and configurations

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Check PM2 logs on server: `pm2 logs fundfast-production`
3. Verify environment configuration
4. Check server resources (CPU, memory, disk)
5. Review firewall settings