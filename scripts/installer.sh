#!/usr/bin/env bash
# =============================================================================
# scripts/installer.sh — VNKR Tech Holding Monorepo VPS Auto-Installer
# =============================================================================
# Tự động cài đặt & cấu hình toàn bộ môi trường trên VPS cho monorepo VNKR.
# Hỗ trợ: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+
#
# Sử dụng:
#   sudo bash scripts/installer.sh
#   sudo bash scripts/installer.sh --db-password mypassword --skip-redis
#
# =============================================================================

set -euo pipefail

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
readonly LOG_FILE="/var/log/vnkr-installer.log"
readonly APP_PORT=3000
readonly APP_USER="${SUDO_USER:-$(whoami)}"

# ANSI colors — dùng $'\e[...]', KHÔNG dùng \033
readonly RED=$'\e[0;31m'
readonly GREEN=$'\e[0;32m'
readonly YELLOW=$'\e[1;33m'
readonly BLUE=$'\e[0;34m'
readonly CYAN=$'\e[0;36m'
readonly BOLD=$'\e[1m'
readonly RESET=$'\e[0m'

# ─── LOGGING ──────────────────────────────────────────────────────────────────
log()     { printf '%b\n' "${BLUE}[INFO]${RESET}  $*" | tee -a "$LOG_FILE"; }
success() { printf '%b\n' "${GREEN}[OK]${RESET}    $*" | tee -a "$LOG_FILE"; }
warn()    { printf '%b\n' "${YELLOW}[WARN]${RESET}  $*" | tee -a "$LOG_FILE"; }
error()   { printf '%b\n' "${RED}[ERROR]${RESET} $*" | tee -a "$LOG_FILE"; }
step()    { printf '%b\n' "${BOLD}${CYAN}━━━ $* ━━━${RESET}" | tee -a "$LOG_FILE"; }
die()     { error "$*"; exit 1; }

# ─── GLOBALS (gán sau detect_system) ─────────────────────────────────────────
OS_ID=""
OS_VERSION=""
PKG_MANAGER=""   # apt | dnf | yum
PKG_UPDATE=""
PKG_INSTALL=""
DB_PASSWORD="${DB_PASSWORD:-}"
SKIP_REDIS="${SKIP_REDIS:-false}"

# =============================================================================
# BƯỚC 1 — detect_system()
# Kiểm tra root, nhận diện OS và package manager
# =============================================================================
detect_system() {
  step "BƯỚC 1/12 — Nhận diện hệ thống"

  # Kiểm tra root
  if [[ $EUID -ne 0 ]]; then
    die "Script phải chạy với quyền root. Dùng: sudo bash $0"
  fi

  # Đọc /etc/os-release
  if [[ ! -f /etc/os-release ]]; then
    die "Không tìm thấy /etc/os-release — không xác định được OS."
  fi
  # shellcheck source=/dev/null
  source /etc/os-release
  OS_ID="${ID:-unknown}"
  OS_VERSION="${VERSION_ID:-0}"

  case "$OS_ID" in
    ubuntu|debian|linuxmint)
      PKG_MANAGER="apt"
      PKG_UPDATE="apt-get update -y"
      PKG_INSTALL="apt-get install -y"
      ;;
    centos|rhel|rocky|almalinux|ol)
      if command -v dnf &>/dev/null; then
        PKG_MANAGER="dnf"
        PKG_UPDATE="dnf check-update -y || true"
        PKG_INSTALL="dnf install -y"
      else
        PKG_MANAGER="yum"
        PKG_UPDATE="yum check-update -y || true"
        PKG_INSTALL="yum install -y"
      fi
      ;;
    fedora)
      PKG_MANAGER="dnf"
      PKG_UPDATE="dnf check-update -y || true"
      PKG_INSTALL="dnf install -y"
      ;;
    *)
      die "OS không được hỗ trợ: $OS_ID $OS_VERSION"
      ;;
  esac

  log "OS     : $PRETTY_NAME"
  log "OS ID  : $OS_ID $OS_VERSION"
  log "PKG MGR: $PKG_MANAGER"
  log "Arch   : $(uname -m)"
  log "Kernel : $(uname -r)"
  success "Nhận diện hệ thống hoàn tất."
}

