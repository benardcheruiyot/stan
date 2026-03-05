#!/usr/bin/env bash
set -euo pipefail

# App-isolated EC2 setup script
# Usage:
#   APP_NAME=stan APP_DOMAIN=app.example.com APP_PORT=3004 ./setup-ec2-server.sh

APP_NAME="${APP_NAME:-stan-app}"
APP_DOMAIN="${APP_DOMAIN:-app.example.com}"
APP_PORT="${APP_PORT:-3004}"
APP_DIR="${APP_DIR:-/home/ubuntu/${APP_NAME}}"
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

if [[ "${USER}" != "ubuntu" ]]; then
  log_warn "Run as ubuntu user with sudo privileges for predictable paths and permissions."
fi

log_info "Updating system packages"
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

log_info "Installing base dependencies"
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl wget git build-essential nginx ufw

if ! command -v node >/dev/null 2>&1; then
  log_info "Installing Node.js 18"
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
fi
log_ok "Node.js: $(node --version)"

if ! command -v pm2 >/dev/null 2>&1; then
  log_info "Installing PM2"
  sudo npm install -g pm2
fi
log_ok "PM2: $(pm2 --version)"

log_info "Creating isolated app directory at ${APP_DIR}"
sudo mkdir -p "${APP_DIR}"
sudo chown -R ubuntu:ubuntu "${APP_DIR}"

log_info "Configuring UFW (SSH/HTTP/HTTPS only)"
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

log_info "Writing isolated Nginx site config ${NGINX_SITE}"
sudo tee "${NGINX_SITE}" >/dev/null <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN} www.${APP_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

sudo ln -sf "${NGINX_SITE}" "/etc/nginx/sites-enabled/${APP_NAME}"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

log_info "Configuring PM2 log rotation"
pm2 install pm2-logrotate >/dev/null 2>&1 || true
pm2 set pm2-logrotate:max_size 10M >/dev/null
pm2 set pm2-logrotate:retain 30 >/dev/null
pm2 set pm2-logrotate:compress true >/dev/null

log_info "Configuring PM2 startup"
PM2_STARTUP_CMD=$(pm2 startup systemd -u ubuntu --hp /home/ubuntu | grep '^sudo' || true)
if [[ -n "${PM2_STARTUP_CMD}" ]]; then
  eval "${PM2_STARTUP_CMD}"
fi
pm2 save

log_ok "EC2 base setup complete for app '${APP_NAME}'"
echo ""
echo "Next steps:"
echo "1) Deploy app code to: ${APP_DIR}"
echo "2) Start app with PM2 on port ${APP_PORT}"
echo "3) Issue dedicated TLS cert:"
echo "   sudo certbot --nginx -d ${APP_DOMAIN} -d www.${APP_DOMAIN}"
echo "4) Verify: https://${APP_DOMAIN}/api/health"
