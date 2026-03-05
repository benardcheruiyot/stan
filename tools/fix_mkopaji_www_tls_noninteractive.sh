#!/usr/bin/env bash
set -euo pipefail

# App-isolated TLS + Nginx fix (non-interactive)
# Usage:
#   sudo APP_NAME=stan APP_DOMAIN=app.example.com APP_PORT=3004 ./tools/fix_mkopaji_www_tls_noninteractive.sh

APP_NAME="${APP_NAME:-stan-app}"
APP_DOMAIN_RAW="${APP_DOMAIN:-app.example.com}"
DOMAIN="${APP_DOMAIN_RAW#www.}"
WWW="www.${DOMAIN}"
APP_PORT="${APP_PORT:-3004}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@${DOMAIN}}"
SITE_CONF="/etc/nginx/sites-available/${APP_NAME}.conf"
SITE_LINK="/etc/nginx/sites-enabled/${APP_NAME}.conf"
BACKUP_DIR="/root/nginx-backups-${APP_NAME}-$(date +%Y%m%d-%H%M%S)"

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root." >&2
  exit 2
fi

echo "Backing up nginx configs to ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"
cp /etc/nginx/nginx.conf "${BACKUP_DIR}/nginx.conf.bak" 2>/dev/null || true
cp -r /etc/nginx/sites-available "${BACKUP_DIR}/sites-available.bak" 2>/dev/null || true
cp -r /etc/nginx/sites-enabled "${BACKUP_DIR}/sites-enabled.bak" 2>/dev/null || true

if ! command -v certbot >/dev/null 2>&1; then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx
fi

# Obtain/renew SAN certificate first so cert paths exist in nginx config
set +e
certbot certonly --nginx -d "${DOMAIN}" -d "${WWW}" --non-interactive --agree-tos --email "${EMAIL}"
CERTBOT_EXIT=$?
set -e

if [[ ${CERTBOT_EXIT} -ne 0 ]]; then
  echo "certbot --nginx failed; trying standalone mode"
  systemctl stop nginx || true
  certbot certonly --standalone -d "${DOMAIN}" -d "${WWW}" --non-interactive --agree-tos --email "${EMAIL}"
  systemctl start nginx || true
fi

cat > "${SITE_CONF}.new" <<EOF
server {
  listen 80;
  server_name ${DOMAIN} ${WWW};
  return 301 https://${DOMAIN}\$request_uri;
}

server {
  listen 443 ssl http2;
  server_name ${DOMAIN};

  ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

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

server {
  listen 443 ssl http2;
  server_name ${WWW};

  ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

  return 301 https://${DOMAIN}\$request_uri;
}
EOF

mv "${SITE_CONF}.new" "${SITE_CONF}"
ln -sf "${SITE_CONF}" "${SITE_LINK}"
nginx -t
systemctl reload nginx

echo "Verification"
curl -I --max-time 10 "http://${DOMAIN}" || true
curl -I --max-time 10 "https://${DOMAIN}" || true
curl -I --max-time 10 "https://${WWW}" || true

echo "Done. Backups are in ${BACKUP_DIR}."
