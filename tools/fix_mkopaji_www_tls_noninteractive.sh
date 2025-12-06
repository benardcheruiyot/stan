#!/usr/bin/env bash
# Non-interactive script to fix www -> apex redirect, obtain SAN certs, and reload nginx
# Intended to be run on the server as root (e.g., via SSH action)
set -euo pipefail

DOMAIN="hella.mkopaji.com"
WWW="www.hella.mkopaji.com"
SITE_CONF="/etc/nginx/sites-available/mkopaji.conf"
SITE_LINK="/etc/nginx/sites-enabled/mkopaji.conf"
BACKUP_DIR="/root/nginx-backups-$(date +%Y%m%d-%H%M%S)"

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root. Exiting." >&2
  exit 2
fi

echo "Backing up nginx configs to ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"
cp /etc/nginx/nginx.conf "${BACKUP_DIR}/nginx.conf.bak" 2>/dev/null || true
cp -r /etc/nginx/sites-available "${BACKUP_DIR}/sites-available.bak" 2>/dev/null || true
cp -r /etc/nginx/sites-enabled "${BACKUP_DIR}/sites-enabled.bak" 2>/dev/null || true

cat > "${SITE_CONF}.new" <<'NGINX_CONF'
# mkopaji site config - created by automation
server {
  listen 80;
  server_name hella.mkopaji.com www.hella.mkopaji.com;
  return 301 https://hella.mkopaji.com$request_uri;
}

server {
  listen 443 ssl;
  ssl_certificate /etc/letsencrypt/live/hella.mkopaji.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/hella.mkopaji.com/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# Ensure www HTTPS redirects to apex
server {
  listen 443 ssl;
  server_name www.hella.mkopaji.com;
  ssl_certificate /etc/letsencrypt/live/hella.mkopaji.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/hella.mkopaji.com/privkey.pem;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
  return 301 https://hella.mkopaji.com$request_uri;
}
NGINX_CONF

mv "${SITE_CONF}.new" "${SITE_CONF}"
ln -sf "${SITE_CONF}" "${SITE_LINK}"

if ! nginx -t; then
  echo "nginx config test failed. Restoring backups and exiting." >&2
    server_name www.yourdomain.com;
  rm -f "${SITE_CONF}" || true
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
fi
    return 301 https://yourdomain.com$request_uri;
systemctl reload nginx || true

# Install certbot if missing (apt-based systems)
if ! command -v certbot >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx
  else
    echo "certbot not installed and apt-get not found. Install certbot manually." >&2
    exit 4
  fi
fi

# Try certbot nginx plugin first
set +e
certbot --nginx -d "${DOMAIN}" -d "${WWW}" --non-interactive --agree-tos --email admin@${DOMAIN}
CERTBOT_EXIT=$?
set -e

if [[ ${CERTBOT_EXIT} -ne 0 ]]; then
  echo "certbot --nginx failed; attempting standalone issuance"
  systemctl stop nginx || true
  certbot certonly --standalone -d "${DOMAIN}" -d "${WWW}" --non-interactive --agree-tos --email admin@${DOMAIN}
  CERTBOT_EXIT=$?
  systemctl start nginx || true
  if [[ ${CERTBOT_EXIT} -ne 0 ]]; then
    echo "certbot failed. Check certbot logs on the server." >&2
    exit 5
  fi
fi

# reload nginx to pick up certs
systemctl reload nginx || true

echo "Verification: headers for main endpoints"
curl -I --max-time 10 http://www.${DOMAIN} || true
curl -I --max-time 10 http://${DOMAIN} || true
curl -I --max-time 10 https://${DOMAIN} || true
curl -I --max-time 10 https://www.${DOMAIN} || true

echo "Script complete. Backups stored in ${BACKUP_DIR}."
