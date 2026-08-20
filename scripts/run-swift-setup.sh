#!/usr/bin/env bash
# =============================================================================
#  VNKR TECH HOLDING — SWIFT Full Setup & Deploy Master Script
#  /var/www/scripts/run-swift-setup.sh
#
#  Thực hiện đầy đủ 5 bước:
#    1. Kiểm tra & giải nén SWIFT SDK (extract-swift-sdk.sh)
#    2. Cài Java/keytool nếu thiếu, tạo keystore + mã hóa config
#    3. Điền .env SWIFT vars (tương tác)
#    4. Khởi động Docker infra + services (deploy.sh --skip-build)
#    5. Chạy integration test (test-swift-gateway.sh)
#
#  Usage:
#    cd /var/www
#    sudo bash scripts/run-swift-setup.sh [--skip-extract] [--skip-test]
#
#  Flags:
#    --skip-extract   Bỏ qua bước 1 (SDK đã giải nén)
#    --skip-keystore  Bỏ qua bước 2 (keystore đã tạo)
#    --skip-env       Bỏ qua bước 3 (điền .env thủ công)
#    --skip-deploy    Bỏ qua bước 4 (chỉ test)
#    --skip-test      Bỏ qua bước 5
# =============================================================================
set -euo pipefail

# ── Màu sắc ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'    GREEN='\033[0;32m'   YELLOW='\033[1;33m'
CYAN='\033[0;36m'   BOLD='\033[1m'       NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ── Parse flags ───────────────────────────────────────────────────────────────
SKIP_EXTRACT=false
SKIP_KEYSTORE=false
SKIP_ENV=false
SKIP_DEPLOY=false
SKIP_TEST=false

for arg in "$@"; do
  case $arg in
    --skip-extract)  SKIP_EXTRACT=true ;;
    --skip-keystore) SKIP_KEYSTORE=true ;;
    --skip-env)      SKIP_ENV=true ;;
    --skip-deploy)   SKIP_DEPLOY=true ;;
    --skip-test)     SKIP_TEST=true ;;
    *) echo -e "${RED}Unknown flag: $arg${NC}"; exit 1 ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────
log()     { echo -e "${CYAN}[run-swift]${NC} $*"; }
ok()      { echo -e "${GREEN}[✓]${NC} $*"; }
warn()    { echo -e "${YELLOW}[!]${NC} $*"; }
fail()    { echo -e "${RED}[✗] $*${NC}"; exit 1; }
ask()     { echo -e "${YELLOW}[?]${NC} $*"; }

section() {
  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
  printf   "${BOLD}${CYAN}║  %-52s║${NC}\n" "$*"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
}

prompt_secret() {
  # prompt_secret VAR_NAME "label"
  local var="$1"
  local label="$2"
  local value=""
  while [[ -z "$value" ]]; do
    read -rsp "  ${label}: " value; echo
    [[ -z "$value" ]] && warn "Không được để trống."
  done
  eval "$var='$value'"
}

prompt_value() {
  local var="$1"
  local label="$2"
  local default="${3:-}"
  local value=""
  if [[ -n "$default" ]]; then
    read -rp "  ${label} [${default}]: " value
    value="${value:-$default}"
  else
    while [[ -z "$value" ]]; do
      read -rp "  ${label}: " value
      [[ -z "$value" ]] && warn "Không được để trống."
    done
  fi
  eval "$var='$value'"
}

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}"
echo "  ╔════════════════════════════════════════════════════════╗"
echo "  ║   VNKR TECH HOLDING — SWIFT Full Setup & Deploy       ║"
echo "  ║   5-Step Master Script                                 ║"
echo "  ╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# =============================================================================
# BƯỚC 1 — Extract SWIFT SDK
# =============================================================================
section "BƯỚC 1/5 — Kiểm tra & Giải nén SWIFT SDK"

MGW_VENDOR="${REPO_ROOT}/services/swift-gateway/vendor/swift-mgw-2.0.17-1"
ADAPTER_VENDOR="${REPO_ROOT}/packages/swift-adapter/vendor"

if $SKIP_EXTRACT; then
  warn "Bỏ qua bước 1 (--skip-extract)."
