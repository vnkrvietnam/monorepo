#!/usr/bin/env bash
# ─── scripts/test-swift-gateway.sh ────────────────────────────────────────────
# VNKR TECH HOLDING JSC — SWIFT Gateway Integration Test Suite
# Target service: swift-gateway (Port 4004)
#
# Usage:
#   bash scripts/test-swift-gateway.sh
#   SWIFT_GATEWAY_URL=https://otc.vnkr.vn bash scripts/test-swift-gateway.sh
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${SWIFT_GATEWAY_URL:-http://localhost:4004}"
API_KEY="${SWIFT_API_KEY:-dev-api-key}"

# ─── Màu terminal ─────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" -eq "$expected" ] 2>/dev/null; then
    echo -e "  ${GREEN}✓ PASSED${NC}  ${label} → HTTP ${actual}"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}✗ FAILED${NC}  ${label} → expected ${expected}, got ${actual}"
    FAIL=$((FAIL+1))
  fi
}

echo -e "${CYAN}"
echo "══════════════════════════════════════════════════════════════"
echo "  VNKR SWIFT GATEWAY INTEGRATION TEST SUITE"
echo "  Target: ${BASE_URL}"
echo "══════════════════════════════════════════════════════════════"
echo -e "${NC}"

# ─── 1. Health checks ─────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/5] Health Checks${NC}"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health")
check "GET /health" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/swift/mgw/health")
# 200 = MGW online, 503 = MGW offline (acceptable in dev)
if [ "$STATUS" -eq 200 ] || [ "$STATUS" -eq 503 ]; then
  echo -e "  ${GREEN}✓ PASSED${NC}  GET /api/v1/swift/mgw/health → HTTP ${STATUS}"
  PASS=$((PASS+1))
else
  echo -e "  ${RED}✗ FAILED${NC}  GET /api/v1/swift/mgw/health → unexpected HTTP ${STATUS}"
  FAIL=$((FAIL+1))
fi
echo ""

# ─── 2. MT103 ─────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[2/5] POST /api/v1/swift/send-mt103${NC}"
MT103_RES=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/v1/swift/send-mt103" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "senderBIC": "VNKRVNVNXXX",
    "receiverBIC": "BNPAFRPPXXX",
    "reference": "VNKR20260819001",
    "amount": 1500000,
    "currency": "USD",
    "orderingAccount": "1029384756",
    "orderingName": "VNKR TECH HOLDING JSC",
    "beneficiaryAccount": "9876543210",
    "beneficiaryName": "GLOBAL TECH SUPPLIER INC",
    "chargesCode": "OUR",
    "valueDate": "260819"
  }')
MT103_HTTP=$(echo "$MT103_RES" | tail -1)
MT103_BODY=$(echo "$MT103_RES" | head -n -1)
check "POST /api/v1/swift/send-mt103" 200 "$MT103_HTTP"
if command -v jq &>/dev/null; then
  echo "  Response:"
  echo "$MT103_BODY" | jq '{ messageId, status, lauSignature: (.lauSignature | .[0:16] + "…") }' 2>/dev/null || true
fi
echo ""

# ─── 3. MT202 ─────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/5] POST /api/v1/swift/send-mt202${NC}"
MT202_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/v1/swift/send-mt202" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "senderBIC": "VNKRVNVNXXX",
    "receiverBIC": "CHASUS33XXX",
    "reference": "VNKR20260819002",
    "relatedReference": "VNKR20260819001",
    "amount": 500000,
    "currency": "EUR",
    "valueDate": "260819",
    "accountWithInstitutionBIC": "CITIUS33XXX",
    "beneficiaryInstitutionBIC": "CHASUS33XXX"
  }')
check "POST /api/v1/swift/send-mt202" 200 "$MT202_HTTP"
echo ""

# ─── 4. pacs.008 ──────────────────────────────────────────────────────────────
echo -e "${YELLOW}[4/5] POST /api/v1/swift/send-pacs008${NC}"
PACS008_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/v1/swift/send-pacs008" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "msgId": "VNKR/20260819/PACS008/001",
    "creDtTm": "2026-08-19T04:24:00Z",
    "nbOfTxs": 1,
    "sttlmMtd": "CLRG",
    "instrId": "INSTR-001",
    "endToEndId": "E2E-VNKR-20260819",
    "txId": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    "intrBkSttlmAmt": 750000.50,
    "currency": "EUR",
    "intrBkSttlmDt": "2026-08-19",
    "dbtrName": "VNKR TECH HOLDING JSC",
    "dbtrAcctIBAN": "VN1234567890",
    "dbtrAgtBIC": "VNKRVNVNXXX",
    "cdtrAgtBIC": "DEUTDEFFXXX",
    "cdtrName": "DEUTSCHE INDUSTRIAL GMBH",
    "cdtrAcctIBAN": "DE89370400440532013000"
  }')
check "POST /api/v1/swift/send-pacs008" 200 "$PACS008_HTTP"
echo ""

# ─── 5. MGW Management (mock) ─────────────────────────────────────────────────
echo -e "${YELLOW}[5/5] Mock MGW Endpoints (Port 9003)${NC}"
MGW_BASE="${SWIFT_MGW_URL:-http://localhost:9003}"

MGW_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${MGW_BASE}/health" 2>/dev/null || echo "000")
if [ "$MGW_HEALTH" -eq 200 ]; then
  echo -e "  ${GREEN}✓ PASSED${NC}  GET ${MGW_BASE}/health → HTTP 200"
  PASS=$((PASS+1))
else
  echo -e "  ${YELLOW}⚠ SKIPPED${NC}  Mock MGW não está rodando (HTTP ${MGW_HEALTH}) — inicie com docker compose up swift-mgw-mock"
fi
echo ""

# ─── Kết quả ──────────────────────────────────────────────────────────────────
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}PASSED: ${PASS}${NC}   ${RED}FAILED: ${FAIL}${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
