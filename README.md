Mô hình cơ cấu **VNKR TECH HOLDING JSC** theo mô hình Công ty Mẹ – Công ty Con phân tách rõ ràng giữa **Pháp nhân – Pháp lý – Sản phẩm – Tên miền (Domain) – Module Kỹ thuật**.

Dưới đây là sơ đồ chi tiết chuẩn hóa kiến trúc thư mục nguồn **Enterprise Monorepo (`pnpm` + `Turborepo` + `Anchor/Solana/EVM`)** tương ứng chuẩn xác 1:1 với sơ đồ tổ chức của tập đoàn.

---

## 🗺️ Ma trận Mapping: Pháp nhân $\rightarrow$ Tên miền $\rightarrow$ Module Kỹ thuật

| Pháp nhân thành viên | Thị trường / Căn cứ | Tên miền vận hành (Domain) | Module Kỹ thuật & Service đảm nhiệm |
| --- | --- | --- | --- |
| **VNKR TECH HOLDING JSC** | Việt Nam (Công ty Mẹ) | `holding.vnkr.vn` / `/core*` | Ban Quản trị, Thẩm định IP Asset, Mint/Burn AXVN Core, Core SDK |
| **VNKR FinTech Services JSC** | Việt Nam (Nội địa) | `id.vnkr.vn`<br>`pay.vnkr.vn`<br>`dev-api.vnkr.vn` | - P2P Escrow & Fiat Gateway (Fiat/Token Matching)<br>- POS SDK & Cổng thanh toán Thương mại Điện tử |
| **VNKR Blockchain Network Ltd.** | Việt Nam (Hạ tầng) | `scan.vnkr.vn`<br>`treasury-subgraph-api.vnkr.vn` | - App-Chain Genesis (Chain ID: 1) & RPC Nodes<br>- Block Explorer (Proof of Reserve) & Indexing Layer |
| **VNKR Infra & Network Ltd.** | Việt Nam (Hạ tầng) | `mail.vnkr.vn` | - Stalwart Mail Server (SMTP/IMAP/JMAP)<br>- Email Transactional: OTP, xác nhận Fiat, cảnh báo hệ thống |
| **VNKR Digital Twin & AI Labs** | Việt Nam (R&D / IP) | `lab.vnkr.vn` (Internal) | - Digital Twin Simulation Engine<br>- Dune Data Analytics, Discord/Telegram Alert Bots |
| **VNKR Global Ventures Pte. Ltd.** | Singapore (Regional Hub) | `swap.vnkr.vn` | - AMM DEX & Cross-chain Liquidity Router<br>- Giấy phép MAS Payment Gateway Integration |
| **VNKR Capital & Foundation Ltd.** | Cayman / BVI (Offshore) | `dao.vnkr.vn` | - Treasury Management, Protocol RBS (Range Bound Stability)<br>- Quản trị DAO & Điều phối Tokenomic |
| **VNKR Labs MENA / FZE** | Dubai, UAE (Middle East) | `otc.vnkr.vn` | - Institutional OTC Liquidity Engine<br>- VARA Compliance Gateway |

---

## 🏗️ Sơ đồ Cấu trúc Thư mục Monorepo (Enterprise Monorepo Architecture)