# =============================================================================
# BƯỚC 2 — check_system_requirements()
# Kiểm tra RAM ≥ 4GB, disk ≥ 10GB, kết nối Internet
# =============================================================================
check_system_requirements() {
  step "BƯỚC 2/12 — Kiểm tra yêu cầu hệ thống"

  # RAM — /proc/meminfo đơn vị kB
  local mem_kb
  mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
  local mem_gb=$(( mem_kb / 1024 / 1024 ))
  if (( mem_kb < 3900000 )); then
    die "RAM không đủ: ${mem_gb}GB (yêu cầu ≥ 4GB)"
  fi
  success "RAM: ${mem_gb}GB ✓"

  # Disk — df đơn vị kB, lấy root partition
  local disk_avail_kb
  disk_avail_kb=$(df -k "$PROJECT_DIR" | awk 'NR==2{print $4}')
  local disk_avail_gb=$(( disk_avail_kb / 1024 / 1024 ))
  if (( disk_avail_kb < 10000000 )); then
    die "Dung lượng đĩa không đủ: ${disk_avail_gb}GB còn trống (yêu cầu ≥ 10GB)"
  fi
  success "Disk: ${disk_avail_gb}GB trống ✓"

  # Internet connectivity — kiểm tra 3 host
  local hosts=("1.1.1.1" "8.8.8.8" "github.com")
  local connected=false
  for host in "${hosts[@]}"; do
    if ping -c 1 -W 3 "$host" &>/dev/null 2>&1; then
      connected=true
      break
    fi
  done
  if [[ "$connected" == "false" ]]; then
    die "Không có kết nối Internet. Kiểm tra network interface."
  fi
  success "Kết nối Internet ✓"

  success "Tất cả yêu cầu hệ thống đạt."
}

# =============================================================================
# BƯỚC 3 — install_dependencies()
# Cài các gói nền tảng: curl wget git build-essential python3 jq ufw
# =============================================================================
install_dependencies() {
  step "BƯỚC 3/12 — Cài đặt dependencies"

  log "Đang cập nhật package index..."
  eval "$PKG_UPDATE" >> "$LOG_FILE" 2>&1

  local common_pkgs=(curl wget git python3 jq)
  local extra_pkgs=()

  case "$PKG_MANAGER" in
    apt)
      extra_pkgs=(build-essential ufw software-properties-common gnupg ca-certificates lsb-release)
      ;;
    dnf|yum)
      extra_pkgs=(gcc gcc-c++ make firewalld epel-release)
      ;;
  esac

  log "Cài packages: ${common_pkgs[*]} ${extra_pkgs[*]}"
  eval "$PKG_INSTALL ${common_pkgs[*]} ${extra_pkgs[*]}" >> "$LOG_FILE" 2>&1

  # Verify
  for bin in curl wget git python3 jq; do
    command -v "$bin" &>/dev/null || die "Không tìm thấy '$bin' sau khi cài."
  done

  success "Tất cả dependencies đã cài xong."
}

# =============================================================================
# BƯỚC 4 — install_nodejs()
# Node v22 LTS qua NodeSource, fallback NVM, retry ×3
# =============================================================================
install_nodejs() {
  step "BƯỚC 4/12 — Cài đặt Node.js v22 LTS"

  local NODE_MAJOR=22
  local attempts=3

  # Hàm kiểm tra version
  _check_node() {
    if command -v node &>/dev/null; then
      local v
      v=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
      [[ "$v" -ge "$NODE_MAJOR" ]] && return 0
    fi
    return 1
  }

  if _check_node; then
    success "Node.js $(node -v) đã tồn tại và đủ version."
    return 0
  fi

  # Thử NodeSource (retry ×3)
  local ok=false
  for ((i=1; i<=attempts; i++)); do
    log "Thử NodeSource (lần $i/$attempts)..."
    if curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o /tmp/nodesource_setup.sh 2>>"$LOG_FILE" \
       && bash /tmp/nodesource_setup.sh >> "$LOG_FILE" 2>&1 \
       && eval "$PKG_INSTALL nodejs" >> "$LOG_FILE" 2>&1; then
      ok=true
      break
    fi
    warn "NodeSource thất bại, chờ 5s rồi thử lại..."
    sleep 5
  done

  if [[ "$ok" == "false" ]]; then
    warn "NodeSource thất bại, fallback sang NVM..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash >> "$LOG_FILE" 2>&1
    # Nạp nvm vào shell hiện tại
    export NVM_DIR="$HOME/.nvm"
    # shellcheck source=/dev/null
    [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
    nvm install "$NODE_MAJOR" >> "$LOG_FILE" 2>&1
    nvm use "$NODE_MAJOR" >> "$LOG_FILE" 2>&1
    nvm alias default "$NODE_MAJOR" >> "$LOG_FILE" 2>&1
  fi

  _check_node || die "Cài Node.js thất bại sau $attempts lần thử."
  success "Node.js $(node -v) đã cài xong."
}

# =============================================================================
# BƯỚC 5 — install_pnpm()
# npm install -g pnpm@latest, verify pnpm -v
# =============================================================================
install_pnpm() {
  step "BƯỚC 5/12 — Cài đặt pnpm"

  if command -v pnpm &>/dev/null; then
    local v
    v=$(pnpm -v)
    local major="${v%%.*}"
    if (( major >= 9 )); then
      success "pnpm $v đã tồn tại."
      return 0
    fi
    warn "pnpm $v < 9, đang nâng cấp..."
  fi

  npm install -g pnpm@latest >> "$LOG_FILE" 2>&1

  command -v pnpm &>/dev/null || die "Cài pnpm thất bại."
  local installed_v
  installed_v=$(pnpm -v)
  success "pnpm $installed_v đã cài xong."
}

# =============================================================================
# BƯỚC 6 — install_redis()
# Redis Server, systemctl enable, redis-cli ping retry ×3
# =============================================================================
install_redis() {
  step "BƯỚC 6/12 — Cài đặt Redis"

  if [[ "$SKIP_REDIS" == "true" ]]; then
    warn "SKIP_REDIS=true — bỏ qua bước cài Redis."
    return 0
  fi

  case "$PKG_MANAGER" in
    apt)
      eval "$PKG_INSTALL redis-server" >> "$LOG_FILE" 2>&1
      ;;
    dnf|yum)
      eval "$PKG_INSTALL redis" >> "$LOG_FILE" 2>&1
      ;;
  esac

  systemctl enable redis-server 2>/dev/null || systemctl enable redis 2>/dev/null || true
  systemctl start  redis-server 2>/dev/null || systemctl start  redis 2>/dev/null || true

  # Retry redis-cli ping ×3
  local pong=""
  for ((i=1; i<=3; i++)); do
    log "redis-cli ping (lần $i/3)..."
    pong=$(redis-cli ping 2>/dev/null || true)
    if [[ "$pong" == "PONG" ]]; then
      break
    fi
    sleep 3
  done

  [[ "$pong" == "PONG" ]] || die "Redis không phản hồi sau 3 lần thử."
  success "Redis đang chạy và phản hồi PONG."
}

