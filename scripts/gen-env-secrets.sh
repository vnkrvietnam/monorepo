#!/usr/bin/env bash
# =============================================================================
#  VNKR TECH HOLDING — Auto-generate secrets for .env
#  /var/www/scripts/gen-env-secrets.sh
#
#  Logic sinh mật khẩu theo từng loại biến:
#
#    DB passwords      → 32-char alphanum  (PostgreSQL role passwords)
#    POSTGRES_PASSWORD → 32-char alphanum  (superuser)
#    SMTP_PASS         → 16-char mixed     (mail server)
#    Webhook secrets   → 64-char hex       (HMAC signing)
#    API keys          → 48-char alphanum  (internal API keys)
#    SWIFT_LAU_KEY     → 64-char hex       (LAU min 32 hex chars per spec)
#    SWIFT_MGW_APIKEY  → 48-char alphanum  (MGW management key)
#    SWIFT_API_KEY     → 48-char alphanum  (swift-chain-bridge → gateway)
#    RELAYER_PRIVATE_KEY → 32-byte hex (0x-prefixed EVM private key)
#    VNKR_INTERNAL_WEBHOOK_SECRET → 64-char hex
#
#  Behaviour:
#    - Chỉ sinh giá trị cho các biến CÒN RỖNG hoặc là placeholder
#      (CHANGE_ME_*, vnkr_dev_password_2026)
#    - Giá trị đã có KHÔNG bị ghi đè (an toàn để chạy lại)
#    - Cập nhật đồng thời deploy/db/04_roles.sql để passwords khớp
#    - In ra summary cuối màn hình (không in passwords ra stdout)
#
#  Usage:
#    cd /var/www
#    bash scripts/gen-env-secrets.sh [--force] [--dry-run]
#
#  Flags:
#    --force    Sinh lại TOÀN BỘ dù biến đã có giá trị
#    --dry-run  Chỉ in ra giá trị sẽ sinh, KHÔNG ghi file
# =============================================================================
set -euo pipefail

# ── Màu sắc ───────────────────────────────────────────────────────────────────
RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m'
CYAN='\033[0;36m' BOLD='\033[1m' NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
ROLES_SQL="${REPO_ROOT}/deploy/db/04_roles.sql"

FORCE=false
DRY_RUN=false
for arg in "$@"; do
  case $arg in
    --force)   FORCE=true ;;
    --dry-run) DRY_RUN=true ;;
    *) echo -e "${RED}Unknown flag: $arg${NC}"; exit 1 ;;
  esac
done

log()  { echo -e "${CYAN}[gen-env]${NC} $*"; }
ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
skip() { echo -e "  ${YELLOW}–${NC} $*"; }
bold() { echo -e "${BOLD}$*${NC}"; }

# =============================================================================
# Generators — mỗi hàm tạo 1 loại secret
# =============================================================================

# 32-char alphanum (a-z A-Z 0-9) — dùng cho DB passwords
gen_db_pass() {
  python3 -c "import secrets,string; print(secrets.token_hex(16)[:32])"
}

# 16-char mixed có ký tự đặc biệt — dùng cho SMTP
gen_smtp_pass() {
  # Đảm bảo có chữ hoa, chữ thường, số, ký tự đặc biệt an toàn
  python3 -c "
import secrets, string
chars = string.ascii_letters + string.digits + '@#\$%^&*'
pwd = 'V' + ''.join(secrets.choice(chars) for _ in range(14)) + '!'
print(pwd)
"
}

# 64-char hex — dùng cho HMAC secrets, LAU key
gen_hex64() {
  python3 -c "import secrets; print(secrets.token_hex(32))"
}

# 48-char alphanum — dùng cho internal API keys
gen_apikey() {
  python3 -c "import secrets,string; a=string.ascii_letters+string.digits; print(''.join(secrets.choice(a) for _ in range(48)))"
}

# 32-byte hex với prefix 0x — dùng cho EVM private key format
gen_evm_privkey() {
  python3 -c "import secrets; print('0x' + secrets.token_hex(32))"
}

# =============================================================================
# Helpers — đọc / ghi .env
# =============================================================================

# Đọc giá trị hiện tại của KEY trong .env
current_val() {
  grep -E "^${1}=" "${ENV_FILE}" 2>/dev/null | cut -d= -f2- || echo ""
}

# Kiểm tra giá trị có phải placeholder/rỗng không
is_placeholder() {
  local v="$1"
  [[ -z "$v" ]] && return 0
  [[ "$v" == CHANGE_ME_* ]] && return 0
  [[ "$v" == "vnkr_dev_password_2026" ]] && return 0
  [[ "$v" == "Noname@2026" ]] && return 0
  return 1
}

# Ghi KEY=VALUE vào .env (thay thế nếu đã có, append nếu chưa)
write_env() {
  local key="$1"
  local value="$2"
  $DRY_RUN && return
  if grep -qE "^${key}=" "${ENV_FILE}" 2>/dev/null; then
    # Dùng delimiter | để tránh xung đột với / trong URLs và 0x hex
    sed -i "s|^${key}=.*|${key}=${value}|" "${ENV_FILE}"
  else
    echo "${key}=${value}" >> "${ENV_FILE}"
  fi
}