```text
VNKR-tech-holding-monorepo/
├── apps/                                  # TẦNG ỨNG DỤNG & PORTAL CLIENT (Web3 / Next.js)
│   ├── id-fiat-gateway/                   # [id.vnkr.vn] P2P Escrow, Identity & Fiat On/Off Ramp (VNKR FinTech)
│   ├── pay-portal/                        # [pay.vnkr.vn] Payment Gateway & Merchant Dashboard (VNKR FinTech)
│   ├── explorer-vnkrscan/                 # [scan.vnkr.vn] App-Chain Block Explorer & Proof of Reserve (VNKR Infra)
│   ├── swap-dex/                          # [swap.vnkr.vn] AMM DEX & Router Thanh khoản Quốc tế (VNKR Global SG)
│   ├── dao-portal/                        # [dao.vnkr.vn] Treasury Management & Governance Portal (VNKR Capital)
│   ├── holding-admin-portal/              # Internal Portal: Quản trị IP Asset & Cấp phép Whitelist (VNKR Holding)
│   └── digital-twin-engine/              # R&D Engine: Mô phỏng Digital Twin & AI Lab (VNKR R&D)
│
├── packages/                              # TẦNG THƯ VIỆN & SDK DÙNG CHUNG (Shared Packages)
│   ├── core-sdk/                          # Solana/EVM Web3 Wrapper & Anchor IDL Integrator
│   ├── merchant-sdk/                      # JS/TS SDK cho đối tác tích hợp cổng thanh toán (`dev-api.vnkr.vn`)
│   ├── swift-adapter/                     # SWIFT Institutional Banking SDK (MT103/MT202/MT940, ISO 20022 pacs.008/009/camt.053)
│   │   └── src/
│   │       ├── mt/                        # MT message parsers (mt103.ts, mt202.ts, mt940.ts)
│   │       ├── iso20022/                  # ISO 20022 message builders (pacs008.ts, pacs009.ts, camt053.ts)
│   │       ├── security/                  # LAU HMAC signing & verification
│   │       ├── client.ts                  # SWIFT API OAuth2 + MGW HTTP client
│   │       └── types.ts                   # Shared SWIFT types & interfaces
│   ├── ui-kit/                            # Design System chung (Wallet Adapter, Modals, Transaction Badges)
│   ├── types/                             # Data Types chung (Order State, KYC Status, Fiat Receipts, Subgraph Types)
│   └── config/                            # Environment Constants, Program IDs, Seed PDAs, RPC Endpoints, MAIL_CONFIG
│
├── programs/                              # TẦNG SMART CONTRACT (Solana Anchor / Rust & App-Chain EVM)
│   ├── VNKR-p2p-escrow/                   # Smart Contract P2P Escrow (make_offer, take_offer, cancel_offer)
│   ├── VNKR-mint-governance/              # Quản lý Mint/Burn AXVN theo IP Escrow Deed & Whitelist Token
│   ├── VNKR-amm-swap/                     # Logic Pool Thanh khoản Quốc tế & Fee Sharing Router
│   ├── VNKR-treasury-rbs/                 # Kho bạc DAO & Giao thức Bình ổn Giá (Range Bound Stability)
│   └── VNKR-swift-bridge/                 # Smart Contract cầu nối SWIFT ↔ On-chain
│       ├── evm/                           # Solidity contracts (VNKRSwiftBridge.sol, VNKRSwiftBridgeV2.sol)
│       └── solana/                        # Anchor/Rust program (Solana side of bridge)
│
├── services/                              # TẦNG MICROSERVICES & INDEXER (Backend / Node.js / Rust)
│   ├── indexer-subgraph/                  # [treasury-subgraph-api.vnkr.vn] Subgraph / Helius Indexer Service
│   ├── fiat-connector-api/                # [dev-api.vnkr.vn] Service Khớp lệnh Fiat Ngân hàng & Webhook
│   │   └── src/
│   │       ├── index.ts                   # Express API entry point
│   │       └── mailer.ts                  # SMTP client → Stalwart (OTP, xác nhận Fiat, cảnh báo)
│   ├── swift-gateway/                     # SWIFT Microgateway Proxy — xác thực LAU & định tuyến lệnh SWIFT
│   │   └── src/
│   │       ├── index.ts                   # Express API entry point (REST → SWIFT Network)
│   │       ├── mgw-client.ts              # HTTP client kết nối SWIFT Microgateway JVM sidecar (:9003)
│   │       └── bridge.ts                  # Webhook relay → swift-chain-bridge (ký & emit sự kiện)
│   ├── swift-chain-bridge/                # Blockchain Relayer: SWIFT event ↔ On-chain Oracle
│   │   └── src/
│   │       ├── index.ts                   # Service entry point
│   │       ├── relayer.ts                 # Core relayer logic (sign & submit transactions)
│   │       ├── fx-oracle.ts               # FX Oracle (SBV + Vietcombank rate feed, 1 VNKR = 1 VND)
│   │       ├── listeners/
│   │       │   ├── swift-webhook.ts       # Lắng nghe webhook từ swift-gateway
│   │       │   └── onchain.ts             # Lắng nghe sự kiện On-chain (EVM log filter)
│   │       └── executors/
│   │           ├── swift-executor.ts      # Thực thi lệnh SWIFT outbound (MT103/pacs.008)
│   │           └── chain-executor.ts      # Mint/release VNKR token theo xác nhận SWIFT
│   ├── mock-mgw/                          # Mock SWIFT Microgateway (local dev / integration tests)
│   ├── otc-liquidity-engine/              # Service Thanh khoản OTC dành cho định chế (VNKR Labs MENA)
│   └── dune-alert-bots/                   # Telegram/Discord Bots & Bot phân tích dữ liệu DApp
│
├── scripts/                               # SCRIPTS TIỆN ÍCH
│   ├── extract-swift-sdk.sh               # Giải nén & cài đặt SWIFT SDK vendor packages
│   ├── setup-mgw-keystore.sh              # Khởi tạo keystore JVM cho SWIFT Microgateway
│   └── test-swift-gateway.sh              # Kiểm thử luồng SWIFT gateway end-to-end
│
├── deploy/                                # TẦNG HẠ TẦNG & DEPLOYMENT
│   ├── docker/                            # Dockerfiles + docker-compose.yml (bao gồm mail-server & mock-mgw)
│   ├── kubernetes/                        # K8s Helm Charts cho RPC Nodes & Infrastructure
│   ├── npm/                               # NPM publish scripts cho @vnkr/* packages
│   └── terraform/                         # IaC: AWS ECS/ECR + Cloudflare DNS (11 subdomain + WAF)
│
├── Anchor.toml                            # Cấu hình Deploy Smart Contract Solana (Devnet/Mainnet)
├── Cargo.toml                             # Cargo Workspace cấu hình Rust Crate
├── pnpm-workspace.yaml                    # Định nghĩa Workspace Monorepo
├── turbo.json                             # Turborepo pipeline configuration
└── package.json                           # Root Monorepo configuration
```

