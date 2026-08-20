Dựa trên cấu trúc cây thư mục `/var/www/open-source-references/apps/` của hệ thống Next.js Monorepo/Micro-services mà bạn vừa cung cấp, các dự án tương tự hoặc nền tảng mã nguồn mở (Open-source) tương ứng cho từng dịch vụ cụ thể bao gồm:

| Dịch vụ trong hệ thống | Chức năng tương ứng | Mã nguồn mở (Open-source) tham khảo hàng đầu |
| --- | --- | --- |
| `app-web` | App ví / Web App chính | • [Metamask Mobile/Web](https://github.com/MetaMask/metamask-extension)<br>

<br>• [Rainbow Wallet](https://github.com/rainbow-me/rainbow) |
| `dao-portal` | Cổng quản trị DAO & Biểu quyết | • [Snapshot](https://www.google.com/search?q=https://github.com/snapshot-labs/snapshot)<br>

<br>• [Aragon Client](https://www.google.com/search?q=https://github.com/aragon/aragon) |
| `digital-twin-engine` | Engine mô phỏng / Mô hình hóa dữ liệu | • [Threeml / Three.js Ecosystem](https://github.com/mrdoob/three.js/)<br>

<br>• [IOWorlds](https://www.google.com/search?q=https://github.com/iankit/digital-twin) |
| `explorer-vnkrscan` | Trình khám phá khối (Block Explorer) | • [Blockscout](https://github.com/blockscout/blockscout) *(Chuẩn nhất cho EVM)*<br>

<br>• [Otterscan](https://www.google.com/search?q=https://github.com/wmitsuda/otterscan) |
| `holding-admin-portal` | Trang quản trị hệ thống / Admin | • [Refine](https://github.com/refinedev/refine) *(React/Next.js Admin)*<br>

<br>• [Ant Design Pro](https://github.com/ant-design/ant-design-pro) |
| `id-fiat-gateway` | Cổng nạp/rút Tiền pháp định (Fiat On/Off Ramp) | • [Superfluid Gateways](https://github.com/superfluid-finance)<br>

<br>• [BtcPayServer](https://github.com/btcpayserver/btcpayserver) |
| `kyc-portal` | Xác minh danh tính người dùng | • [Selfkey KYC](https://www.google.com/search?q=https://github.com/SelfKey/selfkey-wallet)<br>

<br>• [KILT Protocol Frontend](https://github.com/KILTprotocol) |
| `merchant-portal` | Cổng quản lý cho Thương gia / Cửa hàng | • [WooCommerce Crypto Payment Gateway](https://github.com/woocommerce/woocommerce) |
| `pay-portal` | Cổng thanh toán Crypto / POS | • [Solana Pay](https://www.google.com/search?q=https://github.com/solana-labs/solana-pay)<br>

<br>• [Crypto.com Pay Merchant Portal](https://github.com/crypto-com) |
| `sandbox-dashboard` | Môi trường thử nghiệm API / Developer Console | • [Swagger UI React](https://github.com/swagger-api/swagger-ui)<br>

<br>• [Postman Developer Portal Templates](https://github.com/postmanlabs) |
| `swap-dex` | Sàn giao dịch phi tập trung (DEX) | • [Uniswap Interface v3/v4](https://github.com/Uniswap/interface)<br>

<br>• [Pancake Frontend](https://www.google.com/search?q=https://github.com/pancakeswap/pancake-frontend) |

---

### Cách kiểm tra hoặc clone mã nguồn mở về máy chủ

Nếu bạn muốn quét hoặc clone các repo tham khảo này trực tiếp vào thư mục server của bạn bằng Git:

```bash
# Thư mục chứa các ứng dụng mã nguồn mở tham khảo
mkdir -p /var/www/open-source-references
cd /var/www/open-source-references

# 1. Block Explorer (Tương tự explorer-vnkrscan)
git clone https://github.com/blockscout/blockscout.git

# 2. DEX Interface (Tương tự swap-dex)
git clone https://github.com/Uniswap/interface.git swap-dex-ui

# 3. Governance/DAO Portal (Tương tự dao-portal)
git clone https://github.com/snapshot-labs/snapshot.git

# 4. Web Wallet (Tương tự app-web)
git clone https://github.com/rainbow-me/rainbow.git

```

Bạn đang cần tìm cụ thể mã nguồn mở cho **dịch vụ nào nhất trong số 11 app ở trên** (ví dụ: muốn dựng lại `swap-dex` hay `explorer-vnkrscan`) để mình hỗ trợ trích xuất cấu hình `package.json` và thiết lập Dockerfile tương ứng?