# Ghi password vào 04_roles.sql (thay placeholder của role)
write_role_pass() {
  local role="$1"   # e.g. vnkr_fiat_connector
  local pass="$2"
  $DRY_RUN && return
  # Escape ký tự đặc biệt trong sed replacement
  local escaped_pass
  escaped_pass=$(printf '%s\n' "$pass" | sed 's/[&/\]/\\&/g')
  sed -i "s|LOGIN PASSWORD '[^']*'|LOGIN PASSWORD '${escaped_pass}'|g; /CREATE ROLE ${role}/{ s|LOGIN PASSWORD '[^']*'|LOGIN PASSWORD '${escaped_pass}'|g }" \
    "${ROLES_SQL}" 2>/dev/null || true
}

# =============================================================================
# Setup .env nếu chưa tồn tại
# =============================================================================
if [[ ! -f "${ENV_FILE}" ]]; then
  log "Chưa có .env — copy từ .env.example..."
  $DRY_RUN || cp "${REPO_ROOT}/.env.example" "${ENV_FILE}"
fi

# =============================================================================
# HEADER
# =============================================================================
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║   VNKR — Auto-generate .env Secrets                         ║${NC}"
$DRY_RUN && \
echo -e "${BOLD}${YELLOW}║   MODE: DRY-RUN (không ghi file)                             ║${NC}"
$FORCE && \
echo -e "${BOLD}${RED}║   MODE: FORCE (ghi đè cả giá trị đã có)                      ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Tracking
GENERATED=0
SKIPPED=0

# Hàm xử lý 1 biến
handle() {
  local key="$1"
  local generator="$2"   # tên hàm generator
  local label="$3"
  local cur
  cur=$(current_val "$key")

  if $FORCE || is_placeholder "$cur"; then
    local new_val
    new_val=$($generator)
    write_env "$key" "$new_val"
    $DRY_RUN && ok "${label} [DRY] → ${new_val:0:8}…" \
             || ok "${label} → GENERATED (${#new_val} chars)"
    GENERATED=$((GENERATED + 1))
    # Return generated value for caller if needed
    echo "$new_val" > /tmp/gen_env_last_val
  else
    skip "${label} → đã có [${cur:0:6}…] — bỏ qua"
    SKIPPED=$((SKIPPED + 1))
    echo "$cur" > /tmp/gen_env_last_val
  fi
}

# =============================================================================
# NHÓM 1 — PostgreSQL Superuser password
# =============================================================================
bold "  [1/6] PostgreSQL Superuser"
handle "POSTGRES_PASSWORD" gen_db_pass "POSTGRES_PASSWORD"
PG_PASS=$(cat /tmp/gen_env_last_val)

# Cập nhật DATABASE_URL để dùng password mới
CUR_DB_URL=$(current_val "DATABASE_URL")
if $FORCE || [[ "$CUR_DB_URL" == *"vnkr_dev_password_2026"* ]]; then
  NEW_DB_URL="postgresql://postgres:${PG_PASS}@localhost:5432/vnkr"
  write_env "DATABASE_URL" "$NEW_DB_URL"
  $DRY_RUN && ok "DATABASE_URL [DRY] → updated" \
           || ok "DATABASE_URL → updated với password mới"
  GENERATED=$((GENERATED + 1))
else
  skip "DATABASE_URL → đã có — bỏ qua"
  SKIPPED=$((SKIPPED + 1))
fi

echo ""
# =============================================================================
# NHÓM 2 — Per-service DB passwords (phải khớp với 04_roles.sql)
# =============================================================================
bold "  [2/6] Per-service DB Passwords (khớp 04_roles.sql)"

declare -A DB_PASS_MAP=(
  ["DB_PASS_FIAT"]="vnkr_fiat_connector"
  ["DB_PASS_OTC"]="vnkr_otc"
  ["DB_PASS_INDEXER"]="vnkr_indexer"
  ["DB_PASS_SWIFT"]="vnkr_swift"
  ["DB_PASS_KYC_PORTAL"]="vnkr_kyc_portal"
  ["DB_PASS_MERCHANT"]="vnkr_merchant"
  ["DB_PASS_SANDBOX"]="vnkr_sandbox"
  ["DB_PASS_READONLY"]="vnkr_readonly"
  ["DB_PASS_ADMIN"]="vnkr_admin"
)

# Thứ tự cố định (bash assoc arrays không giữ thứ tự)
DB_PASS_KEYS=(
  DB_PASS_FIAT DB_PASS_OTC DB_PASS_INDEXER DB_PASS_SWIFT
  DB_PASS_KYC_PORTAL DB_PASS_MERCHANT DB_PASS_SANDBOX
  DB_PASS_READONLY DB_PASS_ADMIN
)

