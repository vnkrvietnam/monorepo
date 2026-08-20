#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║         VNKR TECH HOLDING JSC — Global Enterprise Infrastructure Setup      ║
# ║         Chuẩn Hóa Hạ Tầng Mã Nguồn & Quản Lý Gói npm (@vnkrvietnam)        ║
# ╠══════════════════════════════════════════════════════════════════════════════╣
# ║  Tài liệu:   Global Enterprise Standards — Monorepo + npm Supply-Chain      ║
# ║  Scope:      pnpm workspace · Turborepo · Changesets · GitHub Packages      ║
# ║  Registry:   https://npm.pkg.github.com  (scope: @vnkrvietnam)             ║
# ║  Node req:   >= 22.0.0   │   pnpm req: >= 9.0.0                            ║
# ║  Tác giả:    VNKR Platform Engineering                                       ║
# ║  Phiên bản:  1.0.0                                                           ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# ┌─────────────────────────────────────────────────────────────────────────────┐
# │  SƠ ĐỒ KIẾN TRÚC HẠ TẦNG Git & npm (@vnkrvietnam)                         │
# ├─────────────────────────────────────────────────────────────────────────────┤
# │                                                                             │
# │  vnkr-tech-holding-monorepo (GitHub)                                       │
# │  └── branch: main                                                          │
# │       │                                                                    │
# │       ├── apps/*          (Next.js / React / Vite frontends)               │
# │       │   ├── id-fiat-gateway     (id.vnkr.vn)     :3001                   │
# │       │   ├── pay-portal          (pay.vnkr.vn)     :3002                   │
# │       │   ├── explorer-vnkrscan   (scan.vnkr.vn)    :3003                   │
# │       │   ├── swap-dex            (swap.vnkr.vn)    :3004                   │
# │       │   ├── dao-portal          (dao.vnkr.vn)     :3005                   │
# │       │   ├── holding-admin-portal(holding.vnkr.vn) :3006                   │
# │       │   ├── app-web             (app.vnkr.vn)     :3010                   │
# │       │   ├── merchant-portal     (merchant.vnkr.vn):3011                   │
# │       │   ├── sandbox-dashboard   (sandbox.vnkr.vn) :3012                   │
# │       │   ├── kyc-portal          (kyc.vnkr.vn)     :3013                   │
# │       │   └── digital-twin-engine (lab.vnkr.vn)                             │
# │       │                                                                    │
# │       ├── packages/*      (npm publishable — GitHub Packages registry)     │
# │       │   ├── @vnkrvietnam/types          (shared TS types)                │
# │       │   ├── @vnkrvietnam/config         (env constants, PDAs, RPCs)      │
# │       │   ├── @vnkrvietnam/contracts      (Bophades EVM smart contracts)   │
# │       │   ├── @vnkrvietnam/core-sdk       (Solana/EVM Web3 wrapper)        │
# │       │   ├── @vnkrvietnam/db             (PostgreSQL pool + typed queries)│
# │       │   ├── @vnkrvietnam/merchant-sdk   (payment gateway JS/TS SDK)      │
# │       │   ├── @vnkrvietnam/sdk-swift      (SWIFT Alliance Gateway SDK)     │
# │       │   ├── @vnkrvietnam/swift-adapter  (MT103/MT202/ISO20022/LAU)       │
# │       │   ├── @vnkrvietnam/sdk-internal   (SWIFT vendor SDK mirror)        │
# │       │   └── @vnkrvietnam/ui-kit         (VNKR design system)             │
# │       │                                                                    │
# │       └── services/*      (microservices — Docker / Kubernetes)            │
# │           ├── api-gateway          :4000  (REST 17 domains)                │
# │           ├── fiat-connector-api   :4001  (dev-api.vnkr.vn)               │
# │           ├── otc-liquidity-engine :4002  (otc.vnkr.vn — VARA)            │
# │           ├── indexer-subgraph     :4003  (treasury-subgraph-api.vnkr.vn) │
# │           ├── swift-gateway        :4004  (SWIFT Microgateway 2.0.17)     │
# │           ├── swift-chain-bridge   :4005  (SWIFT ↔ EVM/Solana oracle)     │
# │           ├── mock-mgw-daemon      :9003  (dev/staging mock)              │
# │           └── dune-alert-bots             (Telegram/Discord bots)         │
# │                                                                             │
# │  CI/CD Pipeline (.github/workflows/)                                       │
# │  ┌──────────────────────────────────────────────────────────────┐          │
# │  │  push → main                                                 │          │
# │  │      ↓                                                       │          │
# │  │  changeset-release.yml                                       │          │
# │  │      ├─ .changeset/*.md exist? ─YES→ "Version Packages" PR  │          │
# │  │      │       (bumps versions + writes CHANGELOGs)           │          │
# │  │      └─ NO (Version PR merged) → pnpm build && test         │          │
# │  │              → changeset publish → GitHub Packages           │          │
# │  │              → tags + GitHub Releases                        │          │
# │  │                                                               │          │
# │  │  push → v* tag                                               │          │
# │  │      ↓                                                       │          │
# │  │  npm-publish.yml → publish:all → npmjs.com (public)         │          │
# │  └──────────────────────────────────────────────────────────────┘          │
# │                                                                             │
# │  Build Order (Turborepo dependency graph):                                 │
# │  @vnkrvietnam/types                                                        │
# │      └── @vnkrvietnam/config                                               │
# │              ├── @vnkrvietnam/core-sdk                                     │
# │              ├── @vnkrvietnam/swift-adapter                                │
# │              └── @vnkrvietnam/merchant-sdk                                 │
# │                       └── @vnkrvietnam/ui-kit                              │
# └─────────────────────────────────────────────────────────────────────────────┘

