#!/usr/bin/env bash
# ─── scripts/setup-mgw-keystore.sh ────────────────────────────────────────────
# VNKR TECH HOLDING JSC — SWIFT MGW Keystore & Config Encryption
#
# Thực hiện 3 bước:
#   1. Tạo AES-256 Secret Keystore (PKCS12) để mã hóa config MGW
#   2. Tạo template config-swift-mgw.yaml (thô)
#   3. Mã hóa config bằng bin/encrypt.sh của SWIFT MGW vendor
#
# Yêu cầu: Java 11+ (keytool) & JDK trong PATH
#
# Usage:
#   bash scripts/setup-mgw-keystore.sh [--env TEST|LIVE] [--bic VNKRVNVNXXX]
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── Arguments ────────────────────────────────────────────────────────────────
SWIFT_ENV="${SWIFT_ENV:-TEST}"
SWIFT_BIC="${SWIFT_BIC:-VNKRVNVNXXX}"
CERTS_DIR="${CERTS_DIR:-./certs}"
MGW_VENDOR_DIR="${MGW_VENDOR_DIR:-./services/swift-gateway/vendor/swift-mgw-2.0.17-1}"
ALIAS="swift-mgw-secret"
KEYSTORE_FILE="${CERTS_DIR}/config-swift-mgw-secret.ks"
PLAIN_CONFIG="${CERTS_DIR}/config-swift-mgw.yaml"
ENC_CONFIG="${CERTS_DIR}/config-swift-mgw.enc"

while [[ $# -gt 0 ]]; do
  case $1 in
    --env)   SWIFT_ENV="$2"; shift 2 ;;
    --bic)   SWIFT_BIC="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# ─── Kiểm tra keytool ─────────────────────────────────────────────────────────
if ! command -v keytool &>/dev/null; then
  echo "❌  keytool không tìm thấy. Cài Java 11+ và thêm vào PATH."
  exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  VNKR SWIFT MGW — Keystore & Config Encryption Setup         ║"
printf "║  BIC: %-10s   Environment: %-25s   ║\n" "$SWIFT_BIC" "$SWIFT_ENV"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

mkdir -p "${CERTS_DIR}"