---

## ⚡ Bảng Phân bổ Luồng dữ liệu Vận hành (Operational Dataflow Matrix)

### 1. Luồng Giao dịch P2P & Nạp/Rút Fiat (`VNKR FinTech`)

* **Duyệt Danh tính:** Người dùng xác thực KYC qua `id.vnkr.vn` → Hệ thống lưu vết Off-chain.
* **Tạo lệnh On-chain:** Người bán khóa token AXVN vào Smart Contract `programs/VNKR-p2p-escrow` qua Vault PDA.
* **Xác minh Fiat:** `services/fiat-connector-api` xử lý biến động tài khoản VND off-chain qua `dev-api.vnkr.vn`.
* **Giải phóng Token:** Sau khi xác nhận VND, Smart Contract giải phóng AXVN cho Người mua, trích % phí về Treasury.
* **Thông báo Email:** `services/fiat-connector-api/src/mailer.ts` gửi OTP & xác nhận giao dịch qua `mail.vnkr.vn` (Stalwart SMTP).

### 2. Luồng Minh bạch Hạ tầng & Dự trữ (`VNKR Infra`)

* **Lắng nghe Sự kiện:** Microservice `services/indexer-subgraph` đọc dữ liệu log trực tiếp từ RPC Node của App-Chain Genesis (Chain ID: 1).
* **Hiển thị On-chain:** `apps/explorer-vnkrscan` (`scan.vnkr.vn`) xuất bản trạng thái Proof of Reserve và truy xuất biến động ví Treasury theo thời gian thực.

### 3. Luồng Điều phối Thanh khoản Quốc tế (`VNKR Global SG` & `VNKR Capital`)