set -euo pipefail
IFS=$'\n\t'

# ──────────────────────────────────────────────────────────────────────────────
# MÀUSẮC & TIÊU ĐỀ
# Dùng $'\e[...]' (ANSI literal bash) thay vì \033[...] để đảm bảo
# escape code luôn được expand đúng trong mọi context: tty, pipe, subshell.
# ──────────────────────────────────────────────────────────────────────────────
BOLD=$'\e[1m'
RED=$'\e[0;31m'
GREEN=$'\e[0;32m'
YELLOW=$'\e[0;33m'
CYAN=$'\e[0;36m'
BLUE=$'\e[1;34m'
MAGENTA=$'\e[0;35m'
DIM=$'\e[2m'
RESET=$'\e[0m'

# ──────────────────────────────────────────────────────────────────────────────
# CẤU HÌNH GLOBAL
# ──────────────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

NPM_SCOPE="@vnkrvietnam"
NPM_REGISTRY="https://npm.pkg.github.com"
REQUIRED_NODE_MAJOR=22
REQUIRED_PNPM_MAJOR=9
PACKAGE_MANAGER="pnpm@9.15.9"

# Danh sách packages có thể publish (theo thứ tự dependency)
declare -a PUBLISHABLE_PACKAGES=(
  "packages/types"
  "packages/config"
  "packages/core-sdk"
  "packages/swift-adapter"
  "packages/merchant-sdk"
  "packages/ui-kit"
)

# ──────────────────────────────────────────────────────────────────────────────
# HÀM TIỆN ÍCH
# ──────────────────────────────────────────────────────────────────────────────

# Đọc một trường từ JSON file bằng fs.readFileSync (không dùng require cache,
# không cần external modules, hoạt động với absolute path bất kỳ).
# Usage: json_field <file.json> <js-expression-trả-về-value>
# Ví dụ: json_field /path/pkg.json "(d.publishConfig||{}).access||''"
json_field() {
  local file="$1"
  local expr="$2"
  node -e "
    const fs   = require('fs');
    const path = require('path');
    const d    = JSON.parse(fs.readFileSync(path.resolve(process.argv[1]), 'utf8'));
    const val  = (function(){ return ${expr}; })();
    console.log(val === undefined || val === null ? '' : val);
  " "$file" 2>/dev/null
}

# Kiểm tra chuỗi version có đúng định dạng semver (MAJOR.MINOR.PATCH[...])
# Dùng regex bash thuần — không cần module semver
is_semver() {
  [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][a-zA-Z0-9.+_-]*)?$ ]]
}

# Tất cả hàm log dùng printf '%b\n' thay vì echo -e để đảm bảo
# ANSI escape codes và ký tự xuống dòng luôn được render đúng.
log_header() {
  printf '\n'
  printf '%b\n' "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${RESET}"
  printf '%b\n' "${BOLD}${CYAN}║  $1${RESET}"
  printf '%b\n' "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${RESET}"
  printf '\n'
}

log_section() {
  printf '\n'
  printf '%b\n' "${BOLD}${BLUE}── $1 ──${RESET}"
}

log_ok()   { printf '%b\n' "  ${GREEN}✓${RESET}  $1"; }
log_warn() { printf '%b\n' "  ${YELLOW}⚠${RESET}  $1"; }
log_err()  { printf '%b\n' "  ${RED}✗${RESET}  $1"; }
log_info() { printf '%b\n' "  ${DIM}·${RESET}  $1"; }
log_step() { printf '%b\n' "  ${CYAN}→${RESET}  ${BOLD}$1${RESET}"; }

die() {
  log_err "$1"
  exit 1
}

require_cmd() {
  command -v "$1" &>/dev/null || die "Lệnh '$1' không tồn tại. Vui lòng cài đặt trước."
}

confirm() {
  local prompt="${1:-Tiếp tục?} [y/N] "
  read -r -p "$(printf '%b' "  ${YELLOW}?${RESET}  ${prompt}")" response
  [[ "$response" =~ ^[Yy]$ ]]
}