# =============================================================================
# BƯỚC 7 — configure_database()
# MySQL: prompt/default password, test kết nối, import initial.sql,
# sinh 4 secret tokens HEX 32/64-bit cho .env
# =============================================================================
configure_database() {
  step "BƯỚC 7/12 — Cấu hình Database (PostgreSQL 16)"

  # Cài PostgreSQL nếu chưa có
  if ! command -v psql &>/dev/null; then
    log "Cài PostgreSQL..."
    case "$PKG_MANAGER" in
      apt)     eval "$PKG_INSTALL postgresql postgresql-contrib" >> "$LOG_FILE" 2>&1 ;;
      dnf|yum) eval "$PKG_INSTALL postgresql-server postgresql-contrib" >> "$LOG_FILE" 2>&1
               postgresql-setup initdb 2>>"$LOG_FILE" || true ;;
    esac
    systemctl enable postgresql >> "$LOG_FILE" 2>&1 || true
    systemctl start  postgresql >> "$LOG_FILE" 2>&1 || true
    sleep 3
  fi

  local env_file="$PROJECT_DIR/.env"

  # Đọc password từ .env hiện có (ưu tiên), rồi mới prompt/sinh mới
  if [[ -f "$env_file" ]]; then
    DB_PASSWORD=$(grep -m1 '^POSTGRES_PASSWORD=' "$env_file" | cut -d= -f2- | tr -d '"' || true)
  fi
  if [[ -z "${DB_PASSWORD:-}" ]]; then
    if [[ -t 0 ]]; then
      read -r -s -p "$(printf '%b' "${CYAN}Nhập PostgreSQL postgres password (Enter = tự sinh): ${RESET}")" DB_PASSWORD
      printf '\n'
    fi
  fi
  if [[ -z "${DB_PASSWORD:-}" ]]; then
    DB_PASSWORD=$(openssl rand -hex 16)
    log "Sinh POSTGRES_PASSWORD ngẫu nhiên."
  fi

  # Set password cho superuser postgres & tạo database vnkr
  sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${DB_PASSWORD}';" >> "$LOG_FILE" 2>&1 \
    || warn "Không thể set postgres password — có thể đã được set trước đó."

  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='vnkr';" \
    | grep -q 1 || \
  sudo -u postgres psql -c \
    "CREATE DATABASE vnkr ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8' TEMPLATE template0;" \
    >> "$LOG_FILE" 2>&1

  # Test kết nối
  PGPASSWORD="${DB_PASSWORD}" psql -U postgres -h 127.0.0.1 -d vnkr -c "SELECT 1;" >> "$LOG_FILE" 2>&1 \
    || die "Không kết nối được PostgreSQL. Kiểm tra: $LOG_FILE"
  success "Kết nối PostgreSQL thành công."

  # Import initial.sql nếu tồn tại
  local sql_file="$PROJECT_DIR/database/initial.sql"
  if [[ -f "$sql_file" ]]; then
    log "Importing $sql_file..."
    PGPASSWORD="${DB_PASSWORD}" psql -U postgres -h 127.0.0.1 -d vnkr < "$sql_file" >> "$LOG_FILE" 2>&1
    success "Import initial.sql hoàn tất."
  else
    warn "Không tìm thấy $sql_file — bỏ qua import."
  fi

  # Fill các REPLACE_WITH_* secrets trong .env hiện có
  if [[ -f "$env_file" ]]; then
    local jwt refresh pin compliance
    jwt=$(openssl rand -hex 64)
    refresh=$(openssl rand -hex 64)
    pin=$(openssl rand -hex 32)
    compliance=$(openssl rand -hex 32)

    sed -i "s|REPLACE_WITH_64_BYTE_RANDOM_HEX_FOR_ACCESS_TOKEN|${jwt}|g"     "$env_file"
    sed -i "s|REPLACE_WITH_64_BYTE_RANDOM_HEX_FOR_REFRESH_TOKEN|${refresh}|g" "$env_file"
    sed -i "s|REPLACE_WITH_32_BYTE_HEX_KEY_FOR_PIN_HASHING|${pin}|g"          "$env_file"
    sed -i "s|REPLACE_WITH_COMPLIANCE_VAULT_KEY_32_BYTES|${compliance}|g"      "$env_file"

    # Cập nhật POSTGRES_PASSWORD & DATABASE_URL
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${DB_PASSWORD}|" "$env_file"
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@127.0.0.1:5432/vnkr|" "$env_file"

    success ".env cập nhật PostgreSQL credentials và secrets thành công."
    log "POSTGRES_PASSWORD, JWT_SECRET, PIN_ENCRYPTION_KEY, COMPLIANCE_SECRET_KEY đã set."
    return 0
  fi

  # Tạo .env mới nếu chưa có
  local jwt refresh pin compliance webhook
  jwt=$(openssl rand -hex 64)
  refresh=$(openssl rand -hex 64)
  pin=$(openssl rand -hex 32)
  compliance=$(openssl rand -hex 32)
  webhook=$(openssl rand -hex 64)

  cat > "$env_file" <<EOF
