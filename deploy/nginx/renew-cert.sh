#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  deploy/nginx/renew-cert.sh
#  Tự động gia hạn cert và reload nginx
#  Cron: 0 3 * * * root /var/www/deploy/nginx/renew-cert.sh >> /var/log/certbot-renew.log 2>&1
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bắt đầu renewal check..."
certbot renew --quiet --deploy-hook "systemctl reload nginx"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Renewal check hoàn tất."