# ──────────────────────────────────────────────────────────────────────────────
# MODULE 1: KIỂM TRA MÔI TRƯỜNG
# ──────────────────────────────────────────────────────────────────────────────
check_environment() {
  log_header "MODULE 1 — Kiểm Tra Môi Trường Hệ Thống"

  # --- Node.js ---
  log_section "Node.js"
  require_cmd node
  NODE_VERSION=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [[ "$NODE_MAJOR" -ge "$REQUIRED_NODE_MAJOR" ]]; then
    log_ok "Node.js v${NODE_VERSION} (>= v${REQUIRED_NODE_MAJOR} ✓)"
  else
    die "Node.js v${NODE_VERSION} không đạt yêu cầu. Cần >= v${REQUIRED_NODE_MAJOR}.0.0"
  fi

  # --- pnpm ---
  log_section "pnpm"
  require_cmd pnpm
  PNPM_VERSION=$(pnpm --version)
  PNPM_MAJOR=$(echo "$PNPM_VERSION" | cut -d. -f1)
  if [[ "$PNPM_MAJOR" -ge "$REQUIRED_PNPM_MAJOR" ]]; then
    log_ok "pnpm v${PNPM_VERSION} (>= v${REQUIRED_PNPM_MAJOR}.0.0 ✓)"
  else
    die "pnpm v${PNPM_VERSION} không đạt yêu cầu. Cần >= v${REQUIRED_PNPM_MAJOR}.0.0"
  fi

  # --- Git ---
  log_section "Git"
  require_cmd git
  GIT_VERSION=$(git --version | awk '{print $3}')
  log_ok "git v${GIT_VERSION}"

  # --- Kiểm tra cấu trúc monorepo ---
  log_section "Cấu Trúc Monorepo"
  local dirs=("apps" "packages" "services" "deploy" ".github/workflows" ".changeset")
  for dir in "${dirs[@]}"; do
    if [[ -d "${MONOREPO_ROOT}/${dir}" ]]; then
      log_ok "${dir}/"
    else
      log_warn "${dir}/ — không tồn tại"
    fi
  done

  # --- Kiểm tra tệp cấu hình ---
  log_section "Tệp Cấu Hình Cốt Lõi"
  local files=("package.json" "pnpm-workspace.yaml" "turbo.json" ".npmrc" ".changeset/config.json")
  for f in "${files[@]}"; do
    if [[ -f "${MONOREPO_ROOT}/${f}" ]]; then
      log_ok "${f}"
    else
      log_warn "${f} — thiếu"
    fi
  done
}

# ──────────────────────────────────────────────────────────────────────────────
# MODULE 2: CHUẨN HÓA .npmrc (Bảo Mật Chuỗi Cung Ứng)
# ──────────────────────────────────────────────────────────────────────────────
setup_npmrc() {
  log_header "MODULE 2 — Chuẩn Hóa .npmrc & Bảo Mật Registry"

  local npmrc_path="${MONOREPO_ROOT}/.npmrc"

  # Kiểm tra token thật không lẫn vào VCS
  log_section "Kiểm Tra Bảo Mật .npmrc"
  if grep -qE '//npm\.pkg\.github\.com/:_authToken=[^$]' "$npmrc_path" 2>/dev/null; then
    die ".npmrc chứa token thật được hardcode! Hãy dùng biến môi trường \${NPM_TOKEN}"
  fi
  if grep -qE '//registry\.npmjs\.org/:_authToken=[^$]' "$npmrc_path" 2>/dev/null; then
    die ".npmrc chứa NPM_TOKEN thật được hardcode! Dùng \${NODE_AUTH_TOKEN}"
  fi
  log_ok ".npmrc không chứa token thật (VCS-safe ✓)"

  # Kiểm tra scope mapping
  log_section "Kiểm Tra Scope Registry Mapping"
  if grep -q "@vnkrvietnam:registry=https://npm.pkg.github.com" "$npmrc_path" 2>/dev/null; then
    log_ok "Scope ${NPM_SCOPE} → ${NPM_REGISTRY} ✓"
  else
    log_warn "Scope mapping cho ${NPM_SCOPE} chưa được cấu hình trong .npmrc"
    if confirm "Thêm scope mapping?"; then
      cat >> "$npmrc_path" <<EOF

# VNKR scope → GitHub Packages (added by vnkr-infra-setup.sh)
@vnkrvietnam:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${NPM_TOKEN}
EOF
      log_ok "Đã thêm scope mapping vào .npmrc"
    fi
  fi

  # Kiểm tra file .npmrc không bị commit token
  log_section "Git Ignore Kiểm Tra"
  if [[ -f "${MONOREPO_ROOT}/.gitignore" ]]; then
    if grep -q "\.env" "${MONOREPO_ROOT}/.gitignore"; then
      log_ok ".env* được gitignore ✓"
    else
      log_warn ".env* chưa được gitignore — thêm vào .gitignore!"
    fi
  fi

  # Hiển thị cấu hình hiện tại — mỗi dòng .npmrc in riêng biệt
  log_section "Cấu Hình .npmrc Hiện Tại"
  while IFS= read -r line; do
    printf '%b\n' "  ${DIM}${line}${RESET}"
  done < <(grep -v '^#' "$npmrc_path" 2>/dev/null | grep -v '^$' || printf '(trống)\n')
}