# Generated by scripts/installer.sh — $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# VNKR Tech Holding Monorepo

NODE_ENV=production
APP_PORT=${APP_PORT}

# PostgreSQL
POSTGRES_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@127.0.0.1:5432/vnkr

# Redis
REDIS_URL=redis://127.0.0.1:6379

# JWT & Security
JWT_SECRET=${jwt}
JWT_EXPIRE=15m
REFRESH_TOKEN_SECRET=${refresh}
REFRESH_TOKEN_EXPIRE=7d
PIN_ENCRYPTION_KEY=${pin}
COMPLIANCE_SECRET_KEY=${compliance}
BANK_WEBHOOK_SECRET=${webhook}

API_BASE_URL=https://dev-api.vnkr.vn/api/v1
EOF
  chmod 600 "$env_file"
  success ".env tạo tại $env_file"
  log "Tất cả secrets đã được sinh và lưu."
}

# =============================================================================
# BƯỚC 8 — build_application()
# Kiểm tra AVX2, pnpm install → pnpm build:frontend → pnpm seed
# =============================================================================
build_application() {
  step "BƯỚC 8/12 — Build ứng dụng"

  # Kiểm tra AVX2 (cần cho một số native addons)
  if grep -q avx2 /proc/cpuinfo 2>/dev/null; then
    success "AVX2 hỗ trợ ✓"
  else
    warn "CPU không hỗ trợ AVX2 — một số native modules có thể không chạy tối ưu."
  fi

  cd "$PROJECT_DIR"

  log "Chạy pnpm install..."
  pnpm install --frozen-lockfile >> "$LOG_FILE" 2>&1 \
    || pnpm install >> "$LOG_FILE" 2>&1 \
    || die "pnpm install thất bại."
  success "pnpm install hoàn tất."

  log "Chạy pnpm build:frontend..."
  if pnpm run build:frontend >> "$LOG_FILE" 2>&1; then
    success "pnpm build:frontend hoàn tất."
  else
    warn "build:frontend thất bại — kiểm tra log: $LOG_FILE"
  fi

  # Seed database nếu script tồn tại
  if node -e "
    const pkg = require('./package.json');
    process.exit(pkg.scripts && pkg.scripts.seed ? 0 : 1);
  " 2>/dev/null; then
    log "Chạy pnpm seed..."
    pnpm run seed >> "$LOG_FILE" 2>&1 || warn "pnpm seed thất bại — kiểm tra log."
    success "pnpm seed hoàn tất."
  else
    warn "Không tìm thấy script 'seed' trong package.json — bỏ qua."
  fi
}

