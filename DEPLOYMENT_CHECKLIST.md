# Deployment Checklist

## Pre-Deployment Setup ✅

### 1. Server Requirements
- [ ] Ubuntu 22.04 LTS server running
- [ ] Node.js 18+ installed
- [ ] PM2 installed globally
- [ ] Git installed
- [ ] SSH key pair generated
- [ ] Public key added to server's `~/.ssh/authorized_keys`
- [ ] Repository cloned to `/home/ubuntu/kopesha-loan-app`

### 2. GitHub Repository Secrets
- [ ] `EC2_SSH_PRIVATE_KEY` - Your private SSH key
- [ ] `EC2_HOST` - Your server IP address or domain
- [ ] `SLACK_WEBHOOK_URL` - (Optional) For deployment notifications

### 3. Server Configuration
- [ ] Environment file `.env.production` configured
- [ ] Firewall configured (ports 22, 80, 443, 3000)
- [ ] SSL certificate installed (recommended)
- [ ] Nginx reverse proxy configured (recommended)

### 4. Application Configuration
- [ ] M-Pesa production credentials configured
- [ ] Callback URLs updated in M-Pesa dashboard
- [ ] Domain/IP configured in application settings

## Deployment Process ✅

### Manual First Deployment
```bash
# 1. SSH into your server
ssh ubuntu@your-server-ip

# 2. Navigate to app directory
cd /home/ubuntu/kopesha-loan-app

# 3. Install dependencies
npm ci --only=production

# 4. Configure environment
cp .env.production.template .env.production
nano .env.production  # Edit with your actual values

# 5. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 6. Test health endpoint
curl http://localhost:3000/api/health
```

### GitHub Actions Automated Deployment
- [ ] Push code to `main` branch
- [ ] Check GitHub Actions workflow status
- [ ] Verify deployment success
- [ ] Test application functionality

## Post-Deployment Verification ✅

### 1. Health Checks
- [ ] Application starts without errors
- [ ] Health endpoint responds: `curl http://localhost:3000/api/health`
- [ ] PM2 shows app running: `pm2 status`
- [ ] Logs are clean: `pm2 logs fundfast-production`

### 2. Functionality Tests
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] Loan application form works
- [ ] M-Pesa integration works (test with small amount)
- [ ] All API endpoints respond correctly

### 3. Security Checks
- [ ] SSL certificate working (if configured)
- [ ] HTTPS redirects working (if configured)
- [ ] Firewall rules active
- [ ] No sensitive data in logs
- [ ] Environment variables properly set

### 4. Performance Checks
- [ ] Response times acceptable
- [ ] Memory usage normal: `pm2 monit`
- [ ] CPU usage normal
- [ ] Disk space sufficient: `df -h`

## Monitoring Setup ✅

### 1. Log Management
- [ ] PM2 log rotation configured
- [ ] Application logs accessible
- [ ] Error logs monitored
- [ ] Access logs (if nginx configured)

### 2. Application Monitoring
- [ ] PM2 monitoring enabled: `pm2 monit`
- [ ] Health check endpoint monitored
- [ ] Uptime monitoring configured
- [ ] Alert system configured (optional)

### 3. Server Monitoring
- [ ] System resources monitored
- [ ] Disk space alerts configured
- [ ] Memory usage alerts configured
- [ ] CPU usage alerts configured

## Rollback Plan ✅

### Automated Rollback
- GitHub Actions includes automatic rollback on deployment failure
- Backup is created before each deployment

### Manual Rollback
```bash
# If automated rollback fails
ssh ubuntu@your-server-ip
cd /home/ubuntu/kopesha-loan-app

# Stop current version
pm2 stop fundfast-production

# Restore from backup
cp -r backup/* ./
npm ci --only=production

# Restart
pm2 start ecosystem.config.js --env production
```

## Maintenance Tasks ✅

### Daily
- [ ] Check application logs for errors
- [ ] Monitor system resources
- [ ] Verify health endpoint status

### Weekly
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Check PM2 status and logs
- [ ] Review performance metrics
- [ ] Test backup/restore procedures

### Monthly
- [ ] Rotate SSH keys
- [ ] Update SSL certificates (if manual)
- [ ] Review and update dependencies
- [ ] Security audit

## Useful Commands ✅

### Application Management
```bash
# View application status
pm2 status

# View logs
pm2 logs fundfast-production

# Restart application
pm2 restart fundfast-production

# Stop application
pm2 stop fundfast-production

# Monitor resources
pm2 monit
```

### Server Management
```bash
# Check system resources
htop
df -h
free -h

# Check nginx status (if configured)
sudo systemctl status nginx

# Check firewall status
sudo ufw status

# View system logs
sudo journalctl -u nginx
```

### Health Checks
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test external access
curl https://your-domain.com/api/health

# Check SSL certificate
openssl s_client -connect your-domain.com:443
```

## Emergency Contacts ✅

- [ ] Server provider support contact
- [ ] Domain registrar support
- [ ] SSL certificate provider support
- [ ] Development team contacts
- [ ] M-Pesa integration support

## Documentation ✅

- [ ] Server access credentials documented
- [ ] Application configuration documented
- [ ] Deployment procedures documented
- [ ] Troubleshooting guide available
- [ ] Backup/restore procedures documented