# ──────────────────────────────────────────────────────────────────────────────
# MODULE 3: CHUẨN HÓA ĐỊNH DANH GÓI THƯ VIỆN
# ──────────────────────────────────────────────────────────────────────────────
validate_package_naming() {
  log_header "MODULE 3 — Quy Ước Định Danh Gói @vnkrvietnam/*"

  log_section "Quy Chuẩn Định Danh Toàn Cục"
  printf '%b\n' "  ${DIM}Scope    :  @vnkrvietnam/<tên-gói>${RESET}"
  printf '%b\n' "  ${DIM}Registry :  https://npm.pkg.github.com${RESET}"
  printf '%b\n' "  ${DIM}Access   :  restricted (GitHub Packages)${RESET}"
  printf '%b\n' "  ${DIM}Định dạng tên: chữ thường, dấu gạch ngang, không ký tự đặc biệt${RESET}"
  printf '\n'

  local errors=0
  log_section "Kiểm Tra Từng Package"

  for pkg_rel in "${PUBLISHABLE_PACKAGES[@]}"; do
    local pkg_path="${MONOREPO_ROOT}/${pkg_rel}/package.json"
    if [[ ! -f "$pkg_path" ]]; then
      log_warn "${pkg_rel}/package.json — không tồn tại, bỏ qua"
      continue
    fi

    local pkg_name pkg_version pkg_access pkg_registry
    pkg_name=$(json_field    "$pkg_path" "d.name||''")
    pkg_version=$(json_field "$pkg_path" "d.version||''")
    pkg_access=$(json_field  "$pkg_path" "(d.publishConfig||{}).access||''")
    pkg_registry=$(json_field "$pkg_path" "(d.publishConfig||{}).registry||''")

    printf '\n'
    printf '%b\n' "  ${BOLD}${pkg_name}${RESET} @ ${CYAN}${pkg_version}${RESET}"

    # Kiểm tra scope
    if [[ "$pkg_name" == @vnkrvietnam/* ]]; then
      log_ok "Scope @vnkrvietnam ✓"
    else
      log_err "Tên '${pkg_name}' phải có scope @vnkrvietnam!"
      ((errors++))
    fi

    # Kiểm tra định dạng tên (chỉ chữ thường + dấu gạch ngang)
    local bare_name="${pkg_name#@vnkrvietnam/}"
    if [[ "$bare_name" =~ ^[a-z][a-z0-9-]*$ ]]; then
      log_ok "Định dạng tên hợp lệ '${bare_name}' ✓"
    else
      log_err "Tên '${bare_name}' không đúng chuẩn (chỉ [a-z0-9-])"
      ((errors++))
    fi

    # Kiểm tra version semver (regex bash thuần — không cần module semver)
    if is_semver "$pkg_version"; then
      log_ok "Version ${pkg_version} là semver hợp lệ ✓"
    else
      log_err "Version '${pkg_version}' không phải semver hợp lệ!"
      ((errors++))
    fi

    # Kiểm tra publishConfig
    if [[ "$pkg_access" == "restricted" ]]; then
      log_ok "publishConfig.access = restricted ✓"
    else
      log_warn "publishConfig.access = '${pkg_access:-không có}' (nên là 'restricted')"
    fi

    if [[ "$pkg_registry" == "https://npm.pkg.github.com" ]]; then
      log_ok "publishConfig.registry = GitHub Packages ✓"
    else
      log_warn "publishConfig.registry = '${pkg_registry:-không có}' (nên là 'https://npm.pkg.github.com')"
    fi
  done

  printf '\n'
  if [[ "$errors" -eq 0 ]]; then
    log_ok "Tất cả packages đều đạt quy chuẩn định danh ✓"
  else
    die "${errors} package(s) vi phạm quy chuẩn định danh!"
  fi
}

# ──────────────────────────────────────────────────────────────────────────────
# MODULE 4: CHUẨN HÓA WORKSPACE (pnpm + Turborepo)
# ──────────────────────────────────────────────────────────────────────────────
validate_workspace() {
  log_header "MODULE 4 — Chuẩn Hóa Workspace (pnpm + Turborepo)"

  # --- pnpm-workspace.yaml ---
  log_section "pnpm-workspace.yaml"
  local ws_file="${MONOREPO_ROOT}/pnpm-workspace.yaml"
  if [[ -f "$ws_file" ]]; then
    log_ok "pnpm-workspace.yaml tồn tại"
    local ws_patterns
    ws_patterns=$(grep -E "^\s+-" "$ws_file" | sed "s/.*'\(.*\)'/\1/")
    printf '%b\n' "  ${DIM}Workspace patterns:${RESET}"
    while IFS= read -r pattern; do
      printf '%b\n' "    ${DIM}• ${pattern}${RESET}"
    done <<< "$ws_patterns"
  else
    die "pnpm-workspace.yaml không tồn tại!"
  fi

  # --- packageManager field ---
  log_section "packageManager Field (package.json)"
  local declared_pm
  declared_pm=$(json_field "${MONOREPO_ROOT}/package.json" "d.packageManager||''")
  if [[ "$declared_pm" == "$PACKAGE_MANAGER" ]]; then
    log_ok "packageManager = \"${declared_pm}\" ✓"
  else
    log_warn "packageManager = \"${declared_pm}\" (kỳ vọng: \"${PACKAGE_MANAGER}\")"
  fi

  # --- engines field ---
  log_section "engines Field (package.json)"
  local engines_node engines_pnpm
  engines_node=$(json_field "${MONOREPO_ROOT}/package.json" "(d.engines||{}).node||''")
  engines_pnpm=$(json_field "${MONOREPO_ROOT}/package.json" "(d.engines||{}).pnpm||''")
  log_info "engines.node  = \"${engines_node}\""
  log_info "engines.pnpm  = \"${engines_pnpm}\""
  if [[ -n "$engines_node" && -n "$engines_pnpm" ]]; then
    log_ok "Cả hai engines field đều được khai báo ✓"
  else
    log_warn "Thiếu engines field — nên khai báo để enforce runtime versions"
  fi

  # --- turbo.json ---
  log_section "turbo.json — Task Pipeline"
  local turbo_file="${MONOREPO_ROOT}/turbo.json"
  if [[ -f "$turbo_file" ]]; then
    log_ok "turbo.json tồn tại"
    local tasks
    tasks=$(json_field       "$turbo_file" "Object.keys(d.tasks||{}).join(', ')")
    log_info "Tasks: ${tasks}"
    # Kiểm tra task build có dependsOn ^build
    local build_depends
    build_depends=$(json_field "$turbo_file" "JSON.stringify((d.tasks&&d.tasks.build&&d.tasks.build.dependsOn)||[])")
    if echo "$build_depends" | grep -q '"^build"'; then
      log_ok "build.dependsOn [\"^build\"] — topological build order ✓"
    else
      log_warn "build task nên có dependsOn: [\"^build\"] để đảm bảo build order"
    fi
  else
    die "turbo.json không tồn tại!"
  fi

  # --- .changeset/config.json ---
  log_section "Changesets Configuration"
  local cs_config="${MONOREPO_ROOT}/.changeset/config.json"
  if [[ -f "$cs_config" ]]; then
    log_ok ".changeset/config.json tồn tại"
    local cs_access cs_branch cs_update_deps
    cs_access=$(json_field      "$cs_config" "d.access||''")
    cs_branch=$(json_field      "$cs_config" "d.baseBranch||''")
    cs_update_deps=$(json_field "$cs_config" "d.updateInternalDependencies||''")
    log_info "access                    = \"${cs_access}\""
    log_info "baseBranch                = \"${cs_branch}\""
    log_info "updateInternalDependencies= \"${cs_update_deps}\""
    [[ "$cs_access" == "restricted" ]] && log_ok "access = restricted ✓" || log_warn "access nên là 'restricted'"
    [[ "$cs_branch" == "main" ]] && log_ok "baseBranch = main ✓" || log_warn "baseBranch nên là 'main'"
  else
    log_warn ".changeset/config.json không tồn tại — chạy: pnpm changeset init"
  fi
}

# ──────────────────────────────────────────────────────────────────────────────
# MODULE 5: KIỂM TRA CI/CD WORKFLOWS
# ──────────────────────────────────────────────────────────────────────────────
validate_cicd_workflows() {
  log_header "MODULE 5 — Kiểm Tra CI/CD Workflows (.github/workflows)"

  local workflows_dir="${MONOREPO_ROOT}/.github/workflows"
  if [[ ! -d "$workflows_dir" ]]; then
    die ".github/workflows/ không tồn tại!"
  fi

  log_section "Danh Sách Workflows"
  local expected_workflows=(
    "changeset-release.yml"
    "publish-packages.yml"
    "npm-publish.yml"
    "swift-adapter.yml"
    "build-push-containers.yml"
  )

  for wf in "${expected_workflows[@]}"; do
    local wf_path="${workflows_dir}/${wf}"
    if [[ -f "$wf_path" ]]; then
      log_ok "${wf} ✓"
      # Kiểm tra permissions
      if grep -q "permissions:" "$wf_path"; then
        local perms
        perms=$(grep -A5 "permissions:" "$wf_path" | grep -v "permissions:" | grep ":" | head -5 | xargs | tr '\n' ' ')
        log_info "permissions: ${perms}"
      else
        log_warn "${wf} — không có explicit permissions (GITHUB_TOKEN có thể quá rộng)"
      fi
    else
      log_warn "${wf} — không tìm thấy"
    fi
  done

  # Kiểm tra changeset-release.yml có id-token permission cho NPM provenance
  log_section "NPM Provenance Attestation (Supply-Chain Security)"
  local cs_wf="${workflows_dir}/changeset-release.yml"
  if [[ -f "$cs_wf" ]]; then
    if grep -q "id-token: write" "$cs_wf"; then
      log_ok "changeset-release.yml có id-token: write (NPM provenance ✓)"
    else
      log_warn "Thiếu id-token: write trong changeset-release.yml — NPM provenance sẽ không hoạt động"
    fi
  fi

  local npm_wf="${workflows_dir}/npm-publish.yml"
  if [[ -f "$npm_wf" ]]; then
    if grep -q "id-token: write" "$npm_wf"; then
      log_ok "npm-publish.yml có id-token: write (NPM provenance ✓)"
    else
      log_warn "Thiếu id-token: write trong npm-publish.yml"
    fi
  fi
}

# ──────────────────────────────────────────────────────────────────────────────
# MODULE 6: KIỂM TRA BẢO MẬT CHUỖI CUNG ỨNG (Supply-Chain Security)
# ──────────────────────────────────────────────────────────────────────────────
audit_supply_chain() {
  log_header "MODULE 6 — Kiểm Tra Bảo Mật Chuỗi Cung Ứng"

  # --- Lockfile tồn tại & không bị xoá khỏi git ---
  log_section "Lockfile Integrity"
  if [[ -f "${MONOREPO_ROOT}/pnpm-lock.yaml" ]]; then
    log_ok "pnpm-lock.yaml tồn tại ✓"
    local lockfile_lines
    lockfile_lines=$(wc -l < "${MONOREPO_ROOT}/pnpm-lock.yaml")
    log_info "Kích thước: ${lockfile_lines} dòng"
  else
    die "pnpm-lock.yaml không tồn tại! Chạy: pnpm install"
  fi

  # Kiểm tra lockfile không bị gitignore
  if [[ -f "${MONOREPO_ROOT}/.gitignore" ]]; then
    if grep -qE "^pnpm-lock\.yaml" "${MONOREPO_ROOT}/.gitignore" 2>/dev/null; then
      die "pnpm-lock.yaml đang bị gitignore — NGHIÊM TRỌNG! Lockfile phải được commit!"
    else
      log_ok "pnpm-lock.yaml không bị gitignore ✓"
    fi
  fi

  # --- pnpm overrides (supply chain pinning) ---
  log_section "Dependency Pinning (pnpm overrides)"
  local overrides
  overrides=$(json_field "${MONOREPO_ROOT}/package.json" "JSON.stringify((d.pnpm&&d.pnpm.overrides)||{},null,2)" || echo "{}")
  if [[ "$overrides" != "{}" ]]; then
    log_ok "pnpm.overrides được cấu hình (pinned dependencies)"
    # In từng dòng riêng để không bị dồn thành 1 dòng
    while IFS= read -r line; do
      printf '%b\n' "     ${DIM}${line}${RESET}"
    done <<< "$overrides"
  else
    log_info "Không có pnpm.overrides (tùy chọn)"
  fi

  # --- Kiểm tra .env files không bị commit ---
  log_section "Bảo Mật Secrets / .env Files"
  local env_files_committed
  env_files_committed=$(git -C "${MONOREPO_ROOT}" ls-files --error-unmatch ".env" 2>/dev/null && echo "FOUND" || echo "SAFE")
  if [[ "$env_files_committed" == "FOUND" ]]; then
    die ".env đang được track bởi git! Hãy chạy: git rm --cached .env"
  else
    log_ok ".env không bị commit vào git ✓"
  fi

  local env_example_committed
  env_example_committed=$(git -C "${MONOREPO_ROOT}" ls-files --error-unmatch ".env.example" 2>/dev/null && echo "FOUND" || echo "MISSING")
  if [[ "$env_example_committed" == "FOUND" ]]; then
    log_ok ".env.example có mặt trong VCS (template cho dev ✓)"
  else
    log_warn ".env.example nên được commit để hướng dẫn dev setup"
  fi

  # --- pnpm audit ---
  log_section "pnpm audit (Dependency Vulnerability Scan)"
  log_info "Đang quét lỗ hổng bảo mật..."
  if pnpm audit --audit-level=high 2>/dev/null; then
    log_ok "Không phát hiện lỗ hổng high/critical ✓"
  else
    log_warn "Phát hiện lỗ hổng bảo mật — kiểm tra: pnpm audit --audit-level=high"
  fi

  # --- Kiểm tra workspace: protocol ---
  log_section "Workspace Protocol (workspace:*)"
  local workspace_refs
  workspace_refs=$(grep -r '"workspace:\*"' "${MONOREPO_ROOT}/packages" 2>/dev/null | wc -l || echo 0)
  if [[ "$workspace_refs" -gt 0 ]]; then
    log_ok "${workspace_refs} workspace:* references (cross-package deps ✓)"
  else
    log_info "Không tìm thấy workspace:* references"
  fi
}

# ──────────────────────────────────────────────────────────────────────────────
# MODULE 7: THIẾT LẬP MÔI TRƯỜNG LOCAL DEV
# ──────────────────────────────────────────────────────────────────────────────
setup_local_dev() {
  log_header "MODULE 7 — Thiết Lập Môi Trường Development"

  log_section "Xác Thực GitHub Packages (NPM_TOKEN)"
  if [[ -z "${NPM_TOKEN:-}" ]]; then
    log_warn "NPM_TOKEN chưa được export trong shell hiện tại"
    printf '\n'
    printf '%b\n' "  ${BOLD}Hướng dẫn thiết lập NPM_TOKEN cho local dev:${RESET}"
    printf '\n'
    printf '%b\n' "  ${DIM}1. Tạo GitHub PAT tại: https://github.com/settings/tokens${RESET}"
    printf '%b\n' "  ${DIM}   Scopes cần thiết: read:packages, write:packages${RESET}"
    printf '\n'
    printf '%b\n' "  ${DIM}2. Thêm vào ~/.npmrc của bạn:${RESET}"
    printf '%b\n' "  ${DIM}   //npm.pkg.github.com/:_authToken=<YOUR_PAT>${RESET}"
    printf '\n'
    printf '%b\n' "  ${DIM}3. Hoặc export trong shell:${RESET}"
    printf '%b\n' "  ${DIM}   export NPM_TOKEN=<YOUR_PAT>${RESET}"
    printf '\n'
    printf '%b\n' "  ${DIM}4. Hoặc dùng npm login:${RESET}"
    printf '%b\n' "  ${DIM}   npm login --scope=@vnkrvietnam --registry=https://npm.pkg.github.com${RESET}"
    printf '\n'
  else
    log_ok "NPM_TOKEN được export ✓"
    # Validate token với registry
    log_info "Kiểm tra kết nối tới registry..."
    if curl -sf -H "Authorization: Bearer ${NPM_TOKEN}" \
      "https://npm.pkg.github.com/@vnkrvietnam%2ftypes" > /dev/null 2>&1; then
      log_ok "Kết nối tới GitHub Packages thành công ✓"
    else
      log_warn "Không thể xác thực với GitHub Packages — kiểm tra lại NPM_TOKEN"
    fi
  fi

  # --- Install dependencies ---
  log_section "Cài Đặt Dependencies (pnpm install)"
  if [[ -d "${MONOREPO_ROOT}/node_modules" ]]; then
    log_info "node_modules đã tồn tại — bỏ qua install"
  else
    log_step "Chạy: pnpm install --frozen-lockfile"
    if confirm "Thực hiện pnpm install?"; then
      cd "${MONOREPO_ROOT}" && pnpm install --frozen-lockfile
      log_ok "Dependencies đã được cài đặt ✓"
    fi
  fi
}

# ──────────────────────────────────────────────────────────────────────────────
# MODULE 8: QUYTRÌNH PUBLISH (Hướng Dẫn)
# ──────────────────────────────────────────────────────────────────────────────
show_publish_guide() {
  log_header "MODULE 8 — Quy Trình Publish Packages (@vnkrvietnam/*)"

  printf '%b\n' "${BOLD}${MAGENTA}  Quy Trình Khuyến Nghị: Changesets (Tự Động via CI)${RESET}"
  printf '\n'
  printf '%b\n' "  ${BOLD}Bước 1 — Ghi nhận thay đổi (sau khi code xong):${RESET}"
  printf '%b\n' "  ${CYAN}  pnpm changeset:add${RESET}"
  printf '%b\n' "  ${DIM}  → Chọn packages bị ảnh hưởng${RESET}"
  printf '%b\n' "  ${DIM}  → Chọn bump type: patch | minor | major${RESET}"
  printf '%b\n' "  ${DIM}  → Viết tóm tắt (dùng cho CHANGELOG)${RESET}"
  printf '%b\n' "  ${DIM}  → Commit file .changeset/<tên>.md cùng code${RESET}"
  printf '\n'
  printf '%b\n' "  ${BOLD}Bước 2 — Kiểm tra trạng thái changesets:${RESET}"
  printf '%b\n' "  ${CYAN}  pnpm changeset:status${RESET}"
  printf '\n'
  printf '%b\n' "  ${BOLD}Bước 3 — Merge vào main → CI tự động xử lý:${RESET}"
  printf '%b\n' "  ${DIM}  push → main${RESET}"
  printf '%b\n' "  ${DIM}    ├─ Có .changeset/*.md → Tạo PR \"Version Packages\"${RESET}"
  printf '%b\n' "  ${DIM}    │    (bump versions + viết CHANGELOG)${RESET}"
  printf '%b\n' "  ${DIM}    └─ PR được merge → build + test + publish${RESET}"
  printf '%b\n' "  ${DIM}         → push tags + GitHub Releases${RESET}"
  printf '\n'
  printf '%b\n' "${BOLD}${YELLOW}  Publish Thủ Công (Khẩn Cấp / Không qua CI):${RESET}"
  printf '\n'
  printf '%b\n' "  ${CYAN}  pnpm changeset:version  ${DIM}# bump versions + viết CHANGELOG${RESET}"
  printf '%b\n' "  ${CYAN}  pnpm changeset:publish  ${DIM}# build → test → publish${RESET}"
  printf '%b\n' "  ${CYAN}  pnpm changeset:tag      ${DIM}# tạo git tags${RESET}"
  printf '\n'
  printf '%b\n' "${BOLD}${RED}  Legacy Scripts (Chỉ dùng khi Changesets không phù hợp):${RESET}"
  printf '\n'
  printf '%b\n' "  ${CYAN}  pnpm publish:dry   ${DIM}# Simulate (no upload)${RESET}"
  printf '%b\n' "  ${CYAN}  pnpm publish:all   ${DIM}# Real publish all packages${RESET}"
  printf '%b\n' "  ${CYAN}  pnpm version:patch ${DIM}# Bump patch (no CHANGELOG)${RESET}"
  printf '%b\n' "  ${CYAN}  pnpm version:minor ${DIM}# Bump minor (no CHANGELOG)${RESET}"
  printf '%b\n' "  ${CYAN}  pnpm version:major ${DIM}# Bump major (no CHANGELOG)${RESET}"
  printf '\n'
  printf '%b\n' "${BOLD}  Thứ Tự Build (Turborepo Dependency Graph):${RESET}"
  printf '\n'
  printf '%b\n' "  ${DIM}@vnkrvietnam/types${RESET}"
  printf '%b\n' "  ${DIM}    └── @vnkrvietnam/config${RESET}"
  printf '%b\n' "  ${DIM}            ├── @vnkrvietnam/core-sdk${RESET}"
  printf '%b\n' "  ${DIM}            ├── @vnkrvietnam/swift-adapter${RESET}"
  printf '%b\n' "  ${DIM}            └── @vnkrvietnam/merchant-sdk${RESET}"
  printf '%b\n' "  ${DIM}                     └── @vnkrvietnam/ui-kit${RESET}"
  printf '\n'
}

# ──────────────────────────────────────────────────────────────────────────────
# MODULE 9: BÁO CÁO TỔNG KẾT
# ──────────────────────────────────────────────────────────────────────────────
generate_report() {
  log_header "MODULE 9 — Báo Cáo Tổng Kết Hạ Tầng"

  printf '%b\n' "${BOLD}  Monorepo:${RESET}       ${MONOREPO_ROOT}"
  printf '%b\n' "${BOLD}  Scope:${RESET}          ${NPM_SCOPE}"
  printf '%b\n' "${BOLD}  Registry:${RESET}       ${NPM_REGISTRY}"
  printf '%b\n' "${BOLD}  Node.js:${RESET}        v${NODE_VERSION:-unknown}"
  printf '%b\n' "${BOLD}  pnpm:${RESET}           v${PNPM_VERSION:-unknown}"
  printf '%b\n' "${BOLD}  Packages:${RESET}       ${#PUBLISHABLE_PACKAGES[@]} publishable"
  printf '\n'

  log_section "Packages Được Publish"
  for pkg_rel in "${PUBLISHABLE_PACKAGES[@]}"; do
    local pkg_path="${MONOREPO_ROOT}/${pkg_rel}/package.json"
    if [[ -f "$pkg_path" ]]; then
      local pkg_name pkg_version
      pkg_name=$(json_field    "$pkg_path" "d.name||'unknown'")
      pkg_version=$(json_field "$pkg_path" "d.version||'unknown'")
      printf '%b\n' "  ${GREEN}●${RESET}  ${BOLD}${pkg_name}${RESET}  ${DIM}@${pkg_version}${RESET}"
    fi
  done

  printf '\n'
  log_section "GitHub Actions Workflows"
  local wfs=("changeset-release.yml" "publish-packages.yml" "npm-publish.yml" "swift-adapter.yml" "build-push-containers.yml")
  for wf in "${wfs[@]}"; do
    local wf_path="${MONOREPO_ROOT}/.github/workflows/${wf}"
    if [[ -f "$wf_path" ]]; then
      printf '%b\n' "  ${GREEN}●${RESET}  ${wf}"
    else
      printf '%b\n' "  ${YELLOW}○${RESET}  ${wf} ${DIM}(thiếu)${RESET}"
    fi
  done

  printf '\n'
  printf '%b\n' "  ${DIM}Thời gian: $(date '+%Y-%m-%d %H:%M:%S %Z')${RESET}"
  printf '\n'
}

# ──────────────────────────────────────────────────────────────────────────────
# ENTRY POINT — Usage
# ──────────────────────────────────────────────────────────────────────────────
usage() {
  printf '\n'
  printf '%b\n' "${BOLD}${CYAN}VNKR Infra Setup — Chuẩn Hóa Hạ Tầng @vnkrvietnam${RESET}"
  printf '\n'
  printf '%b\n' "  ${BOLD}Usage:${RESET} bash scripts/vnkr-infra-setup.sh [module]"
  printf '\n'
  printf '%b\n' "  ${BOLD}Modules:${RESET}"
  printf '%b\n' "    ${CYAN}all${RESET}         Chạy toàn bộ pipeline kiểm tra và chuẩn hóa (mặc định)"
  printf '%b\n' "    ${CYAN}env${RESET}         Module 1 — Kiểm tra môi trường"
  printf '%b\n' "    ${CYAN}npmrc${RESET}       Module 2 — Chuẩn hóa .npmrc"
  printf '%b\n' "    ${CYAN}naming${RESET}      Module 3 — Validate định danh packages"
  printf '%b\n' "    ${CYAN}workspace${RESET}   Module 4 — Validate pnpm/Turborepo workspace"
  printf '%b\n' "    ${CYAN}cicd${RESET}        Module 5 — Kiểm tra CI/CD workflows"
  printf '%b\n' "    ${CYAN}audit${RESET}       Module 6 — Security & supply-chain audit"
  printf '%b\n' "    ${CYAN}setup${RESET}       Module 7 — Thiết lập local dev environment"
  printf '%b\n' "    ${CYAN}publish${RESET}     Module 8 — Hướng dẫn quy trình publish"
  printf '%b\n' "    ${CYAN}report${RESET}      Module 9 — Báo cáo tổng kết"
  printf '\n'
  printf '%b\n' "  ${BOLD}Ví dụ:${RESET}"
  printf '%b\n' "    bash scripts/vnkr-infra-setup.sh              # full pipeline"
  printf '%b\n' "    bash scripts/vnkr-infra-setup.sh audit        # chỉ security audit"
  printf '%b\n' "    bash scripts/vnkr-infra-setup.sh publish      # xem hướng dẫn publish"
  printf '\n'
}

# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────
main() {
  local module="${1:-all}"

  printf '\n'
  printf '%b\n' "${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════════════════════════╗${RESET}"
  printf '%b\n' "${BOLD}${MAGENTA}║     VNKR TECH HOLDING JSC — Global Enterprise Infrastructure Setup       ║${RESET}"
  printf '%b\n' "${BOLD}${MAGENTA}║     Chuẩn Hóa Hạ Tầng Mã Nguồn & Quản Lý Gói npm (@vnkrvietnam)        ║${RESET}"
  printf '%b\n' "${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════════════════════╝${RESET}"
  printf '%b\n' "  ${DIM}Monorepo: ${MONOREPO_ROOT}${RESET}"
  printf '%b\n' "  ${DIM}Scope:    ${NPM_SCOPE} → ${NPM_REGISTRY}${RESET}"
  printf '%b\n' "  ${DIM}Thời gian: $(date '+%Y-%m-%d %H:%M:%S %Z')${RESET}"

  case "$module" in
    all)
      check_environment
      setup_npmrc
      validate_package_naming
      validate_workspace
      validate_cicd_workflows
      audit_supply_chain
      show_publish_guide
      generate_report
      printf '\n'
      printf '%b\n' "${BOLD}${GREEN}  ✅  Pipeline hoàn tất — hạ tầng @vnkrvietnam đạt chuẩn Global Enterprise.${RESET}"
      printf '\n'
      ;;
    env)         check_environment ;;
    npmrc)       setup_npmrc ;;
    naming)      check_environment && validate_package_naming ;;
    workspace)   check_environment && validate_workspace ;;
    cicd)        validate_cicd_workflows ;;
    audit)       check_environment && audit_supply_chain ;;
    setup)       check_environment && setup_local_dev ;;
    publish)     show_publish_guide ;;
    report)      check_environment && generate_report ;;
    help|-h|--help) usage ;;
    *)
      log_err "Module không hợp lệ: '${module}'"
      usage
      exit 1
      ;;
  esac
}

main "$@"