else
  # Kiểm tra xem đã giải nén chưa
  if [[ -f "${MGW_VENDOR}/bin/encrypt.sh" ]] && [[ -d "${ADAPTER_VENDOR}/swift-sdk-2.17.10-6" ]]; then
    ok "SWIFT SDK đã được giải nén sẵn:"
    ok "  ${MGW_VENDOR}/bin/encrypt.sh"
    ok "  ${ADAPTER_VENDOR}/swift-sdk-2.17.10-6"
    log "Bỏ qua bước giải nén."
  else
    # Kiểm tra ZIPs trong TODO/
    ZIP_DIR="${REPO_ROOT}/TODO"
    if [[ ! -f "${ZIP_DIR}/swift-mgw-package-2.0.17-1.zip" ]]; then
      fail "Không tìm thấy ZIPs trong ${ZIP_DIR}. Đặt 3 file zip vào thư mục TODO/ trước."
    fi
    log "Đang giải nén SWIFT SDK ZIPs..."
    bash "${REPO_ROOT}/scripts/extract-swift-sdk.sh"
    ok "SWIFT SDK đã giải nén thành công."
  fi
fi

# =============================================================================
# BƯỚC 2 — Tạo MGW Keystore
# =============================================================================
section "BƯỚC 2/5 — Tạo SWIFT MGW Keystore & Mã hóa Config"

CERTS_DIR="${REPO_ROOT}/certs"
KEYSTORE_FILE="${CERTS_DIR}/config-swift-mgw-secret.ks"
ENC_CONFIG="${CERTS_DIR}/config-swift-mgw.enc"

if $SKIP_KEYSTORE; then
  warn "Bỏ qua bước 2 (--skip-keystore)."
else
  # ── Cài Java nếu chưa có ────────────────────────────────────────────────────
  if ! command -v keytool &>/dev/null; then
    warn "keytool / Java chưa được cài đặt."
    log "Đang cài openjdk-17-jdk-headless..."
    if command -v apt-get &>/dev/null; then
      apt-get update -qq && apt-get install -y openjdk-17-jdk-headless
      # Tải lại PATH để keytool khả dụng
      export PATH="/usr/lib/jvm/java-17-openjdk-amd64/bin:${PATH}"
    elif command -v yum &>/dev/null; then
      yum install -y java-17-openjdk-headless
    else
      fail "Không tìm thấy apt-get / yum. Cài Java 11+ thủ công rồi chạy lại."
    fi
    ok "Java đã cài: $(java -version 2>&1 | head -1)"
  else
    ok "Java đã có: $(java -version 2>&1 | head -1)"
  fi

  # ── Kiểm tra encrypt.sh vendor ───────────────────────────────────────────────
  ENCRYPT_SH="${MGW_VENDOR}/bin/encrypt.sh"
  if [[ ! -f "${ENCRYPT_SH}" ]]; then
    fail "Không tìm thấy ${ENCRYPT_SH} — chạy lại với bước 1."
  fi

  # ── Kiểm tra đã có keystore + enc chưa ─────────────────────────────────────
  if [[ -f "${KEYSTORE_FILE}" ]] && [[ -f "${ENC_CONFIG}" ]]; then
    ok "Keystore và encrypted config đã tồn tại:"
    ok "  ${KEYSTORE_FILE}"
    ok "  ${ENC_CONFIG}"
    ask "Tạo lại từ đầu? (y/N): "
    read -r REDO_KS
    if [[ "${REDO_KS,,}" != "y" ]]; then
      log "Giữ nguyên keystore cũ."
    else
      rm -f "${KEYSTORE_FILE}" "${ENC_CONFIG}"
      bash "${REPO_ROOT}/scripts/setup-mgw-keystore.sh" --env TEST --bic VNKRVNVNXXX
    fi
  else
    log "Chạy setup-mgw-keystore.sh..."
    bash "${REPO_ROOT}/scripts/setup-mgw-keystore.sh" --env TEST --bic VNKRVNVNXXX
  fi

  # ── Xóa file config thô sau khi mã hóa ──────────────────────────────────────
  PLAIN_CONFIG="${CERTS_DIR}/config-swift-mgw.yaml"
  if [[ -f "${PLAIN_CONFIG}" ]]; then
    log "Xóa file config thô (bảo mật)..."
    rm -f "${PLAIN_CONFIG}"
    ok "Đã xóa ${PLAIN_CONFIG}"
  fi

  if [[ -f "${ENC_CONFIG}" ]]; then
    ok "Keystore setup hoàn tất."
    ok "  Keystore : ${KEYSTORE_FILE}"
    ok "  Encrypted: ${ENC_CONFIG}"
  fi
fi

# =============================================================================
# BƯỚC 3 — Điền .env SWIFT vars
# =============================================================================
section "BƯỚC 3/5 — Cấu hình .env (SWIFT credentials)"

ENV_FILE="${REPO_ROOT}/.env"

if $SKIP_ENV; then
  warn "Bỏ qua bước 3 (--skip-env)."