* **DEX & Swap:** Người dùng quốc tế hoán đổi token qua `apps/swap-dex` (`swap.vnkr.vn`), kết nối với Liquidity Pool được quản trị bởi `programs/VNKR-amm-swap`.
* **Quản trị Kho bạc (RBS):** Quỹ Cayman (`dao.vnkr.vn`) điều phối các tham số Mint/Burn và tỷ lệ dự trữ thông qua Smart Contract `programs/VNKR-treasury-rbs`.

### 4. Luồng Thanh toán SWIFT Liên ngân hàng (`VNKR FinTech` ↔ SWIFT Network)

* **Gửi lệnh SWIFT Outbound:** `services/swift-gateway` xác thực LAU HMAC, định tuyến lệnh MT103/pacs.008 qua SWIFT Microgateway JVM sidecar (`SWIFT_MGW_URL=:9003`).
* **Nhận sự kiện SWIFT Inbound:** Webhook từ MGW đến `services/swift-gateway/src/bridge.ts` → chuyển tiếp đến `services/swift-chain-bridge/src/listeners/swift-webhook.ts`.
* **FX Oracle:** `services/swift-chain-bridge/src/fx-oracle.ts` tra cứu tỷ giá liên ngân hàng từ SBV API & Vietcombank XML feed (1 VNKR = 1 VND).
* **Relayer On-chain:** `services/swift-chain-bridge/src/relayer.ts` ký & gửi transaction lên `programs/VNKR-swift-bridge` (EVM: `VNKRSwiftBridgeV2.sol` / Solana: Anchor program).
* **Mint/Release:** `services/swift-chain-bridge/src/executors/chain-executor.ts` Mint hoặc giải phóng VNKR token tương ứng với lệnh SWIFT đã xác nhận.
* **SDK Dùng chung:** `packages/swift-adapter` cung cấp MT/ISO 20022 message parsers, LAU signing và OAuth2 client cho tất cả services.
* **Dev/Test:** `services/mock-mgw` mô phỏng SWIFT Microgateway cho môi trường local và integration tests.

### 5. Luồng Email Transactional (`VNKR Infra — Stalwart Mail Server`)

* **Hạ tầng:** Stalwart Mail Server (`stalwartlabs/mail-server`) chạy tại `mail.vnkr.vn` — hỗ trợ **SMTP** (25/465/587), **IMAPS** (993), **JMAP/Admin** (8080).
* **Tích hợp SMTP:** `services/fiat-connector-api/src/mailer.ts` sử dụng `nodemailer` + `MAIL_CONFIG` từ `packages/config` để gửi:
  * OTP đăng ký / xác thực `id.vnkr.vn`
  * Xác nhận thanh toán Fiat `pay.vnkr.vn`
  * Cảnh báo hệ thống tự động
* **Cấu hình DNS** (cần thiết lập trên Cloudflare):