# =============================================================================
# BƯỚC 9 — configure_webserver()
# Detect nginx/apache, cấu hình reverse proxy → port APP_PORT
# =============================================================================
configure_webserver() {
  step "BƯỚC 9/12 — Cấu hình Web Server"

  local server=""

  if command -v nginx &>/dev/null || systemctl list-unit-files nginx.service &>/dev/null 2>&1; then
    server="nginx"
  elif command -v apache2 &>/dev/null || command -v httpd &>/dev/null; then
    server="apache"
  else
    # Cài nginx nếu không có server nào
    log "Không tìm thấy web server — cài Nginx..."
    case "$PKG_MANAGER" in
      apt)     eval "$PKG_INSTALL nginx" >> "$LOG_FILE" 2>&1 ;;
      dnf|yum) eval "$PKG_INSTALL nginx" >> "$LOG_FILE" 2>&1 ;;
    esac
    server="nginx"
  fi

  if [[ "$server" == "nginx" ]]; then
    log "Cấu hình Nginx reverse proxy → localhost:${APP_PORT}"
    local nginx_conf="/etc/nginx/sites-available/vnkr"
    local nginx_enabled="/etc/nginx/sites-enabled/vnkr"

    # Fallback cho CentOS/RHEL không có sites-available
    if [[ ! -d /etc/nginx/sites-available ]]; then
      nginx_conf="/etc/nginx/conf.d/vnkr.conf"
      nginx_enabled=""
    fi

    cat > "$nginx_conf" <<NGINX
# VNKR — Generated by scripts/installer.sh
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy headers
    proxy_set_header Host              \$host;
    proxy_set_header X-Real-IP         \$remote_addr;
    proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;

    # WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade    \$http_upgrade;
    proxy_set_header Connection "upgrade";

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
    }

    # API Gateway
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:5001;
    }
}
NGINX

    [[ -n "$nginx_enabled" ]] && ln -sf "$nginx_conf" "$nginx_enabled" 2>/dev/null || true
    # Xóa default site
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

    nginx -t >> "$LOG_FILE" 2>&1 || die "Cấu hình Nginx không hợp lệ."
    systemctl enable nginx >> "$LOG_FILE" 2>&1
    systemctl restart nginx >> "$LOG_FILE" 2>&1
    success "Nginx đã cấu hình và khởi động lại."

  elif [[ "$server" == "apache" ]]; then
    log "Cấu hình Apache reverse proxy → localhost:${APP_PORT}"
    local apache_conf

    if command -v apache2 &>/dev/null; then
      apache_conf="/etc/apache2/sites-available/vnkr.conf"
      a2enmod proxy proxy_http proxy_wstunnel rewrite headers >> "$LOG_FILE" 2>&1 || true
    else
      apache_conf="/etc/httpd/conf.d/vnkr.conf"
    fi

    cat > "$apache_conf" <<APACHE
# VNKR — Generated by scripts/installer.sh
<VirtualHost *:80>
    ServerName vnkr.local

    ProxyPreserveHost On
    ProxyRequests Off

    # SSL/Proxy Headers
    RequestHeader set X-Forwarded-Proto "http"

    ProxyPass        /ws  ws://127.0.0.1:5001/ws
    ProxyPassReverse /ws  ws://127.0.0.1:5001/ws

    ProxyPass        /api/ http://127.0.0.1:4000/api/
    ProxyPassReverse /api/ http://127.0.0.1:4000/api/

    ProxyPass        / http://127.0.0.1:${APP_PORT}/
    ProxyPassReverse / http://127.0.0.1:${APP_PORT}/

    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
</VirtualHost>
APACHE

    if command -v apache2 &>/dev/null; then
      a2ensite vnkr.conf >> "$LOG_FILE" 2>&1 || true
      systemctl restart apache2 >> "$LOG_FILE" 2>&1
    else
      systemctl restart httpd >> "$LOG_FILE" 2>&1
    fi
    success "Apache đã cấu hình và khởi động lại."
  fi
}