else
  [[ -f "${ENV_FILE}" ]] || cp "${REPO_ROOT}/.env.example" "${ENV_FILE}"

  # ── Đọc giá trị hiện tại ────────────────────────────────────────────────────
  current_val() {
    grep -E "^${1}=" "${ENV_FILE}" 2>/dev/null | cut -d= -f2- || echo ""
  }

  log "Kiểm tra SWIFT vars trong .env..."
  MISSING_VARS=()
  for v in SWIFT_LAU_KEY SWIFT_MGW_APIKEY RELAYER_PRIVATE_KEY SWIFT_API_KEY VNKR_INTERNAL_WEBHOOK_SECRET; do
    val=$(current_val "$v")
    if [[ -z "$val" ]]; then
      MISSING_VARS+=("$v")
    else
      ok "  ${v} = [đã có]"
    fi
  done

  if [[ ${#MISSING_VARS[@]} -eq 0 ]]; then
    ok "Tất cả SWIFT vars đã được điền."
  else
    echo ""
    warn "Các vars sau còn rỗng — vui lòng nhập:"
    echo ""

    set_env_var() {
      local key="$1"
      local value="$2"
      # Nếu key tồn tại, thay thế; nếu không, append
      if grep -qE "^${key}=" "${ENV_FILE}" 2>/dev/null; then
        sed -i "s|^${key}=.*|${key}=${value}|" "${ENV_FILE}"
      else
        echo "${key}=${value}" >> "${ENV_FILE}"
      fi
    }

    for v in "${MISSING_VARS[@]}"; do
      case "$v" in
        SWIFT_LAU_KEY)
          echo "  SWIFT_LAU_KEY — LAU shared secret key (min 32 hex chars)"
          echo "  Lấy từ: SWIFT Developer Portal → Alliance Access → LAU key"
          prompt_secret LAU_VAL "  SWIFT_LAU_KEY"
          set_env_var "SWIFT_LAU_KEY" "${LAU_VAL}"
          ok "  SWIFT_LAU_KEY đã lưu."
          ;;
        SWIFT_MGW_APIKEY)
          echo "  SWIFT_MGW_APIKEY — API key cho quản trị SWIFT Microgateway"
          prompt_secret MGW_API_VAL "  SWIFT_MGW_APIKEY"
          set_env_var "SWIFT_MGW_APIKEY" "${MGW_API_VAL}"
          ok "  SWIFT_MGW_APIKEY đã lưu."
          ;;
        RELAYER_PRIVATE_KEY)
          echo "  RELAYER_PRIVATE_KEY — Private key ví relayer trên App-Chain"
          echo "  ⚠️  KHÔNG bao giờ commit key này vào git!"
          prompt_secret RELAY_VAL "  RELAYER_PRIVATE_KEY (0x...)"
          set_env_var "RELAYER_PRIVATE_KEY" "${RELAY_VAL}"
          ok "  RELAYER_PRIVATE_KEY đã lưu."
          ;;
        SWIFT_API_KEY)
          echo "  SWIFT_API_KEY — API key để swift-chain-bridge gọi swift-gateway"
          prompt_secret SWIFT_API_VAL "  SWIFT_API_KEY"
          set_env_var "SWIFT_API_KEY" "${SWIFT_API_VAL}"
          ok "  SWIFT_API_KEY đã lưu."
          ;;
        VNKR_INTERNAL_WEBHOOK_SECRET)
          echo "  VNKR_INTERNAL_WEBHOOK_SECRET — Shared secret giữa swift-gateway và bridge"
          prompt_secret WEBHOOK_VAL "  VNKR_INTERNAL_WEBHOOK_SECRET"
          set_env_var "VNKR_INTERNAL_WEBHOOK_SECRET" "${WEBHOOK_VAL}"
          ok "  VNKR_INTERNAL_WEBHOOK_SECRET đã lưu."
          ;;
      esac
      echo ""
    done

    ok ".env đã được cập nhật đầy đủ SWIFT vars."
  fi
fi

# =============================================================================
# BƯỚC 4 — Khởi Docker infra + services
# =============================================================================
section "BƯỚC 4/5 — Khởi động Docker Infra + SWIFT Services"

if $SKIP_DEPLOY; then
  warn "Bỏ qua bước 4 (--skip-deploy)."
