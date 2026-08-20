#!/usr/bin/env bash
# =============================================================================
#  VNKR TECH HOLDING — Full-Stack Deploy Script
#  /var/www/deploy/deploy.sh
#
#  Chức năng:
#    1. Khởi động Redis + PostgreSQL (Docker)
#    2. Chạy DB schema + seed (01_schema → 02_seed → 03_views → 04_roles)
#    3. Khởi động / reload Nginx
#    4. Build monorepo (pnpm install + turbo build)
#    5. Khởi động tất cả apps qua PM2 (ecosystem.config.cjs)
#
#  Sử dụng:
#    chmod +x deploy/deploy.sh
#    sudo ./deploy/deploy.sh [--skip-build] [--skip-nginx] [--infra-only]
#
#  Flags:
#    --skip-build   Bỏ qua bước pnpm install & turbo build
#    --skip-nginx   Không chạm vào cấu hình nginx
#    --infra-only   Chỉ khởi động infra (Redis, Postgres) rồi thoát
# =============================================================================

set -euo pipefail

# ── Màu sắc terminal ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Đường dẫn gốc ────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="${REPO_ROOT}/deploy"
DOCKER_COMPOSE_FILE="${DEPLOY_DIR}/docker/docker-compose.yml"
NGINX_CONF_DIR="${DEPLOY_DIR}/nginx"
ECOSYSTEM_FILE="${REPO_ROOT}/ecosystem.config.cjs"
ENV_FILE="${REPO_ROOT}/.env"

# ── Parse flags ───────────────────────────────────────────────────────────────
SKIP_BUILD=false
SKIP_NGINX=false
INFRA_ONLY=false

for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    --skip-nginx) SKIP_NGINX=true ;;
    --infra-only) INFRA_ONLY=true ;;
    *) echo -e "${RED}Unknown flag: $arg${NC}"; exit 1 ;;
  esac
done