# =============================================================================
# BƯỚC 10 — configure_security()
# UFW/Firewalld mở 80 443 22, chown 755/644, .env chmod 600
# =============================================================================
configure_security() {
  step "BƯỚC 10/12 — Cấu hình bảo mật"

  # Firewall
  if command -v ufw &>/dev/null; then
    log "Cấu hình UFW firewall..."
    ufw --force reset >> "$LOG_FILE" 2>&1
    ufw default deny incoming  >> "$LOG_FILE" 2>&1
    ufw default allow outgoing >> "$LOG_FILE" 2>&1
    ufw allow 22/tcp  comment "SSH"   >> "$LOG_FILE" 2>&1
    ufw allow 80/tcp  comment "HTTP"  >> "$LOG_FILE" 2>&1
    ufw allow 443/tcp comment "HTTPS" >> "$LOG_FILE" 2>&1
    ufw --force enable >> "$LOG_FILE" 2>&1
    success "UFW enabled: ports 22, 80, 443 mở."

  elif command -v firewall-cmd &>/dev/null; then
    log "Cấu hình Firewalld..."
    systemctl enable --now firewalld >> "$LOG_FILE" 2>&1
    firewall-cmd --permanent --add-service=ssh   >> "$LOG_FILE" 2>&1
    firewall-cmd --permanent --add-service=http  >> "$LOG_FILE" 2>&1
    firewall-cmd --permanent --add-service=https >> "$LOG_FILE" 2>&1
    firewall-cmd --reload >> "$LOG_FILE" 2>&1
    success "Firewalld: ssh, http, https đã mở."
  else
    warn "Không tìm thấy ufw hoặc firewalld — bỏ qua cấu hình firewall."
  fi

  # Phân quyền thư mục/file
  log "Phân quyền thư mục dự án..."
  find "$PROJECT_DIR" -type d -exec chmod 755 {} \; 2>/dev/null || true
  find "$PROJECT_DIR" -type f -exec chmod 644 {} \; 2>/dev/null || true

  # Scripts cần execute permission
  find "$PROJECT_DIR/scripts" -name "*.sh" -exec chmod 755 {} \; 2>/dev/null || true

  # .env phải private
  if [[ -f "$PROJECT_DIR/.env" ]]; then
    chmod 600 "$PROJECT_DIR/.env"
    success ".env chmod 600 ✓"
  fi

  # Đổi owner về APP_USER nếu chạy bằng sudo
  if [[ -n "$APP_USER" && "$APP_USER" != "root" ]]; then
    chown -R "$APP_USER":"$APP_USER" "$PROJECT_DIR" 2>/dev/null || true
    log "Owner: $APP_USER"
  fi

  success "Cấu hình bảo mật hoàn tất."
}

# =============================================================================
# BƯỚC 11 — setup_process_manager()
# pm2 global, tạo ecosystem.config.cjs, pm2 startup
# =============================================================================
setup_process_manager() {
  step "BƯỚC 11/12 — Cài đặt PM2 Process Manager"

  # Cài pm2 global
  if ! command -v pm2 &>/dev/null; then
    log "Cài pm2 global..."
    npm install -g pm2@latest >> "$LOG_FILE" 2>&1
  fi
  command -v pm2 &>/dev/null || die "Cài pm2 thất bại."
  success "pm2 $(pm2 -v) đã cài."

  # Tạo ecosystem.config.cjs
  local eco_file="$PROJECT_DIR/ecosystem.config.cjs"
  if [[ ! -f "$eco_file" ]]; then
    cat > "$eco_file" <<'ECOSYSTEM'
// ecosystem.config.cjs — PM2 process configuration
// Generated by scripts/installer.sh
'use strict';

module.exports = {
  apps: [
    // ── API Gateway ──────────────────────────────────────
    {
      name: 'api-gateway',
      script: './services/api-gateway/dist/index.js',
      cwd: '/var/www',
      instances: 'max',
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 4000 },
      error_file: '/var/log/vnkr/api-gateway-error.log',
      out_file:   '/var/log/vnkr/api-gateway-out.log',
      merge_logs: true,
      max_memory_restart: '512M',
    },

    // ── Fiat Connector ───────────────────────────────────
    {
      name: 'fiat-connector-api',
      script: './services/fiat-connector-api/dist/index.js',
      cwd: '/var/www',
      instances: 2,
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 4001 },
      error_file: '/var/log/vnkr/fiat-connector-error.log',
      out_file:   '/var/log/vnkr/fiat-connector-out.log',
      merge_logs: true,
    },

    // ── SWIFT Gateway ────────────────────────────────────
    {
      name: 'swift-gateway',
      script: './services/swift-gateway/dist/index.js',
      cwd: '/var/www',
      instances: 1,
      env: { NODE_ENV: 'production', PORT: 4002 },
      error_file: '/var/log/vnkr/swift-gateway-error.log',
      out_file:   '/var/log/vnkr/swift-gateway-out.log',
      merge_logs: true,
    },

    // ── WebSocket Server ─────────────────────────────────
    {
      name: 'ws-server',
      script: './services/api-gateway/dist/ws.js',
      cwd: '/var/www',
      instances: 1,
      env: { NODE_ENV: 'production', PORT: 5001 },
      error_file: '/var/log/vnkr/ws-error.log',
      out_file:   '/var/log/vnkr/ws-out.log',
      merge_logs: true,
    },

    // ── Deposit Worker ───────────────────────────────────
    {
      name: 'deposit-worker',
      script: './services/api-gateway/dist/workers/deposit.js',
      cwd: '/var/www',
      instances: 1,
      env: { NODE_ENV: 'production', PORT: 5002 },
      error_file: '/var/log/vnkr/deposit-worker-error.log',
      out_file:   '/var/log/vnkr/deposit-worker-out.log',
      merge_logs: true,
    },
  ],
};
ECOSYSTEM
    success "ecosystem.config.cjs tạo tại $eco_file"
  else
    warn "ecosystem.config.cjs đã tồn tại — không ghi đè."
  fi

  # Tạo log directory
  mkdir -p /var/log/vnkr
  [[ -n "$APP_USER" && "$APP_USER" != "root" ]] && \
    chown -R "$APP_USER":"$APP_USER" /var/log/vnkr 2>/dev/null || true

  # pm2 startup — tạo systemd service cho pm2
  log "Cấu hình pm2 startup (systemd)..."
  local startup_cmd
  startup_cmd=$(pm2 startup systemd -u "${APP_USER:-root}" --hp "${HOME}" 2>/dev/null | grep "sudo env" || true)
  if [[ -n "$startup_cmd" ]]; then
    eval "$startup_cmd" >> "$LOG_FILE" 2>&1 || warn "pm2 startup command thất bại — chạy thủ công: $startup_cmd"
  else
    pm2 startup systemd >> "$LOG_FILE" 2>&1 || warn "pm2 startup thất bại — có thể cần chạy thủ công."
  fi

  success "PM2 đã cấu hình xong."
}