else
  # ── Kiểm tra Docker daemon ───────────────────────────────────────────────────
  if ! docker version &>/dev/null 2>&1; then
    warn "Docker daemon chưa chạy."
    log "Đang khởi động Docker daemon..."
    if systemctl is-enabled docker &>/dev/null 2>&1; then
      systemctl start docker
      sleep 3
    else
      # Docker Desktop / snap
      service docker start 2>/dev/null || dockerd &>/tmp/dockerd.log &
      sleep 5
    fi

    if ! docker version &>/dev/null 2>&1; then
      fail "Không thể khởi động Docker daemon.\n       Chạy thủ công: sudo systemctl start docker"
    fi
    ok "Docker daemon đã khởi động."
  else
    ok "Docker đang chạy: $(docker version --format '{{.Server.Version}}' 2>/dev/null)"
  fi

  # ── Chạy deploy.sh --skip-build ─────────────────────────────────────────────
  DEPLOY_SCRIPT="${REPO_ROOT}/deploy/deploy.sh"
  if [[ ! -f "${DEPLOY_SCRIPT}" ]]; then
    fail "Không tìm thấy ${DEPLOY_SCRIPT}"
  fi

  chmod +x "${DEPLOY_SCRIPT}"
  log "Chạy deploy.sh --skip-build..."
  bash "${DEPLOY_SCRIPT}" --skip-build

  # ── Chờ swift-gateway port 4004 ─────────────────────────────────────────────
  log "Chờ swift-gateway sẵn sàng trên port 4004..."
  MAX_WAIT=120
  ELAPSED=0
  while true; do
    if curl -sf "http://localhost:4004/health" &>/dev/null; then
      ok "swift-gateway port 4004 đã online."
      break
    fi
    if (( ELAPSED >= MAX_WAIT )); then
      warn "swift-gateway chưa phản hồi sau ${MAX_WAIT}s — tiếp tục test (có thể fail)."
      break
    fi
    printf "  . "
    sleep 5
    ELAPSED=$(( ELAPSED + 5 ))
  done
fi

# =============================================================================
# BƯỚC 5 — Integration Test
# =============================================================================
section "BƯỚC 5/5 — SWIFT Gateway Integration Test"

if $SKIP_TEST; then
  warn "Bỏ qua bước 5 (--skip-test)."
else
  TEST_SCRIPT="${REPO_ROOT}/scripts/test-swift-gateway.sh"
  if [[ ! -f "${TEST_SCRIPT}" ]]; then
    fail "Không tìm thấy ${TEST_SCRIPT}"
  fi

  chmod +x "${TEST_SCRIPT}"

  # Nạp .env để lấy SWIFT_API_KEY
  set -o allexport
  source <(grep -v '^\s*#' "${ENV_FILE}" | grep -v '^\s*$') 2>/dev/null || true
  set +o allexport

  log "Chạy test-swift-gateway.sh..."
  if bash "${TEST_SCRIPT}"; then
    ok "Tất cả tests PASSED."
  else
    warn "Một số tests FAILED — xem output ở trên để debug."
  fi
fi

# =============================================================================
# TỔNG KẾT
# =============================================================================
echo ""
echo -e "${BOLD}${GREEN}"
echo "  ╔════════════════════════════════════════════════════════╗"
echo "  ║   ✅  VNKR SWIFT Setup hoàn tất                       ║"
echo "  ╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "  ${CYAN}Checklist:${NC}"
echo "  ─────────────────────────────────────────────────────────"
[[ -f "${MGW_VENDOR}/bin/encrypt.sh" ]]   && echo -e "  ${GREEN}✓${NC} SWIFT SDK giải nén  — ${MGW_VENDOR}" \
                                           || echo -e "  ${RED}✗${NC} SWIFT SDK thiếu"
[[ -f "${KEYSTORE_FILE:-/dev/null}" ]]    && echo -e "  ${GREEN}✓${NC} Keystore PKCS12      — ${KEYSTORE_FILE}" \
                                           || echo -e "  ${YELLOW}○${NC} Keystore — bỏ qua hoặc chưa tạo"
[[ -f "${ENC_CONFIG:-/dev/null}" ]]       && echo -e "  ${GREEN}✓${NC} Encrypted config     — ${ENC_CONFIG}" \
                                           || echo -e "  ${YELLOW}○${NC} Encrypted config — bỏ qua hoặc chưa tạo"
echo ""
echo -e "  ${CYAN}Services:${NC}"
echo "    swift-gateway     → http://localhost:4004/health"
echo "    swift-mgw-daemon  → http://localhost:9003/health"
echo "    fiat-connector    → http://localhost:4001/health"
echo ""
echo -e "  ${CYAN}Logs:${NC}"
echo "    docker compose -f deploy/docker/docker-compose.yml logs -f swift-gateway"
echo "    docker compose -f deploy/docker/docker-compose.yml logs -f swift-mgw-daemon"
echo ""