for key in "${DB_PASS_KEYS[@]}"; do
  role="${DB_PASS_MAP[$key]}"
  cur=$(current_val "$key")
  if $FORCE || is_placeholder "$cur"; then
    new_pass=$(gen_db_pass)
    write_env "$key" "$new_pass"
    # Cập nhật mật khẩu tương ứng trong 04_roles.sql
    if [[ -f "${ROLES_SQL}" ]]; then
      $DRY_RUN || sed -i \
        "/CREATE ROLE ${role} /s|LOGIN PASSWORD '[^']*'|LOGIN PASSWORD '${new_pass}'|" \
        "${ROLES_SQL}"
    fi
    $DRY_RUN && ok "${key} [DRY] → ${new_pass:0:8}… (role: ${role})" \
             || ok "${key} → GENERATED → 04_roles.sql updated (role: ${role})"
    GENERATED=$((GENERATED + 1))
  else
    skip "${key} → đã có — bỏ qua"
    SKIPPED=$((SKIPPED + 1))
  fi
done

echo ""
# =============================================================================
# NHÓM 3 — SMTP
# =============================================================================
bold "  [3/6] Mail Server (SMTP)"
handle "SMTP_PASS" gen_smtp_pass "SMTP_PASS"

echo ""
# =============================================================================
# NHÓM 4 — Webhook & internal secrets
# =============================================================================
bold "  [4/6] Webhook & Internal Secrets (64-char hex)"
handle "BANK_WEBHOOK_SECRET"          gen_hex64 "BANK_WEBHOOK_SECRET"
handle "VNKR_INTERNAL_WEBHOOK_SECRET" gen_hex64 "VNKR_INTERNAL_WEBHOOK_SECRET"

echo ""
# =============================================================================
# NHÓM 5 — Internal API keys (48-char alphanum)
# =============================================================================
bold "  [5/6] Internal API Keys"
handle "SWIFT_API_KEY"   gen_apikey "SWIFT_API_KEY"
handle "SWIFT_MGW_APIKEY" gen_apikey "SWIFT_MGW_APIKEY"

echo ""
# =============================================================================
# NHÓM 6 — SWIFT Institutional (manual-required vars — sinh placeholder an toàn)
# =============================================================================
bold "  [6/6] SWIFT Institutional Credentials"

# SWIFT_LAU_KEY: 64-char hex (LAU spec: min 32 hex chars)
handle "SWIFT_LAU_KEY"    gen_hex64      "SWIFT_LAU_KEY (64-char hex)"

# RELAYER_PRIVATE_KEY: EVM 32-byte private key (0x + 64 hex)
handle "RELAYER_PRIVATE_KEY" gen_evm_privkey "RELAYER_PRIVATE_KEY (EVM 0x...)"

# Các biến phải lấy từ SWIFT Developer Portal — chỉ cảnh báo nếu rỗng
for v in SWIFT_CONSUMER_KEY SWIFT_CONSUMER_SECRET; do
  cur=$(current_val "$v")
  if [[ -z "$cur" ]]; then
    skip "${v} → rỗng  ⚠️  Lấy từ SWIFT Developer Portal"
  else
    skip "${v} → đã có — bỏ qua"
  fi
done

# Xóa file tạm
rm -f /tmp/gen_env_last_val

# =============================================================================
# TỔNG KẾT
# =============================================================================
echo ""
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════════${NC}"
printf  "  ${GREEN}✓ Đã sinh:${NC} %-3d biến\n" "$GENERATED"
printf  "  ${YELLOW}– Bỏ qua:${NC}  %-3d biến (đã có giá trị)\n" "$SKIPPED"
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""

if $DRY_RUN; then
  echo -e "  ${YELLOW}DRY-RUN: không có file nào bị thay đổi.${NC}"
  echo -e "  Chạy lại không có --dry-run để áp dụng."
else
  echo -e "  ${GREEN}File đã cập nhật:${NC}"
  echo -e "    ${REPO_ROOT}/.env"
  [[ -f "${ROLES_SQL}" ]] && \
  echo -e "    ${ROLES_SQL}"
  echo ""
  echo -e "  ${YELLOW}⚠️  Lưu ý:${NC}"
  echo "    • Sau khi sinh, restart docker containers để nhận password mới:"
  echo "      docker compose -f deploy/docker/docker-compose.yml down"
  echo "      docker volume rm \$(docker volume ls -q | grep vnkr) 2>/dev/null || true"
  echo "      sudo bash deploy/deploy.sh --skip-build"
  echo ""
  echo "    • Các biến cần nhập thủ công từ portal bên ngoài:"
  echo "      SWIFT_CONSUMER_KEY / SWIFT_CONSUMER_SECRET  → SWIFT Developer Portal"
  echo "      TRON_PRIVATE_KEY                            → Ví TRON cá nhân"
  echo "      DUNE_API_KEY / TELEGRAM_BOT_TOKEN           → Dune Analytics / Telegram"
  echo "      RELAYER_PRIVATE_KEY                         → Ví EVM được deploy contract"
fi
echo ""
