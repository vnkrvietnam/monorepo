# 🚀 VNKR TECH HOLDING — Cheat Sheet Vận Hành Hệ Thống

> Enterprise Monorepo `@vnkr/*` — Quick Reference for Engineering & DevOps

---

## 1. Phát triển & Kiểm thử Local (Developer Workflow)

```bash
# Chuyển vào thư mục monorepo
cd /var/www

# Cài đặt toàn bộ dependencies (frozen lockfile)
pnpm install --frozen-lockfile

# Chạy môi trường Dev cho tất cả apps & services
pnpm dev

# Build và kiểm thử mã nguồn bằng Turborepo
pnpm build
pnpm test
pnpm lint

# Biên dịch Solana Smart Contracts (Anchor)
anchor build
anchor test
```

---

## 2. Quản lý & Publish NPM Packages (`@vnkr/*`)

```bash
# Kiểm tra phiên bản package local so với Registry
pnpm --filter @vnkr/deploy-npm registry:check

# Chạy thử nghiệm quá trình publish (Dry-run)
pnpm --filter @vnkr/deploy-npm publish:dry

# Tăng phiên bản Patch (1.0.0 → 1.0.1) cho toàn bộ packages
pnpm --filter @vnkr/deploy-npm version:patch

# Publish chính thức toàn bộ @vnkr/* packages lên NPM Registry
pnpm --filter @vnkr/deploy-npm publish:all
```

---

## 3. Vận hành Container Local (Docker Compose Stack)

```bash
cd /var/www/deploy/docker

# Khởi chạy toàn bộ 4 Microservices bằng Docker Compose
docker compose up -d --build

# Kiểm tra log thời gian thực của Dune Alert Bots
docker compose logs -f dune-alert-bots

# Kiểm tra trạng thái Healthcheck các container
docker compose ps

# Dừng toàn bộ stack
docker compose down
```

---

## 4. Triển khai Hạ tầng AWS & Cloudflare WAF (Terraform)

```bash
cd /var/www/deploy/terraform

# Copy và điền giá trị thực vào tfvars
cp terraform.tfvars.example terraform.tfvars

# Khởi tạo Terraform & Backend S3
terraform init

# Kiểm tra kế hoạch thay đổi tài nguyên Cloud
terraform plan -var-file="terraform.tfvars"

# Triển khai ECR, ECS Cluster & 10 Subdomain CNAME + WAF Rules
terraform apply -var-file="terraform.tfvars" -auto-approve
```

---

## 5. Triển khai K8s Cluster (Helm Chart)

```bash
cd /var/www/deploy/kubernetes

# Cài đặt / Cập nhật Helm release cho hệ sinh thái VNKR
helm upgrade --install vnkr-ecosystem . \
  --namespace vnkr-production \
  --create-namespace \
  -f values.yaml
```

---

## 📊 Ma trận 10 Subdomains & Services

| Domain | App / Service | Port | Chức năng |
|---|---|---|---|
| `holding.vnkr.vn` | `holding-admin-portal` | :3006 | Portal Quản trị IP Asset & Approval |
| `id.vnkr.vn` | `id-fiat-gateway` | :3001 | KYC, P2P Escrow & Gateway On/Off Ramp |
| `pay.vnkr.vn` | `pay-portal` | :3002 | Payment Portal & Merchant POS Dashboard |
| `scan.vnkr.vn` | `explorer-vnkrscan` | :3003 | App-Chain Genesis Block Explorer |
| `swap.vnkr.vn` | `swap-dex` | :3004 | AMM DEX & Router Thanh khoản |
| `dao.vnkr.vn` | `dao-portal` | :3005 | Governance & Range Bound Stability Vault |
| `lab.vnkr.vn` | `digital-twin-engine` | worker | R&D Engine & Digital Twin Simulation |
| `dev-api.vnkr.vn` | `fiat-connector-api` | :4001 | Webhook nạp/rút Ngân hàng (WAF Protected) |
| `otc.vnkr.vn` | `otc-liquidity-engine` | :4002 | Institutional OTC Engine (VARA Compliant) |
| `treasury-subgraph-api.vnkr.vn` | `indexer-subgraph` | :4003 | App-Chain Event Watcher & Indexer |

---

## 🔗 Liên kết nội bộ

| Tài liệu | Đường dẫn |
|---|---|
| Architecture Blueprint | `README.md` |
| NPM Publish Guide | `deploy/npm/README.md` |
| Docker Compose Stack | `deploy/docker/docker-compose.yml` |
| Helm Values | `deploy/kubernetes/values.yaml` |
| Terraform IaC | `deploy/terraform/main.tf` |
| Shared Types | `packages/types/src/index.ts` |
| Shared Config | `packages/config/src/index.ts` |
| Core SDK | `packages/core-sdk/src/index.ts` |
