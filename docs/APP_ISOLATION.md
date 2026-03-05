# App Isolation Runbook (Best Practice)

This app is now configurable for isolated deployment per app instance, so it does not conflict with other apps on the same server.

## 1) Use dedicated app identity
Set unique values per app deployment:

```bash
export APP_NAME=stan
export APP_DOMAIN=mkopaji.com
export APP_PORT=3004
```

- `APP_NAME`: PM2 process + Nginx site identity
- `APP_DOMAIN`: dedicated domain for this app only
- `APP_PORT`: upstream Node.js port (not publicly exposed)

## 2) Prepare EC2 host
Run:

```bash
APP_NAME=stan APP_DOMAIN=mkopaji.com APP_PORT=3004 ./setup-ec2-server.sh
```

This configures:
- Nginx site for only this app/domain
- UFW for SSH/80/443 only
- PM2 baseline and log rotation

## 3) Issue/repair TLS cert and routing
Run on server as root:

```bash
sudo APP_NAME=stan APP_DOMAIN=mkopaji.com APP_PORT=3004 ./tools/fix_mkopaji_www_tls_noninteractive.sh
```

This creates SAN certificate for:
- `mkopaji.com`
- `www.mkopaji.com`

And enforces:
- `http` -> `https`
- `www` -> apex redirect
- HTTPS reverse proxy to `127.0.0.1:${APP_PORT}`

## 4) Keep callbacks on app domain
In `.env.production`:

- `MPESA_CALLBACK_URL=https://mkopaji.com/api/mpesa-callback`
- `MPESA_TIMEOUT_URL=https://mkopaji.com/api/mpesa-timeout`
- `MPESA_RESULT_URL=https://mkopaji.com/api/mpesa-result`

## 5) Verify

```bash
curl -I https://mkopaji.com
curl -I https://www.mkopaji.com
curl https://mkopaji.com/api/health
```

If certificate mismatch persists, check DNS A records for `mkopaji.com` and `www.mkopaji.com` both pointing to the same server IP.