# =============================================================================
# BƯỚC 12 — finalize_installation()
# /usr/local/bin/vnkr-start, systemd vnkr.service,
# launch app, health-check HTTP 200, in bảng tổng kết
# =============================================================================
finalize_installation() {
  step "BƯỚC 12/12 — Hoàn tất cài đặt"

  # Tạo /usr/local/bin/vnkr-start
  cat > /usr/local/bin/vnkr-start <<VNKR_START
#!/usr/bin/env bash
# vnkr-start — khởi động tất cả VNKR services qua PM2
set -euo pipefail
cd /var/www
pm2 start ecosystem.config.cjs --env production
pm2 save
echo "VNKR services đã khởi động. Xem logs: pm2 logs"
VNKR_START
  chmod +x /usr/local/bin/vnkr-start
  success "/usr/local/bin/vnkr-start tạo xong."

  # Tạo systemd vnkr.service
  cat > /etc/systemd/system/vnkr.service <<SYSTEMD
[Unit]
Description=VNKR Tech Holding — Application Services
After=network.target mysql.service redis.service
Wants=mysql.service redis.service

[Service]
Type=forking
User=${APP_USER:-root}
WorkingDirectory=/var/www
ExecStart=/usr/local/bin/vnkr-start
ExecStop=/usr/bin/pm2 stop all
ExecReload=/usr/bin/pm2 reload all
Restart=on-failure
RestartSec=10s
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SYSTEMD

  systemctl daemon-reload >> "$LOG_FILE" 2>&1
  systemctl enable vnkr.service >> "$LOG_FILE" 2>&1
  success "systemd vnkr.service registered & enabled."

  # Launch app qua PM2
  log "Khởi động ứng dụng..."
  cd "$PROJECT_DIR"
  if pm2 start ecosystem.config.cjs --env production >> "$LOG_FILE" 2>&1; then
    pm2 save >> "$LOG_FILE" 2>&1
    success "PM2 processes đã khởi động."
  else
    warn "pm2 start thất bại — các services có thể chưa build xong. Chạy thủ công: vnkr-start"
  fi

  # Health-check HTTP 200 (retry 5×, mỗi lần cách 3s)
  log "Health-check GET http://localhost:${APP_PORT}/health ..."
  local http_status=""
  for ((i=1; i<=5; i++)); do
    sleep 3
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT}/health" 2>/dev/null || echo "000")
    if [[ "$http_status" == "200" ]]; then
      success "Health-check HTTP $http_status ✓"
      break
    fi
    log "Lần $i/5: HTTP $http_status — chờ 3s..."
  done
  if [[ "$http_status" != "200" ]]; then
    warn "Health-check trả HTTP $http_status — ứng dụng có thể chưa ready. Kiểm tra: pm2 logs"
  fi

  # ─── BẢNG TỔNG KẾT ───────────────────────────────────────────────────────
  printf '%b\n' ""
  printf '%b\n' "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════╗${RESET}"
  printf '%b\n' "${BOLD}${GREEN}║          VNKR TECH HOLDING — CÀI ĐẶT HOÀN TẤT               ║${RESET}"
  printf '%b\n' "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════════╝${RESET}"
  printf '%b\n' ""
  printf '%b\n' "  ${CYAN}OS${RESET}              : ${PRETTY_NAME:-$OS_ID $OS_VERSION}"
  printf '%b\n' "  ${CYAN}Node.js${RESET}         : $(node -v 2>/dev/null || echo 'N/A')"
  printf '%b\n' "  ${CYAN}pnpm${RESET}            : $(pnpm -v 2>/dev/null || echo 'N/A')"
  printf '%b\n' "  ${CYAN}PM2${RESET}             : $(pm2 -v 2>/dev/null || echo 'N/A')"
  printf '%b\n' "  ${CYAN}Web Server${RESET}      : $(command -v nginx &>/dev/null && echo nginx || echo apache)"
  printf '%b\n' "  ${CYAN}Redis${RESET}           : $(redis-cli ping 2>/dev/null || echo 'N/A')"
  printf '%b\n' ""
  printf '%b\n' "  ${CYAN}Project Dir${RESET}     : $PROJECT_DIR"
  printf '%b\n' "  ${CYAN}App Port${RESET}        : $APP_PORT"
  printf '%b\n' "  ${CYAN}API Gateway${RESET}     : http://localhost:4000"
  printf '%b\n' "  ${CYAN}Log File${RESET}        : $LOG_FILE"
  printf '%b\n' "  ${CYAN}Env File${RESET}        : $PROJECT_DIR/.env"
  printf '%b\n' ""
  printf '%b\n' "  ${YELLOW}Lệnh hữu ích:${RESET}"
  printf '%b\n' "    vnkr-start          — Khởi động tất cả services"
  printf '%b\n' "    pm2 status          — Xem trạng thái processes"
  printf '%b\n' "    pm2 logs            — Xem logs realtime"
  printf '%b\n' "    pm2 reload all      — Reload zero-downtime"
  printf '%b\n' "    systemctl status vnkr — systemd status"
  printf '%b\n' ""
  printf '%b\n' "  ${GREEN}Health-check${RESET}: HTTP $http_status"
  printf '%b\n' ""
  printf '%b\n' "${BOLD}${GREEN}════════════════════════════════════════════════════════════════${RESET}"
  printf '%b\n' "  Installer log: $LOG_FILE"
  printf '%b\n' "${BOLD}${GREEN}════════════════════════════════════════════════════════════════${RESET}"
  printf '%b\n' ""
}