# ─── Nhập mật khẩu keystore ───────────────────────────────────────────────────
read -rsp "🔑 Nhập mật khẩu Keystore (min 8 ký tự): " STOREPASS; echo
if [[ ${#STOREPASS} -lt 8 ]]; then
  echo "❌  Mật khẩu quá ngắn (min 8 ký tự)"
  exit 1
fi
read -rsp "   Xác nhận mật khẩu: " STOREPASS_CONFIRM; echo
if [[ "$STOREPASS" != "$STOREPASS_CONFIRM" ]]; then
  echo "❌  Mật khẩu không khớp"
  exit 1
fi

# ─── Bước 1: Tạo Secret Keystore (PKCS12 + AES-256) ─────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "  Bước 1/3 — Tạo Secret Keystore PKCS12 (AES-256)"
echo "══════════════════════════════════════════════════════════════════"

if [[ -f "${KEYSTORE_FILE}" ]]; then
  echo "⚠️  Keystore đã tồn tại: ${KEYSTORE_FILE}"
  read -rp "   Ghi đè? (y/N): " OVERWRITE
  [[ "${OVERWRITE,,}" == "y" ]] || { echo "Bỏ qua bước 1."; }
else
  keytool -genseckey \
    -alias "${ALIAS}" \
    -keyalg AES \
    -keysize 256 \
    -storetype PKCS12 \
    -keystore "${KEYSTORE_FILE}" \
    -storepass "${STOREPASS}" \
    -keypass "${STOREPASS}"
  echo "✅  Keystore đã tạo: ${KEYSTORE_FILE}"
fi

# ─── Bước 2: Tạo file config YAML thô ────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "  Bước 2/3 — Tạo template config-swift-mgw.yaml"
echo "══════════════════════════════════════════════════════════════════"

# Chọn host theo environment
if [[ "${SWIFT_ENV}" == "LIVE" ]]; then
  API_HOST="https://api.swiftnet.sipn.swift.com"
  MGW_ENV="LIVE"
else
  API_HOST="https://api-test.swiftnet.sipn.swift.com"
  MGW_ENV="TEST"
fi

cat > "${PLAIN_CONFIG}" <<YAML
### VNKR TECH HOLDING — SWIFT MGW Configuration
### Environment: ${MGW_ENV}
### Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
### ⚠️  NHẠY CẢM — KHÔNG COMMIT FILE NÀY VÀO GIT
configuration:
  environment: ${MGW_ENV}
  swift_microgateway:
    port: 9003
    exec_time_sec: 1
    auto_sag_switch: false
    ssl:
      key_store_type: JKS
      # Đường dẫn đến JKS chứa certificate SWIFT Alliance member
      key_store_path: /app/certs/swift-member-cert.jks
      key_store_password: <SWIFT_CERT_KEYSTORE_PASSWORD>
      cert_alias: ${SWIFT_BIC,,}-swift-cert
      key_manager_password: <SWIFT_CERT_KEY_PASSWORD>
      sni_host_check: true
  services:
    metadata:
      url: jdbc:h2:file:/opt/swift-mgw/db/mgwdb;CIPHER=AES;AUTO_RECONNECT=TRUE
      username: vnkr_mgw
      filePassword: <DB_FILE_PASSWORD>
      userPassword: <DB_USER_PASSWORD>
      h2_console_enabled: false
    api:
      management:
        enabled: true
        security:
          apikey: <SWIFT_MGW_APIKEY>
      configuration:
        enabled: true
        security:
          apikey: <SWIFT_MGW_APIKEY>
      monitoring:
        enabled: true
        security:
          apikey: <SWIFT_MGW_APIKEY>
    logging:
      level: INFO
      file: /opt/swift-mgw/log/mgw.log
      max-file-size: 10MB
      max-history: 7
  security:
    web:
      allowSemicolon: false
      allowUrlEncodedSlash: false
      allowUrlEncodedDoubleSlash: false
YAML

echo "✅  Template config tạo tại: ${PLAIN_CONFIG}"
echo "⚠️  Điền các giá trị <PLACEHOLDER> trước khi mã hóa!"
echo ""
echo "   Các giá trị cần điền:"
echo "   • SWIFT_CERT_KEYSTORE_PASSWORD — mật khẩu JKS certificate SWIFT Alliance"
echo "   • SWIFT_CERT_KEY_PASSWORD      — mật khẩu private key trong JKS"
echo "   • DB_FILE_PASSWORD             — mật khẩu H2 database file"
echo "   • DB_USER_PASSWORD             — mật khẩu H2 user"
echo "   • SWIFT_MGW_APIKEY             — API key quản trị MGW (set trong .env)"
echo ""

read -rp "   Đã điền các giá trị? Tiếp tục mã hóa? (y/N): " PROCEED
if [[ "${PROCEED,,}" != "y" ]]; then
  echo "⏸️  Dừng lại. Chạy lại script sau khi điền đầy đủ giá trị."
  exit 0
fi

# ─── Bước 3: Mã hóa config bằng SWIFT MGW vendor encrypt.sh ─────────────────
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "  Bước 3/3 — Mã hóa config-swift-mgw.yaml → config-swift-mgw.enc"
echo "══════════════════════════════════════════════════════════════════"

ENCRYPT_SH="${MGW_VENDOR_DIR}/bin/encrypt.sh"

if [[ ! -f "${ENCRYPT_SH}" ]]; then
  echo "❌  Không tìm thấy ${ENCRYPT_SH}"
  echo "   Chạy 'bash scripts/extract-swift-sdk.sh' trước."
  exit 1
fi

chmod +x "${ENCRYPT_SH}"

# SWIFT MGW encrypt.sh syntax:
# encrypt.sh <config_yaml> <keystore_path> <keystore_password> <output_enc>
bash "${ENCRYPT_SH}" \
  "${PLAIN_CONFIG}" \
  "${KEYSTORE_FILE}" \
  "${STOREPASS}" \
  "${ENC_CONFIG}"

echo "✅  Config đã mã hóa: ${ENC_CONFIG}"
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Bước tiếp theo:                                             ║"
echo "║  1. Xóa file thô:  rm ${PLAIN_CONFIG}         ║"
echo "║  2. Mount vào container:                                     ║"
echo "║     - ${CERTS_DIR}/config-swift-mgw.enc  → /opt/swift-mgw/config/  ║"
echo "║     - ${CERTS_DIR}/config-swift-mgw-secret.ks → /opt/swift-mgw/config/ ║"
echo "║     - certs/swift-member-cert.jks            → /app/certs/  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
