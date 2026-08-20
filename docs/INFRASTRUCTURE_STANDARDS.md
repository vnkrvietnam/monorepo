# Chuẩn Hóa Hạ Tầng Mã Nguồn & Quản Lý Gói npm (`@vnkrvietnam`)

> **Phạm vi:** VNKR TECH HOLDING JSC — Enterprise Monorepo  
> **Phiên bản tài liệu:** 1.0.0  
> **Cập nhật lần cuối:** 2025  
> **Áp dụng cho:** Tất cả engineer, DevOps, package maintainer trong hệ sinh thái `@vnkrvietnam`

---

## Mục lục

1. [Sơ đồ Kiến trúc Hạ tầng Git & npm](#1-sơ-đồ-kiến-trúc-hạ-tầng-git--npm)
2. [Cấu trúc Thư mục Monorepo Tiêu chuẩn Global](#2-cấu-trúc-thư-mục-monorepo-tiêu-chuẩn-global)
3. [Quy chuẩn Đặt tên Gói npm](#3-quy-chuẩn-đặt-tên-gói-npm)
4. [Chi tiết Cấu hình `package.json` Chuẩn Doanh nghiệp](#4-chi-tiết-cấu-hình-packagejson-chuẩn-doanh-nghiệp)
5. [Cấu hình File Đăng ký npm (`.npmrc`)](#5-cấu-hình-file-đăng-ký-npm-npmrc)
6. [Nguyên tắc An toàn & Quy chuẩn Đặt tên](#6-nguyên-tắc-an-toàn--quy-chuẩn-đặt-tên)
7. [Vòng đời Phát hành & Changeset](#7-vòng-đời-phát-hành--changeset)
8. [CI/CD Pipelines](#8-cicd-pipelines)

---

## 1. Sơ đồ Kiến trúc Hạ tầng Git & npm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VNKR TECH HOLDING — Git & npm Infrastructure         │
└─────────────────────────────────────────────────────────────────────────────┘

  GitHub Repository (github.com/vnkrvietnam/vnkr-tech-holding)
  │
  ├── branch: main ──────────────────────────────────────────────────────────
  │     │                                                                    │
  │     ▼ push                                                               │
  │   GitHub Actions CI/CD                                                   │
  │     │                                                                    │
  │     ├── changeset-release.yml ──► "Version Packages" PR (auto-opens)    │
  │     │       │  (on PR merge)                                             │
  │     │       └──► Publish to GitHub Packages Registry                    │
  │     │                  npm.pkg.github.com/@vnkrvietnam/*                 │
  │     │                                                                    │
  │     └── npm-publish.yml ────────────────────────────────────────────────┤
  │             │  (on git tag v*)                                           │
  │             └──► Publish to npmjs.com Registry                          │
  │                       registry.npmjs.org/@vnkrvietnam/*                 │
  │                                                                          │
  ├── branch: develop ─── feature/* ─── fix/* ─── release/*                │
  │                                                                          │
  └── Turborepo Task Graph (pnpm + turbo run build)                         │
        │                                                                    │
        │  Dependency build order (topological):                             │
        │                                                                    │
        │  @vnkrvietnam/types                                                │
        │       │                                                            │
        │       ├──► @vnkrvietnam/config                                    │
        │       │         │                                                  │
        │       │         ├──► @vnkrvietnam/core-sdk                        │
        │       │         ├──► @vnkrvietnam/swift-adapter                   │
        │       │         ├──► @vnkrvietnam/merchant-sdk                    │
        │       │         └──► @vnkrvietnam/contracts                       │
        │       │                                                            │
        │       └──► @vnkrvietnam/db                                        │
        │                 │                                                  │
        │                 ├──► services/api-gateway                         │
        │                 ├──► services/fiat-connector-api                  │
        │                 └──► services/otc-liquidity-engine                │
        │                                                                    │
        └──► @vnkrvietnam/ui-kit ──► apps/* (React/Next.js)                │

  Registry Routing:
    @vnkrvietnam/* ──► https://npm.pkg.github.com   (internal/restricted)
    everything else ──► https://registry.npmjs.org  (public default)
```

---

## 2. Cấu trúc Thư mục Monorepo Tiêu chuẩn Global

```
vnkr-tech-holding/                     ← git root / pnpm workspace root
│
├── package.json                        ← Root workspace manager (KHÔNG publish)
├── pnpm-workspace.yaml                 ← Khai báo workspace globs
├── pnpm-lock.yaml                      ← Lockfile (commit vào git, KHÔNG sửa tay)
├── turbo.json                          ← Turborepo task graph & cache config
├── .npmrc                              ← Đăng ký npm + auth token
├── .env.example                        ← Template biến môi trường (commit được)
├── .env                                ← Giá trị thật (KHÔNG commit — gitignore)
├── .changeset/                         ← Changeset config & pending changelogs
│   └── config.json
│
├── packages/                           ← Thư viện dùng chung (publishable)
│   ├── types/                          ← @vnkrvietnam/types          (layer 0)
│   ├── config/                         ← @vnkrvietnam/config         (layer 1)
│   ├── db/                             ← @vnkrvietnam/db             (layer 1)
│   ├── core-sdk/                       ← @vnkrvietnam/core-sdk       (layer 2)
│   ├── swift-adapter/                  ← @vnkrvietnam/swift-adapter  (layer 2)
│   ├── merchant-sdk/                   ← @vnkrvietnam/merchant-sdk   (layer 2)
│   ├── contracts/                      ← @vnkrvietnam/contracts      (layer 2)
│   ├── swift/                          ← @vnkrvietnam/swift-sdk-internal (private)
│   └── ui-kit/                         ← @vnkrvietnam/ui-kit         (layer 3)
│
├── services/                           ← Backend microservices (KHÔNG publish)
│   ├── api-gateway/                    ← @vnkrvietnam/api-gateway    (PORT 5000/5001)
│   ├── fiat-connector-api/             ← @vnkrvietnam/fiat-connector-api (PORT 4001)
│   ├── otc-liquidity-engine/           ← @vnkrvietnam/otc-liquidity-engine (PORT 4002)
│   ├── indexer-subgraph/               ← @vnkrvietnam/indexer-subgraph (PORT 4003)
│   ├── swift-gateway/                  ← @vnkrvietnam/swift-gateway  (PORT 4004)
│   ├── swift-chain-bridge/             ← @vnkrvietnam/swift-chain-bridge (PORT 4005)
│   ├── mock-mgw/                       ← @vnkrvietnam/mock-mgw-daemon (PORT 9003)
│   └── dune-alert-bots/               ← @vnkrvietnam/dune-alert-bots
│
├── apps/                               ← Frontend applications (KHÔNG publish)
│   ├── app-web/                        ← @vnkrvietnam/app-web        (PORT 3010)
│   ├── pay-portal/                     ← @vnkrvietnam/pay-portal     (PORT 3002)
│   ├── swap-dex/                       ← @vnkrvietnam/swap-dex       (PORT 3004)
│   ├── dao-portal/                     ← @vnkrvietnam/dao-portal     (PORT 3005)
│   ├── explorer-vnkrscan/              ← @vnkrvietnam/explorer-vnkrscan (PORT 3003)
│   ├── holding-admin-portal/           ← @vnkrvietnam/holding-admin-portal (PORT 3006)
│   ├── merchant-portal/                ← @vnkrvietnam/merchant-portal (PORT 3011)
│   ├── sandbox-dashboard/              ← @vnkrvietnam/sandbox-dashboard (PORT 3012)
│   ├── kyc-portal/                     ← @vnkrvietnam/kyc-portal     (PORT 3013)
│   ├── id-fiat-gateway/                ← @vnkrvietnam/id-fiat-gateway (PORT 3001)
│   └── digital-twin-engine/           ← @vnkrvietnam/digital-twin-engine
│
├── programs/                           ← Solana/Anchor on-chain programs (Rust)
├── deploy/                             ← Infrastructure as Code
│   ├── docker/                         ← Docker Compose files
│   ├── kubernetes/                     ← K8s manifests
│   ├── terraform/                      ← Cloud provisioning
│   ├── nginx/                          ← Reverse proxy config
│   ├── db/                             ← PostgreSQL migration scripts
│   └── npm/                            ← Publish scripts (bump-version, publish-all)
├── scripts/                            ← Dev/ops helper scripts
├── .github/
│   └── workflows/
│       ├── changeset-release.yml       ← Main publish pipeline (GitHub Packages)
│       ├── npm-publish.yml             ← Tag-triggered publish to npmjs.com
│       ├── build-push-containers.yml   ← Docker image CI
│       ├── publish-packages.yml        ← Manual trigger publish
│       └── swift-adapter.yml           ← swift-adapter test CI
└── Cargo.toml / Anchor.toml           ← Rust/Solana workspace config
```

### Quy tắc tầng phụ thuộc (Dependency Layer Rules)

| Layer | Gói | Được phép phụ thuộc vào |
|-------|-----|------------------------|
| 0 | `@vnkrvietnam/types` | Không có internal dep |
| 1 | `@vnkrvietnam/config`, `@vnkrvietnam/db` | layer 0 |
| 2 | `@vnkrvietnam/core-sdk`, `@vnkrvietnam/swift-adapter`, `@vnkrvietnam/merchant-sdk`, `@vnkrvietnam/contracts` | layer 0, 1 |
| 3 | `@vnkrvietnam/ui-kit` | layer 0, 1, 2 |
| S | `services/*` | layer 0–3 (không phụ thuộc lẫn nhau) |
| A | `apps/*` | layer 0–3, SDK |

> **Quy tắc vàng:** Dependency chỉ đi theo chiều **lên tầng** (lower → higher). Không bao giờ có circular dependency. Service không import service khác trực tiếp — giao tiếp qua HTTP/Redis/message queue.

---

## 3. Quy chuẩn Đặt tên Gói npm

### 3.1 Cú pháp tên chuẩn

```
@<scope>/<category>[-<subcategory>][-<variant>]
```

| Thành phần | Quy tắc | Ví dụ |
|------------|---------|-------|
| `scope` | Luôn là `@vnkrvietnam` — lowercase, không dấu | `@vnkrvietnam` |
| `category` | kebab-case, mô tả chức năng chính | `core-sdk`, `swift-adapter` |
| `subcategory` | Tùy chọn, làm rõ hơn category | `merchant-sdk`, `ui-kit` |
| `variant` | Chỉ dùng khi có nhiều biến thể cùng loại | `sdk-swift`, `sdk-internal` |

### 3.2 Bảng danh mục gói hiện tại

| Tên gói npm | Đường dẫn | Loại | Registry |
|-------------|-----------|------|----------|
| `@vnkrvietnam/types` | `packages/types` | Shared types | GitHub Packages |
| `@vnkrvietnam/config` | `packages/config` | Constants & config | GitHub Packages |
| `@vnkrvietnam/db` | `packages/db` | DB adapter | GitHub Packages |
| `@vnkrvietnam/core-sdk` | `packages/core-sdk` | Solana/EVM SDK | GitHub Packages |
| `@vnkrvietnam/swift-adapter` | `packages/swift-adapter` | SWIFT messaging | GitHub Packages |
| `@vnkrvietnam/merchant-sdk` | `packages/merchant-sdk` | Public partner SDK | GitHub Packages |
| `@vnkrvietnam/contracts` | `packages/contracts` | Smart contracts ABI | GitHub Packages |
| `@vnkrvietnam/ui-kit` | `packages/ui-kit` | React component lib | GitHub Packages |
| `@vnkrvietnam/swift-sdk-internal` | `packages/swift` | Vendor mirror (private) | GitHub Packages |

### 3.3 Quy tắc đặt tên bổ sung

```
✅ ĐÚNG
@vnkrvietnam/types                  ← ngắn gọn, mô tả đúng mục đích
@vnkrvietnam/core-sdk               ← kebab-case, rõ ràng
@vnkrvietnam/swift-adapter          ← chỉ rõ là adapter (wrapper) của SWIFT
@vnkrvietnam/merchant-sdk           ← chỉ rõ đối tượng dùng là merchant

❌ SAI
@vnkrvietnam/Types                  ← không được PascalCase
@vnkrvietnam/SWIFT_ADAPTER          ← không được SCREAMING_CASE
@vnkrvietnam/vnkr-types             ← không lặp lại tên org trong tên gói
@vnkrvietnam/pkg                    ← quá chung, không mô tả
@vnkrvietnam/myUtils                ← không camelCase
```

### 3.4 Quy tắc đặt tên service (KHÔNG publish)

Services trong `services/*` dùng tên `@vnkrvietnam/<service-name>` nhưng có `"private": true` — **không bao giờ publish lên bất kỳ registry nào**.

```
@vnkrvietnam/api-gateway            ← <tên-service>
@vnkrvietnam/fiat-connector-api     ← <tên-service>-api (nếu là HTTP service)
@vnkrvietnam/swift-chain-bridge     ← <tên-service> mô tả chức năng cụ thể
```

---

## 4. Chi tiết Cấu hình `package.json` Chuẩn Doanh nghiệp

### A. Cấu hình Root `package.json` (Workspace Manager)

File `package.json` ở root **không publish** và đóng vai trò điều phối toàn bộ workspace.

```json
{
  "name": "vnkr-tech-holding-monorepo",
  "version": "1.0.0",
  "private": true,                          // ← BẮT BUỘC: ngăn publish root
  "description": "VNKR TECH HOLDING JSC — Enterprise Monorepo",

  // Workspace globs — pnpm đọc từ pnpm-workspace.yaml, npm/yarn đọc ở đây
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ],

  // Scripts chạy ở root thông qua Turborepo
  "scripts": {
    "build":              "turbo run build",
    "dev":                "turbo run dev",
    "lint":               "turbo run lint",
    "test":               "turbo run test",
    "typecheck":          "turbo run typecheck",
    "clean":              "turbo run clean && rm -rf node_modules",

    // Docker shortcuts
    "dev:docker":         "docker compose -f deploy/docker/docker-compose.yml -f deploy/docker/docker-compose.dev.yml up -d",
    "stop:docker":        "docker compose -f deploy/docker/docker-compose.yml -f deploy/docker/docker-compose.dev.yml down",

    // Version & Publish — dùng Changeset
    "changeset":          "changeset",
    "changeset:add":      "changeset add",
    "changeset:version":  "changeset version",
    "changeset:publish":  "pnpm build && pnpm test && changeset publish",
    "changeset:status":   "changeset status --verbose",

    // Manual publish (ngoài Changeset flow)
    "publish:all":        "node deploy/npm/scripts/publish-all.mjs",
    "publish:dry":        "node deploy/npm/scripts/publish-all.mjs --dry-run",
    "version:patch":      "node deploy/npm/scripts/bump-version.mjs patch",
    "version:minor":      "node deploy/npm/scripts/bump-version.mjs minor",
    "version:major":      "node deploy/npm/scripts/bump-version.mjs major"
  },

  // Dev tools tại root (shared với toàn workspace)
  "devDependencies": {
    "@changesets/cli":                "^3.0.1",    // version management
    "@types/node":                    "^22.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser":       "^7.0.0",
    "eslint":                         "^8.57.0",
    "ts-node":                        "^10.9.2",
    "ts-node-dev":                    "^2.0.0",
    "tsup":                           "^8.3.0",    // bundle tool cho packages
    "turbo":                          "^2.3.0",    // task runner
    "typescript":                     "^5.6.0",
    "vite":                           "^5.3.1",
    "vitest":                         "^2.0.0"
  },

  // Utilities dùng trong deploy scripts (root-level)
  "dependencies": {
    "ajv":             "^8.17.1",
    "chalk":           "^5.3.0",
    "execa":           "^9.3.0",
    "fast-xml-parser": "^4.4.1",
    "globby":          "^14.0.1",
    "semver":          "^7.6.3"
  },

  // Khai báo package manager cụ thể — pnpm enforce phiên bản
  "packageManager": "pnpm@9.15.9",

  // Minimum runtime requirements — CI sẽ fail nếu không đáp ứng
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },

  // pnpm-specific overrides — giải quyết xung đột version
  "pnpm": {
    "overrides": {
      "@sqds/sdk": "2.0.4"            // pin Squads SDK do breaking API changes
    }
  }
}
```

**Quy tắc Root `package.json`:**

| Trường | Bắt buộc | Giá trị |
|--------|----------|---------|
| `"private": true` | ✅ BẮT BUỘC | Ngăn publish root lên registry |
| `"packageManager"` | ✅ BẮT BUỘC | `"pnpm@<version-chính-xác>"` |
| `"engines"` | ✅ BẮT BUỘC | Khai báo node & pnpm min version |
| `"workspaces"` | ✅ BẮT BUỘC | Phải khớp với `pnpm-workspace.yaml` |
| `"publishConfig"` | ❌ KHÔNG được có | Root không publish |

---

### B. Cấu hình Package Module (publishable)

Mỗi gói trong `packages/*` tuân theo cấu trúc sau:

```json
{
  "name": "@vnkrvietnam/<package-name>",
  "version": "1.0.0",                     // SemVer: MAJOR.MINOR.PATCH

  // Phân phối dual-format: CommonJS (Node) + ESM (bundler/browser)
  "main":   "./dist/index.js",            // CJS entry (Node require)
  "module": "./dist/index.mjs",           // ESM entry (bundler/modern)
  "types":  "./dist/index.d.ts",          // TypeScript declarations (CJS)

  // Package exports map — module-aware (Node 12+, bundlers)
  "exports": {
    ".": {
      "import": {
        "types":   "./dist/index.d.mts",  // TS types cho ESM consumers
        "default": "./dist/index.mjs"     // ESM runtime
      },
      "require": {
        "types":   "./dist/index.d.ts",   // TS types cho CJS consumers
        "default": "./dist/index.js"      // CJS runtime
      }
    }
    // Thêm sub-paths nếu cần: "./utils": { ... }
  },

  // Chỉ include thư mục dist khi publish — loại bỏ src, tests, config files
  "files": ["dist"],

  // Cấu hình publish — KHÔNG sửa registry trực tiếp trong field này
  // Registry được control bởi .npmrc
  "publishConfig": {
    "access":   "restricted",             // "restricted" = private; "public" = open
    "registry": "https://npm.pkg.github.com"
  },

  "scripts": {
    "build":     "tsup src/index.ts --format cjs,esm --dts --clean",
    "dev":       "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint":      "eslint src",
    "typecheck": "tsc --noEmit",
    "test":      "vitest run"             // chỉ nếu có tests
  },

  // Runtime dependencies — phải có trong dist output
  "dependencies": {
    "@vnkrvietnam/types": "workspace:*",  // internal: dùng workspace protocol
    "some-lib":           "^1.2.0"        // external: dùng caret range
  },

  // Build tools — KHÔNG bundle vào dist
  "devDependencies": {
    "tsup":        "^8.3.0",
    "typescript":  "^5.6.0",
    "@types/node": "^22.0.0",
    "vitest":      "^2.0.0"
  },

  // Chỉ dùng cho UI packages — không bundle framework
  // "peerDependencies": {
  //   "react": ">=18.0.0",
  //   "react-dom": ">=18.0.0"
  // },

  "repository": {
    "type": "git",
    "url":  "https://github.com/vnkrvietnam/vnkr-packages.git"
  }
}
```

**Bảng kiểm tra Package `package.json`:**

| Trường | Yêu cầu | Ghi chú |
|--------|---------|---------|
| `name` | `@vnkrvietnam/<tên>` | Phải có scope |
| `version` | SemVer chính xác | Không `0.0.0` hay `latest` |
| `main` | `./dist/index.js` | CJS cho Node compatibility |
| `module` | `./dist/index.mjs` | ESM cho bundler |
| `types` | `./dist/index.d.ts` | TypeScript declarations |
| `exports` | Object đầy đủ | Hỗ trợ `import` + `require` + `types` |
| `files` | `["dist"]` | Không include `src/`, `*.test.ts` |
| `publishConfig` | Object với `registry` | Không hardcode token |
| `scripts.build` | `tsup ... --clean` | `--clean` tránh stale dist |
| `devDependencies` | tsup + typescript | Không thiếu build tools |
| `private` | Không có (hoặc `false`) | Phải publish được |

**Cấu hình Service (KHÔNG publish):**

```json
{
  "name": "@vnkrvietnam/<service-name>",
  "version": "1.0.0",
  "private": true,                        // ← BẮT BUỘC cho services
  "description": "...",
  "scripts": {
    "dev":     "ts-node-dev --respawn --transpile-only src/index.ts",
    "build":   "tsc --outDir dist",
    "start":   "node dist/index.js"
  }
  // Không có: "main", "module", "types", "exports", "files", "publishConfig"
}
```

---

## 5. Cấu hình File Đăng ký npm (`.npmrc`)

### 5.1 File `.npmrc` tại root

```ini
# ─── VNKR TECH HOLDING — npm Registry Configuration ──────────────────────────
# File: /.npmrc (workspace root)
# Commit: YES (không chứa token thật)

# Scope @vnkrvietnam → GitHub Packages (private registry)
@vnkrvietnam:registry=https://npm.pkg.github.com

# Auth token cho GitHub Packages
# Giá trị thật được inject qua:
#   - CI/CD: secrets.GITHUB_TOKEN hoặc secrets.NPM_TOKEN
#   - Local dev: ~/.npmrc hoặc .env (gitignore)
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}

# Mọi scope khác → npmjs.com (default, không cần khai báo)
# registry=https://registry.npmjs.org  ← đây là default, không cần viết
```

> ⚠️ **BẢO MẬT QUAN TRỌNG:** Không bao giờ hardcode token thật trong `.npmrc` được commit vào git. Dùng biến môi trường `${NPM_TOKEN}` hoặc `${GITHUB_TOKEN}`.

### 5.2 File `~/.npmrc` tại Local Development

Mỗi developer cần cấu hình tại máy cá nhân (không commit):

```ini
# ~/.npmrc — Local developer machine (KHÔNG commit)
@vnkrvietnam:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_<PERSONAL_ACCESS_TOKEN>
```

Token cần scopes: `read:packages` (để cài), `write:packages` (để publish).

### 5.3 Giải thích Routing Registry

```
Khi chạy: pnpm install @vnkrvietnam/types

pnpm đọc .npmrc:
  @vnkrvietnam:registry=https://npm.pkg.github.com
            ↓
  Gửi request tới: https://npm.pkg.github.com/@vnkrvietnam/types
  Header: Authorization: Bearer <NPM_TOKEN>

Khi chạy: pnpm install express

pnpm dùng default registry:
  Gửi request tới: https://registry.npmjs.org/express
  (không cần auth cho public packages)
```

### 5.4 Multi-registry Setup cho CI/CD

```yaml
# .github/workflows/changeset-release.yml (trích đoạn)
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: pnpm
    registry-url: 'https://npm.pkg.github.com'  # ← GitHub Packages
    scope: '@vnkrvietnam'                         # ← scope mapping

- run: pnpm install --frozen-lockfile
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # ← auto-inject bởi setup-node
```

---

## 6. Nguyên tắc An toàn & Quy chuẩn Đặt tên

### 6.1 Bảo mật Token & Credentials

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CREDENTIAL SECURITY MATRIX                          │
├────────────────┬───────────┬──────────────┬──────────────────────────── │
│ Credential     │ Commit?   │ Lưu ở đâu   │ Inject vào service           │
├────────────────┼───────────┼──────────────┼──────────────────────────── │
│ NPM_TOKEN      │ ❌ KHÔNG  │ GitHub Secrets│ CI env: NODE_AUTH_TOKEN    │
│ GITHUB_TOKEN   │ ❌ KHÔNG  │ Auto-inject  │ secrets.GITHUB_TOKEN        │
│ JWT_SECRET     │ ❌ KHÔNG  │ .env (local) │ K8s Secret / Vault          │
│ DB passwords   │ ❌ KHÔNG  │ .env.example │ Docker env / K8s Secret     │
│ SWIFT_LAU_KEY  │ ❌ KHÔNG  │ HSM / Vault  │ env injection at runtime    │
│ .env.example   │ ✅ ĐƯỢC   │ git          │ Template only, no real vals │
│ .npmrc (scope) │ ✅ ĐƯỢC   │ git          │ Không có token thật         │
└────────────────┴───────────┴──────────────┴──────────────────────────── │
```

### 6.2 Quy tắc Gitignore cho Monorepo

```gitignore
# ── Secrets & Environment ─────────────────────────────
.env
.env.*
!.env.example           # ← example ĐƯỢC commit

# ── Build Outputs ─────────────────────────────────────
dist/
build/
.next/
out/

# ── Dependencies ──────────────────────────────────────
node_modules/
.pnpm-store/

# ── Editor / OS ───────────────────────────────────────
.DS_Store
*.local
.idea/
.vscode/settings.json
```

### 6.3 Quy tắc Đặt tên An toàn cho Nội bộ

**Tên gói internal (không publish cho công chúng):**

```
@vnkrvietnam/swift-sdk-internal     ← suffix "-internal" rõ ràng
@vnkrvietnam/mock-mgw-daemon        ← prefix "mock-" cho môi trường dev

# Trong package.json:
"private": true                     ← BẮT BUỘC với gói internal
```

**Tên biến môi trường:**

```bash
# ✅ ĐÚNG — prefix theo service, SCREAMING_SNAKE_CASE
SWIFT_LAU_KEY=
JWT_SECRET=
DB_PASS_FIAT=
VNKR_INTERNAL_WEBHOOK_SECRET=

# ❌ SAI
swift_lau_key=          # lowercase
mySecret=               # camelCase
SECRET=                 # quá chung, không biết của service nào
```

**Tên Docker image:**

```
ghcr.io/vnkrvietnam/<service-name>:<version>

Ví dụ:
  ghcr.io/vnkrvietnam/api-gateway:1.0.0
  ghcr.io/vnkrvietnam/swift-gateway:1.0.0
  ghcr.io/vnkrvietnam/fiat-connector-api:1.0.0
```

### 6.4 Supply Chain Security (Bảo mật Chuỗi Cung ứng)

```
1. LOCKFILE COMMIT
   ─ pnpm-lock.yaml BẮT BUỘC commit vào git
   ─ CI chạy: pnpm install --frozen-lockfile (không cập nhật lock)
   ─ Chỉ update lock sau review cẩn thận: pnpm update <package>

2. NPM PROVENANCE ATTESTATION
   ─ CI dùng: permissions.id-token: write
   ─ actions/setup-node tự inject NODE_AUTH_TOKEN
   ─ Published packages có verified provenance trên registry

3. DEPENDENCY AUDIT
   ─ Định kỳ chạy: pnpm audit
   ─ Không dùng: pnpm install --no-frozen-lockfile (trừ local dev emergency)

4. VERSION PINNING
   ─ Internal deps: dùng workspace:* (luôn latest local)
   ─ External deps: dùng caret ^MAJOR.MINOR.PATCH (minor/patch tự update)
   ─ Critical deps (SWIFT, crypto): pin exact version không có ^

5. REGISTRY ISOLATION
   ─ @vnkrvietnam/* → GitHub Packages (private, cần auth)
   ─ Không dùng npm.pkg.github.com cho packages public
   ─ Không publish internal packages lên npmjs.com
```

### 6.5 Quy tắc Access Control (`publishConfig.access`)

| Loại gói | `access` | Ai cài được |
|----------|----------|-------------|
| Types, Config, SDK (partner-facing) | `"restricted"` | Chỉ org members + invited |
| UI Kit (internal design system) | `"restricted"` | Chỉ org members |
| Merchant SDK (đối tác bên ngoài) | `"public"` _(nếu open)_ | Mọi người |
| Services (`private: true`) | N/A — không publish | N/A |

---

## 7. Vòng đời Phát hành & Changeset

### 7.1 Quy trình Chuẩn

```
Developer thay đổi code trong packages/
        │
        ▼
1. pnpm changeset add
   ─ Chọn gói bị ảnh hưởng
   ─ Chọn loại bump: patch / minor / major
   ─ Viết mô tả thay đổi
   ─ Tạo file .changeset/xxxx.md
        │
        ▼
2. git commit & push lên feature branch
        │
        ▼
3. Merge vào main
        │
        ▼
4. GitHub Actions: changeset-release.yml chạy
   ─ Nếu có .changeset/*.md:
     → Tự động mở PR "chore: version packages"
     → PR bump version + update CHANGELOG.md
   ─ Khi PR được merge:
     → Publish lên npm.pkg.github.com
     → Tạo GitHub Release + git tag
```

### 7.2 Changeset Config (`.changeset/config.json`)

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.1/schema.json",
  "changelog":  "@changesets/cli/changelog",
  "commit":     false,                    // không auto-commit .changeset files
  "fixed":      [],                       // nhóm version cùng nhau (thường không dùng)
  "linked":     [],                       // link version (thường không dùng)
  "access":     "restricted",             // default access cho tất cả packages
  "baseBranch": "main",                   // branch gốc để so sánh
  "updateInternalDependencies": "patch",  // internal dep auto-bump với patch
  "ignore":     []                        // packages không tham gia changeset
}
```

### 7.3 SemVer Guidelines

| Loại thay đổi | Bump | Ví dụ |
|---------------|------|-------|
| Sửa lỗi, không thay đổi API | `patch` | `1.0.0 → 1.0.1` |
| Thêm tính năng mới, backward compatible | `minor` | `1.0.0 → 1.1.0` |
| Breaking changes, API change | `major` | `1.0.0 → 2.0.0` |
| Chỉ thay đổi types (không đổi runtime) | `patch` | `1.0.0 → 1.0.1` |
| Thêm export mới | `minor` | `1.0.0 → 1.1.0` |
| Xóa/rename export | `major` | `1.0.0 → 2.0.0` |

---

## 8. CI/CD Pipelines

### 8.1 Pipeline: `changeset-release.yml` (Main Publish Flow)

```
Trigger: push to main

Job: release
  Permissions:
    contents: write          ← tạo commits & tags
    pull-requests: write     ← mở "Version Packages" PR
    packages: write          ← push lên GitHub Packages
    id-token: write          ← NPM provenance attestation

  Steps:
    1. checkout (fetch-depth: 0)          ← full history cho changeset
    2. pnpm/action-setup@v4 (v9)
    3. actions/setup-node@v4
         registry-url: npm.pkg.github.com
         scope: @vnkrvietnam
    4. pnpm install --frozen-lockfile
    5. pnpm turbo run build --filter="./packages/*"
    6. pnpm turbo run test  --filter="./packages/*"
    7. changesets/action@v1
         publish: pnpm changeset publish
         version: pnpm changeset version
         createGithubReleases: true
```

### 8.2 Pipeline: `npm-publish.yml` (Tag-triggered)

```
Trigger: push tag v* | workflow_dispatch (dry_run option)

Job: publish
  Steps:
    1. checkout
    2. pnpm setup (v9)
    3. actions/setup-node@v4
         registry-url: registry.npmjs.org  ← npmjs.com
    4. pnpm install --frozen-lockfile
    5. pnpm build
    6. pnpm publish:all / publish:dry
       env: NODE_AUTH_TOKEN: secrets.NPM_TOKEN
```

### 8.3 Turborepo Task Graph (`turbo.json`)

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],            // build deps trước
      "outputs": [
        ".next/**", "!.next/cache/**",
        "dist/**",
        "build/**",
        "target/deploy/**"               // Rust/Anchor output
      ]
    },
    "test": {
      "dependsOn": ["^build"],           // test sau khi build deps
      "outputs": []
    },
    "lint": {
      "outputs": []                      // không cache lint
    },
    "dev": {
      "cache": false,                    // không cache dev mode
      "persistent": true                 // long-running process
    }
  }
}
```

### 8.4 Build Order Minh họa (Topological Sort)

```bash
# pnpm turbo run build chạy theo thứ tự:

Step 1:  @vnkrvietnam/types          (no deps)
Step 2:  @vnkrvietnam/config         (needs: types)
         @vnkrvietnam/db             (needs: types)
Step 3:  @vnkrvietnam/core-sdk       (needs: types, config)
         @vnkrvietnam/swift-adapter  (needs: types, config)
         @vnkrvietnam/merchant-sdk   (needs: types, config)
         @vnkrvietnam/contracts      (needs: types, config)
Step 4:  @vnkrvietnam/ui-kit         (needs: types, config, core-sdk)
Step 5:  services/* & apps/*         (needs: all packages above)
```

---

## Quick Reference

### Commands hay dùng

```bash
# Cài dependencies toàn workspace
pnpm install

# Build tất cả (theo đúng thứ tự dependency)
pnpm build

# Dev một package cụ thể
pnpm --filter @vnkrvietnam/core-sdk dev

# Chạy test package cụ thể
pnpm --filter @vnkrvietnam/swift-adapter test

# Thêm changeset mới
pnpm changeset add

# Kiểm tra trạng thái changeset
pnpm changeset:status

# Bump version local (không publish)
pnpm changeset version

# Publish (thường để CI làm — chỉ dùng emergency)
pnpm changeset:publish

# Audit bảo mật dependencies
pnpm audit

# Xem dependency graph
pnpm turbo run build --graph
```

### Checklist trước khi tạo Package mới

- [ ] Tên gói đúng format: `@vnkrvietnam/<kebab-case>`
- [ ] `package.json` có đủ: `name`, `version`, `main`, `module`, `types`, `exports`, `files`, `publishConfig`
- [ ] `"files": ["dist"]` — không include `src/`
- [ ] `publishConfig.registry` trỏ đúng registry
- [ ] Services có `"private": true`
- [ ] Không có circular dependency với packages khác
- [ ] Thêm vào `pnpm-workspace.yaml` nếu chưa có
- [ ] Viết `README.md` cho package
- [ ] Thêm script `build`, `dev`, `typecheck`
- [ ] Chạy `pnpm install` sau khi tạo để update lockfile

---

*Tài liệu này được duy trì bởi VNKR TECH HOLDING Engineering Team. Mọi thay đổi về quy chuẩn cần được review và approve bởi Tech Lead trước khi áp dụng.*