# ── Hàm helper ───────────────────────────────────────────────────────────────
log()  { echo -e "${CYAN}[deploy]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
fail() { echo -e "${RED}[✗] $*${NC}"; exit 1; }

section() {
  echo ""
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${CYAN}  $*${NC}"
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════${NC}"
}

wait_healthy() {
  local name="$1"
  local max_wait="${2:-60}"
  local elapsed=0
  log "Đang chờ container '${name}' healthy..."
  while true; do
    local status
    status=$(docker inspect --format='{{.State.Health.Status}}' "${name}" 2>/dev/null || echo "missing")
    if [[ "$status" == "healthy" ]]; then
      ok "Container '${name}' đã sẵn sàng."
      return 0
    fi
    if (( elapsed >= max_wait )); then
      fail "Timeout: container '${name}' vẫn ở trạng thái '${status}' sau ${max_wait}s."
    fi
    sleep 3
    elapsed=$(( elapsed + 3 ))
  done
}

# ── Kiểm tra môi trường ───────────────────────────────────────────────────────
section "Kiểm tra môi trường"

command -v docker      &>/dev/null || fail "docker chưa được cài đặt."
command -v docker      &>/dev/null && docker compose version &>/dev/null || \
  command -v docker-compose &>/dev/null || fail "docker compose / docker-compose không tìm thấy."
command -v nginx       &>/dev/null || warn "nginx không tìm thấy — bước nginx sẽ bị bỏ qua."
command -v pm2         &>/dev/null || warn "pm2 không tìm thấy — bước PM2 sẽ bị bỏ qua."
command -v pnpm        &>/dev/null || warn "pnpm không tìm thấy — bước build sẽ bị bỏ qua."

if [[ ! -f "$ENV_FILE" ]]; then
  warn ".env không tồn tại — đang copy từ .env.example..."
  cp "${REPO_ROOT}/.env.example" "$ENV_FILE"
  warn "Hãy cập nhật ${ENV_FILE} với giá trị thật trước khi deploy production!"
fi

# Nạp biến môi trường (bỏ qua comment và dòng trống)
set -o allexport
# shellcheck disable=SC1090
source <(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$') 2>/dev/null || true
set +o allexport

ok "Môi trường OK — REPO_ROOT=${REPO_ROOT}"

# =============================================================================
# BƯỚC 1 — Khởi động Redis + PostgreSQL (Docker Infra)
# =============================================================================
section "BƯỚC 1 — Khởi động Redis + PostgreSQL (Docker)"

DOCKER_COMPOSE_CMD="docker compose"
docker compose version &>/dev/null 2>&1 || DOCKER_COMPOSE_CMD="docker-compose"

log "Khởi động infra containers (postgres + redis)..."
$DOCKER_COMPOSE_CMD \
  -f "${DOCKER_COMPOSE_FILE}" \
  up -d --no-deps --remove-orphans \
  postgres redis

wait_healthy "vnkr-postgres" 90
wait_healthy "vnkr-redis"    30

ok "Redis (port 6379) + PostgreSQL (port 5432) đã sẵn sàng."

# Khởi động PgBouncer sau khi postgres healthy
log "Khởi động PgBouncer (connection pooler)..."
$DOCKER_COMPOSE_CMD \
  -f "${DOCKER_COMPOSE_FILE}" \
  up -d --no-deps pgbouncer

ok "PgBouncer (port 5433) đã khởi động."

if $INFRA_ONLY; then
  ok "Flag --infra-only — dừng tại đây."
  exit 0
fi

# =============================================================================
# BƯỚC 2 — Chạy DB Schema + Seed Data
# =============================================================================
section "BƯỚC 2 — DB Schema + Seed + Views + Roles"

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-vnkr_dev_password_2026}"
PSQL_CMD="docker exec -i vnkr-postgres psql -U postgres -d vnkr"

run_sql_file() {
  local label="$1"
  local file="$2"
  if [[ ! -f "$file" ]]; then
    warn "Không tìm thấy file: ${file} — bỏ qua."
    return
  fi
  log "Áp dụng ${label}: $(basename "$file")..."
  docker exec -i vnkr-postgres \
    psql -U postgres -d vnkr \
    -v ON_ERROR_STOP=0 \
    --quiet \
    < "$file" && ok "${label} OK." || warn "${label} có một số lỗi (xem log ở trên)."
}

run_sql_file "Schema"   "${DEPLOY_DIR}/db/01_schema.sql"
run_sql_file "Seed"     "${DEPLOY_DIR}/db/02_seed.sql"
run_sql_file "Views"    "${DEPLOY_DIR}/db/03_views.sql"
run_sql_file "Roles"    "${DEPLOY_DIR}/db/04_roles.sql"

ok "Database schema + seed hoàn tất."

# =============================================================================
# BƯỚC 3 — Nginx
# =============================================================================
if ! $SKIP_NGINX; then
  section "BƯỚC 3 — Cài đặt & Reload Nginx"

  if ! command -v nginx &>/dev/null; then
    warn "nginx không tìm thấy — bỏ qua bước này."
  else
    NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
    NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"

    if [[ -d "$NGINX_SITES_AVAILABLE" ]]; then
      log "Đang copy nginx configs vào ${NGINX_SITES_AVAILABLE}..."
      for conf in "${NGINX_CONF_DIR}"/*.conf; do
        [[ -f "$conf" ]] || continue
        fname="$(basename "$conf")"
        cp "$conf" "${NGINX_SITES_AVAILABLE}/${fname}"
        # Tạo symlink trong sites-enabled nếu chưa có
        if [[ ! -L "${NGINX_SITES_ENABLED}/${fname}" ]]; then
          ln -sf "${NGINX_SITES_AVAILABLE}/${fname}" "${NGINX_SITES_ENABLED}/${fname}"
          log "  Đã enable: ${fname}"
        fi
      done
    else
      # Fallback: copy thẳng vào /etc/nginx/conf.d/
      NGINX_CONF_D="/etc/nginx/conf.d"
      log "Đang copy nginx configs vào ${NGINX_CONF_D}..."
      for conf in "${NGINX_CONF_DIR}"/*.conf; do
        [[ -f "$conf" ]] || continue
        cp "$conf" "${NGINX_CONF_D}/$(basename "$conf")"
      done
    fi

    log "Kiểm tra cấu hình nginx..."
    if nginx -t 2>/dev/null; then
      log "Reload nginx..."
      if systemctl is-active --quiet nginx 2>/dev/null; then
        systemctl reload nginx
      else
        nginx -s reload 2>/dev/null || service nginx reload 2>/dev/null || true
      fi
      ok "Nginx đã reload thành công."
    else
      warn "nginx -t thất bại — bỏ qua reload. Kiểm tra lại cấu hình."
    fi
  fi
else
  warn "Bỏ qua bước Nginx (--skip-nginx)."
fi

# =============================================================================
# BƯỚC 4 — Build Monorepo
# =============================================================================
if ! $SKIP_BUILD; then
  section "BƯỚC 4 — Build Monorepo (pnpm + turbo)"

  if ! command -v pnpm &>/dev/null; then
    warn "pnpm không tìm thấy — bỏ qua bước build."
  else
    cd "$REPO_ROOT"
    log "Cài đặt dependencies (pnpm install --frozen-lockfile)..."
    pnpm install --frozen-lockfile || {
      warn "frozen-lockfile thất bại, thử pnpm install..."
      pnpm install
    }
    ok "Dependencies đã cài xong."

    log "Build toàn bộ monorepo (turbo build)..."
    pnpm run build
    ok "Build hoàn tất."
  fi
else
  warn "Bỏ qua bước build (--skip-build)."
fi

# =============================================================================
# BƯỚC 5 — Khởi động Apps qua PM2
# =============================================================================
section "BƯỚC 5 — Khởi động Apps (PM2)"

if ! command -v pm2 &>/dev/null; then
  warn "pm2 không tìm thấy."
  warn "Cài đặt với: npm install -g pm2"
  warn "Bỏ qua bước PM2."
else
  cd "$REPO_ROOT"

  # Tạo thư mục log nếu chưa có
  mkdir -p /var/log/pm2

  # Kiểm tra PM2 đã chạy app chưa
  if pm2 list 2>/dev/null | grep -q "app-web"; then
    log "PM2 đã có apps — thực hiện reload..."
    pm2 reload "${ECOSYSTEM_FILE}" --update-env
  else
    log "PM2 khởi động lần đầu..."
    pm2 start "${ECOSYSTEM_FILE}"
  fi

  ok "PM2 apps đã được khởi động/reload."
  pm2 list

  # Lưu cấu hình PM2 để tự khởi động sau reboot
  log "Lưu cấu hình PM2..."
  pm2 save
  ok "pm2 save hoàn tất."

  # Cài đặt PM2 startup nếu chưa có (chạy lại lệnh nếu cần sudo)
  if ! pm2 startup 2>/dev/null | grep -q "already"; then
    log "Đăng ký PM2 startup systemd (có thể yêu cầu sudo)..."
    pm2 startup 2>/dev/null || warn "Hãy chạy thủ công: sudo pm2 startup"
  fi
fi

# =============================================================================
# BƯỚC 6 — Khởi động Backend Services (Docker — optional)
# =============================================================================
section "BƯỚC 6 — Backend Docker Services (optional)"

log "Khởi động toàn bộ Docker services (fiat-connector, otc-engine, indexer, ...)..."
$DOCKER_COMPOSE_CMD \
  -f "${DOCKER_COMPOSE_FILE}" \
  up -d --remove-orphans \
  fiat-connector-api \
  otc-liquidity-engine \
  indexer-subgraph \
  swift-gateway \
  swift-chain-bridge \
  mail-server \
  dune-alert-bots \
  2>/dev/null || warn "Một số services không thể khởi động (thiếu biến môi trường hoặc image chưa build)."

ok "Backend Docker services đã được khởi động."

# =============================================================================
# TỔNG KẾT
# =============================================================================
section "✅ Deploy hoàn tất"

echo ""
echo -e "${BOLD}  VNKR Tech Holding — Deployment Summary${NC}"
echo "  ──────────────────────────────────────────────────"
echo -e "  ${GREEN}●${NC} PostgreSQL  → localhost:5432 (vnkr-postgres)"
echo -e "  ${GREEN}●${NC} PgBouncer   → localhost:5433 (vnkr-pgbouncer)"
echo -e "  ${GREEN}●${NC} Redis       → localhost:6379 (vnkr-redis)"
echo ""
echo -e "  ${CYAN}Apps (PM2 via Nginx reverse proxy):${NC}"
echo "    app-web              → app.vnkr.vn       (port 3010)"
echo "    id-fiat-gateway      → id.vnkr.vn        (port 3001)"
echo "    pay-portal           → pay.vnkr.vn       (port 3002)"
echo "    explorer-vnkrscan    → scan.vnkr.vn      (port 3003)"
echo "    swap-dex             → swap.vnkr.vn      (port 3004)"
echo "    dao-portal           → dao.vnkr.vn       (port 3005)"
echo "    holding-admin-portal → holding.vnkr.vn   (port 3006)"
echo "    kyc-portal           → kyc.vnkr.vn       (port 3013)"
echo "    merchant-portal      → merchant.vnkr.vn  (port 3011)"
echo "    sandbox-dashboard    → sandbox.vnkr.vn   (port 3012)"
echo ""
echo -e "  ${CYAN}Backend Services (Docker):${NC}"
echo "    fiat-connector-api   → port 4001"
echo "    otc-liquidity-engine → port 4002"
echo "    indexer-subgraph     → port 4003"
echo "    swift-gateway        → port 4004"
echo "    swift-chain-bridge   → port 4005"
echo "    mail-server (SMTP)   → ports 25/465/587/993"
echo ""
echo -e "  ${YELLOW}Logs:${NC}  pm2 logs | docker compose -f deploy/docker/docker-compose.yml logs -f"
echo "  ──────────────────────────────────────────────────"
echo ""
