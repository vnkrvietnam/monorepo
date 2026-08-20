#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  deploy/nginx/setup-ssl.sh
#  Cấu hình Nginx + Let's Encrypt TLS cho app.vnkr.vn → localhost:3010
#
#  Chạy: sudo bash deploy/nginx/setup-ssl.sh
#  Yêu cầu:
#    - Ubuntu 20.04 / 22.04 / 24.04
#    - DNS app.vnkr.vn đã trỏ đúng về IP của server này
#    - Port 80 và 443 mở trên firewall
#    - Next.js app đang chạy tại localhost:3010
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Config ─────────────────────────────────────────────────────────────────────
DOMAIN="app.vnkr.vn"
EMAIL="ops@vnkr.vn"          # email nhận cảnh báo cert sắp hết hạn
APP_PORT=3010
NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
CERTBOT_WEBROOT="/var/www/certbot"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Màu terminal ───────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Kiểm tra root ──────────────────────────────────────────────────────────────
[[ $EUID -eq 0 ]] || error "Script phải chạy với quyền root: sudo bash $0"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   VNKR — Nginx + Let's Encrypt SSL Setup               ║"
echo "║   Domain: $DOMAIN → localhost:$APP_PORT              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Bước 1: Cài nginx + certbot nếu chưa có ──────────────────────────────────
info "Bước 1/6: Kiểm tra và cài đặt nginx, certbot..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx > /dev/null
success "nginx $(nginx -v 2>&1 | grep -o '[0-9.]*$') và certbot đã sẵn sàng"

# ── Bước 2: Kiểm tra Next.js app đang chạy ────────────────────────────────────
info "Bước 2/6: Kiểm tra Next.js trên port $APP_PORT..."
if ! ss -tlnp | grep -q ":$APP_PORT"; then
    warn "Không tìm thấy process lắng nghe port $APP_PORT."
    warn "Hãy đảm bảo app đang chạy: cd apps/app-web && node_modules/.bin/next start -p $APP_PORT &"
    read -r -p "Tiếp tục không? [y/N] " yn
    [[ "$yn" =~ ^[Yy]$ ]] || error "Hủy bởi người dùng."
else
    success "Next.js đang chạy tại localhost:$APP_PORT"
fi

# ── Bước 3: Kiểm tra DNS ──────────────────────────────────────────────────────
info "Bước 3/6: Kiểm tra DNS $DOMAIN..."
SERVER_IP=$(curl -s --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
DOMAIN_IP=$(dig +short "$DOMAIN" 2>/dev/null | tail -1)

echo "  Server IP  : $SERVER_IP"
echo "  $DOMAIN IP : ${DOMAIN_IP:-<không phân giải được>}"

if [[ "$SERVER_IP" != "$DOMAIN_IP" ]]; then
    warn "DNS CHƯA TRỎ đúng!"
    warn "  → Cần trỏ $DOMAIN A record → $SERVER_IP"
    warn "  → Certbot HTTP-01 sẽ thất bại nếu DNS sai"
    warn "  → Tuy nhiên, sẽ tiếp tục thiết lập nginx (HTTP proxy)."
    warn "  → Chạy lại script sau khi DNS đã cập nhật để lấy SSL."
    DNS_OK=false
else
    success "DNS trỏ đúng: $DOMAIN → $SERVER_IP"
    DNS_OK=true
fi

# ── Bước 4: Tạo webroot cho ACME challenge ────────────────────────────────────
info "Bước 4/6: Tạo webroot certbot..."
mkdir -p "$CERTBOT_WEBROOT"
success "Webroot: $CERTBOT_WEBROOT"

# ── Bước 5: Triển khai nginx config HTTP-only trước ───────────────────────────
info "Bước 5/6: Triển khai nginx config..."

# Disable default site nếu còn
rm -f "$NGINX_ENABLED_DIR/default" 2>/dev/null || true

# Copy HTTP-only config trước để certbot có thể dùng
cp "$SCRIPT_DIR/app.vnkr.vn.conf.http-only" "$NGINX_CONF_DIR/$DOMAIN"
ln -sf "$NGINX_CONF_DIR/$DOMAIN" "$NGINX_ENABLED_DIR/$DOMAIN"

# Test config
nginx -t 2>&1 || error "Nginx config lỗi — kiểm tra output bên trên"
systemctl reload nginx
success "Nginx HTTP config đã kích hoạt"

# ── Bước 6: Lấy SSL cert ─────────────────────────────────────────────────────
if [[ "$DNS_OK" == true ]]; then
    info "Bước 6/6: Lấy SSL certificate từ Let's Encrypt..."

    certbot certonly \
        --webroot \
        --webroot-path "$CERTBOT_WEBROOT" \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --keep-until-expiring \
        2>&1 || error "Certbot thất bại — kiểm tra DNS và port 80"

    success "Cert đã được cấp tại /etc/letsencrypt/live/$DOMAIN/"

    # Chuyển sang HTTPS full config
    info "Chuyển sang HTTPS config đầy đủ..."
    cp "$SCRIPT_DIR/app.vnkr.vn.conf" "$NGINX_CONF_DIR/$DOMAIN"
    nginx -t 2>&1 || error "HTTPS nginx config lỗi"
    systemctl reload nginx
    success "HTTPS đã kích hoạt cho $DOMAIN"

    # Thiết lập auto-renewal
    info "Thiết lập auto-renewal (systemd timer)..."
    systemctl enable certbot.timer
    systemctl start certbot.timer
    success "Auto-renewal: $(systemctl is-active certbot.timer)"

    # Test renewal dry-run
    info "Kiểm tra renewal dry-run..."
    certbot renew --dry-run --quiet 2>&1 && success "Renewal dry-run OK" || warn "Renewal dry-run có cảnh báo — kiểm tra logs"

else
    warn "Bước 6/6: BỎ QUA SSL (DNS chưa đúng) — chạy lại sau khi DNS cập nhật:"
    warn "  sudo bash $SCRIPT_DIR/setup-ssl.sh"
fi

# ── Kiểm tra cuối ─────────────────────────────────────────────────────────────
echo ""
echo "═══ KẾT QUẢ ═══════════════════════════════════════════════"
echo ""
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:80" 2>/dev/null || echo "N/A")
echo "  Nginx status   : $(systemctl is-active nginx)"
echo "  HTTP (port 80) : $HTTP_STATUS"
if [[ "$DNS_OK" == true ]]; then
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" 2>/dev/null || echo "N/A")
    echo "  HTTPS $DOMAIN : $HTTPS_STATUS"
    CERT_EXPIRY=$(certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 | awk '{print $3, $4}')
    echo "  Cert expiry    : $CERT_EXPIRY"
fi
echo ""
echo "  Access logs: /var/log/nginx/$DOMAIN.access.log"
echo "  Error  logs: /var/log/nginx/$DOMAIN.error.log"
echo ""
if [[ "$DNS_OK" == true ]]; then
    echo -e "  ${GREEN}✅ XONG! Truy cập: https://$DOMAIN${NC}"
else
    echo -e "  ${YELLOW}⏳ Đang chạy HTTP. Cập nhật DNS rồi chạy lại script để bật HTTPS.${NC}"
    echo -e "  ${CYAN}   Thêm A record: $DOMAIN → $SERVER_IP${NC}"
fi
echo ""