# =============================================================================
# MAIN — Chạy tuần tự 12 bước
# =============================================================================
main() {
  # Khởi tạo log file
  mkdir -p "$(dirname "$LOG_FILE")"
  touch "$LOG_FILE"
  chmod 644 "$LOG_FILE"

  # Load NPM_TOKEN từ ~/.npmrc của user gốc (trước khi sudo) để tránh
  # pnpm WARN "Failed to replace env in config: ${NPM_TOKEN}"
  # Ưu tiên: biến env hiện tại > ~/.npmrc của SUDO_USER > ~/.npmrc của root
  if [[ -z "${NPM_TOKEN:-}" ]]; then
    local _npmrc_user="${HOME}/.npmrc"
    if [[ -n "${SUDO_USER:-}" ]]; then
      _npmrc_user="$(getent passwd "$SUDO_USER" | cut -d: -f6)/.npmrc"
    fi
    if [[ -f "$_npmrc_user" ]]; then
      local _token
      _token=$(grep -Po '(?<=_authToken=)[^\s]+' "$_npmrc_user" 2>/dev/null | head -1 || true)
      if [[ -n "$_token" && "$_token" != '${NPM_TOKEN}' ]]; then
        export NPM_TOKEN="$_token"
        log "NPM_TOKEN loaded từ $_npmrc_user"
      fi
    fi
  fi

  if [[ -z "${NPM_TOKEN:-}" ]]; then
    warn "NPM_TOKEN chưa được set — pnpm sẽ hiển thị WARN khi đọc .npmrc."
    warn "Để suppress: export NPM_TOKEN=ghp_... rồi chạy: sudo -E bash $0"
  fi

  printf '%b\n' "${BOLD}${CYAN}"
  printf '%b\n' "╔══════════════════════════════════════════════════════════════╗"
  printf '%b\n' "║        VNKR TECH HOLDING — VPS Auto-Installer v1.0          ║"
  printf '%b\n' "║        Monorepo: vnkr-tech-holding-monorepo                  ║"
  printf '%b\n' "╚══════════════════════════════════════════════════════════════╝"
  printf '%b\n' "${RESET}"
  printf '%b\n' "  Bắt đầu: $(date '+%Y-%m-%d %H:%M:%S')"
  printf '%b\n' "  Log    : $LOG_FILE"
  printf '%b\n' ""

  detect_system               # Bước  1
  check_system_requirements   # Bước  2
  install_dependencies        # Bước  3
  install_nodejs              # Bước  4
  install_pnpm                # Bước  5
  install_redis               # Bước  6
  configure_database          # Bước  7
  build_application           # Bước  8
  configure_webserver         # Bước  9
  configure_security          # Bước 10
  setup_process_manager       # Bước 11
  finalize_installation       # Bước 12
}

# ─── PARSE ARGS ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --db-password)
      DB_PASSWORD="$2"
      shift 2
      ;;
    --skip-redis)
      SKIP_REDIS=true
      shift
      ;;
    --help|-h)
      printf '%b\n' "Usage: sudo bash $0 [options]"
      printf '%b\n' "  --db-password PASSWORD   Đặt MySQL root password trực tiếp"
      printf '%b\n' "  --skip-redis             Bỏ qua cài Redis"
      exit 0
      ;;
    *)
      die "Unknown option: $1. Dùng --help để xem hướng dẫn."
      ;;
  esac
done

main "$@"