| Type | Name | Giá trị | Chức năng |
| --- | --- | --- | --- |
| **A** | `mail` | `<IPv4_SERVER_PUBLIC>` | Trỏ `mail.vnkr.vn` về IP Server |
| **MX** | `@` | `mail.vnkr.vn` (Priority 10) | Nhận thư vào Stalwart |
| **TXT** | `@` | `v=spf1 mx a ip4:<IPv4> ~all` | SPF — xác thực quyền gửi |
| **TXT** | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:postmaster@vnkr.vn` | DMARC — bảo vệ thương hiệu |
| **TXT** | `stalwart._domainkey` | *(lấy từ Stalwart Admin Console)* | DKIM Signature |

---

## 🌐 Bảng Subdomain & Services (11 Domains)

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
| `mail.vnkr.vn` | `mail-server` (Stalwart) | 25/465/587/993/:8080 | Transactional Mail: OTP, Fiat, Alerts |
| *(internal)* | `swift-gateway` | :4004 | SWIFT Microgateway Proxy — LAU auth & routing |
| *(internal)* | `swift-chain-bridge` | worker | Blockchain Relayer: SWIFT ↔ On-chain Oracle |
| *(internal)* | `mock-mgw` | :9003 | Mock SWIFT MGW (dev/test only) |

---

## 🔑 Biến Môi trường (`.env.example`)

| Nhóm | Biến chính | Mô tả |
|---|---|---|
| **Solana** | `SOLANA_RPC_DEVNET`, `SOLANA_RPC_MAINNET`, `ANCHOR_WALLET` | RPC & Wallet cho Anchor/Solana |
| **App-Chain EVM** | `APPCHAIN_RPC`, `APPCHAIN_CHAIN_ID`, `VNKR_EVM_RPC` | RPC Node Genesis Chain |
| **TRON** | `TRON_FULL_HOST`, `TRON_PRIVATE_KEY` | Tích hợp TRON/TRC20 |
| **Fiat API** | `DEFAULT_API_ENDPOINT`, `BANK_WEBHOOK_SECRET`, `FIAT_CONNECTOR_URL` | Endpoint & HMAC Webhook |
| **Dune Bots** | `DUNE_API_KEY`, `TELEGRAM_BOT_TOKEN`, `DISCORD_BOT_TOKEN` | Alert Bots |
| **AWS / CF** | `AWS_REGION`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN` | Terraform IaC |
| **Stalwart Mail** | `STALWART_HOSTNAME`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Mail Server config |
| **Redis** | `REDIS_URL` | Event bus nội bộ giữa services |
| **SWIFT Bridge** | `BRIDGE_CONTRACT_ADDRESS`, `RELAYER_PRIVATE_KEY`, `SWIFT_API_KEY`, `VNKR_INTERNAL_WEBHOOK_SECRET` | Smart Contract & Relayer |
| **SWIFT FX Oracle** | `SBV_API_KEY`, `SBV_FX_API_URL`, `VIETCOMBANK_FX_API`, `BRIDGE_FEE_BPS`, `DEFAULT_BASE_GAS_FEE_VNKR` | Tỷ giá & Phí bridge |
| **SWIFT Institutional** | `SWIFT_LAU_KEY`, `SWIFT_BIC_CODE`, `SWIFT_CONSUMER_KEY`, `SWIFT_CONSUMER_SECRET`, `SWIFT_MGW_URL`, `SWIFT_MGW_APIKEY`, `SWIFT_GPI_UETR_PREFIX` | SWIFT Network auth & MGW |
| **NPM** | `NODE_AUTH_TOKEN` | Publish `@vnkr/*` packages |

---

## 🔗 Tài liệu nội bộ

| Tài liệu | Đường dẫn |
|---|---|
| Operations Cheat Sheet | `OPERATIONS.md` |
| NPM Publish Guide | `deploy/npm/README.md` |
| Docker Compose Stack | `deploy/docker/docker-compose.yml` |
| Helm Values | `deploy/kubernetes/values.yaml` |
| Terraform IaC | `deploy/terraform/main.tf` |
| Shared Config (MAIL_CONFIG…) | `packages/config/src/index.ts` |
| Shared Types | `packages/types/src/index.ts` |
| Core SDK | `packages/core-sdk/src/index.ts` |
| Mailer (SMTP client) | `services/fiat-connector-api/src/mailer.ts` |
| SWIFT Adapter SDK | `packages/swift-adapter/src/index.ts` |
| SWIFT Gateway Service | `services/swift-gateway/src/index.ts` |
| SWIFT Chain Bridge | `services/swift-chain-bridge/src/index.ts` |
| FX Oracle | `services/swift-chain-bridge/src/fx-oracle.ts` |
| SWIFT Bridge Contract (EVM) | `programs/VNKR-swift-bridge/evm/VNKRSwiftBridgeV2.sol` |
| SWIFT Bridge Program (Solana) | `programs/VNKR-swift-bridge/solana/src/` |
| MGW Keystore Setup | `scripts/setup-mgw-keystore.sh` |
| SWIFT SDK Extract Script | `scripts/extract-swift-sdk.sh` |
