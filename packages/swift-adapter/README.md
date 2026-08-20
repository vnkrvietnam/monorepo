# @vnkrvietnam/swift-adapter

SWIFT SDK wrapper for VNKR Institutional Banking — MT103/MT202/MT940 message builder, ISO 20022 (pacs.008 · pacs.009 · camt.053) parser, LAU signing, RMA registry, and Redis Event Bus client.

---

## Overview

This package decouples the official SWIFT vendor SDKs from the VNKR monorepo application layer and exposes a clean TypeScript API for all SWIFT messaging operations.

| Layer | What it wraps |
|---|---|
| `src/mt/` | ISO 15022 FIN message builders (MT103, MT202, MT940) |
| `src/iso20022/` | ISO 20022 MX builders + parsers (pacs.008, pacs.009, camt.053) |
| `src/security/` | LAU v2 HMAC-SHA256 signer, RMA authorisation registry |
| `src/core/java-bridge.ts` | Node.js wrapper over `file-encryptor-decryptor-*.jar` via `child_process` |
| `src/config/config-encryptor.ts` | AJV validator + JAR-backed config encryptor |
| `src/client.ts` | Redis Streams event bus producer/consumer (`VNKRSwiftClient`) |

---

## Requirements

| Dependency | Version |
|---|---|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| Java JRE/JDK | ≥ 17 (for JAR utilities only) |

> **Note:** Java is only required when using `SwiftJavaBridge` or `SwiftConfigManager` for config encryption/decryption. The message builders, LAU signer, and Redis client run on Node.js alone.

---

## Installation

Within the monorepo, add the package to your service:

```json
{
  "dependencies": {
    "@vnkrvietnam/swift-adapter": "workspace:*"
  }
}
```

---

## Vendor Setup

Run the SWIFT vendor install scripts once after cloning:

```bash
bash packages/swift-adapter/scripts/install-vendor.sh
```

---

## Usage

### MT103 — Single Customer Credit Transfer

```typescript
import { buildMT103 } from "@vnkrvietnam/swift-adapter";

const message = buildMT103({
  senderBIC: "VNKRVNVNXXX",
  receiverBIC: "BNPAFRPPXXX",
  reference: "VNKR20260819001",
  amount: 1_500_000,
  currency: "USD",
  orderingAccount: "1029384756",
  orderingName: "VNKR TECH HOLDING JSC",
  beneficiaryAccount: "9876543210",
  beneficiaryName: "GLOBAL TECH SUPPLIER INC",
  chargesCode: "SHA",
  valueDate: "260819",
});
```

### ISO 20022 pacs.008

```typescript
import { buildPacs008, parsePacs008 } from "@vnkrvietnam/swift-adapter";

const xml = buildPacs008({
  msgId: "VNKR/20260819/PACS008/001",
  instrId: "INSTR-001",
  endToEndId: "E2E-VNKR-20260819",
  txId: "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
  intrBkSttlmAmt: 750_000.5,
  currency: "EUR",
  dbtrName: "VNKR TECH HOLDING JSC",
  dbtrAcctIBAN: "VN1234567890",
  dbtrAgtBIC: "VNKRVNVNXXX",
  cdtrAgtBIC: "DEUTDEFFXXX",
  cdtrName: "DEUTSCHE INDUSTRIAL GMBH",
  cdtrAcctIBAN: "DE89370400440532013000",
});
```

### LAU Signing

```typescript
import { LAUSigner } from "@vnkrvietnam/swift-adapter";

const signer = new LAUSigner(process.env.LAU_KEY_HEX!);
const { signature, timestamp } = signer.sign(message);
const isValid = signer.verify(message, timestamp, signature);
```

### Redis Event Bus (VNKRSwiftClient)

```typescript
import { VNKRSwiftClient } from "@vnkrvietnam/swift-adapter";
import Redis from "ioredis";

const redis = new Redis({ host: "localhost", port: 6379 });
const client = new VNKRSwiftClient(redis);

const { streamId } = await client.requestMT103({
  senderBIC: "VNKRVNVNXXX",
  receiverBIC: "BNPAFRPPXXX",
  reference: "VNKR20260819001",
  amount: 1_500_000,
  currency: "USD",
  orderingAccount: "1029384756",
  orderingName: "VNKR TECH HOLDING JSC",
  beneficiaryAccount: "9876543210",
  beneficiaryName: "GLOBAL TECH SUPPLIER INC",
});
```

### Config Validation & Encryption (requires Java ≥ 17)

```typescript
import { SwiftConfigManager } from "@vnkrvietnam/swift-adapter";

const manager = new SwiftConfigManager();

// Validate a YAML config against config-swift-sdk-schema.json
manager.validateFile("/path/to/config-swift-sdk.yaml");

// Encrypt the config for production deployment
manager.encryptConfig(
  "/path/to/config-swift-sdk.yaml",
  "/path/to/config-swift-sdk.enc",
  process.env.SWIFT_ENCRYPTION_KEY!
);
```

---

## Vendor Structure

```
vendor/
├── swift-sdk-2.17.10-6/
│   ├── file-encryptor-decryptor-2.17.1-3.jar  ← Config encryption utility
│   ├── config-swift-sdk-schema.json            ← AJV validation schema
│   ├── config-swift-sdk.yaml                   ← Gateway connection config
│   ├── config-swift-sdk-properties.yaml        ← Properties template
│   ├── lib/                                    ← Core Java libraries
│   ├── bin/                                    ← CLI utilities
│   └── install.sh
└── swift-security-sdk-2.17.5-6/
    ├── lib/                                    ← PKI/LAU/OAuth2 libraries
    ├── sample/                                 ← Usage examples
    └── install.sh
```

---

## Docker

A `Dockerfile` is provided that bundles Node.js 20 + OpenJDK 17 JRE:

```bash
docker build -f packages/swift-adapter/Dockerfile -t vnkr/swift-adapter .
```

---

## Scripts

| Script | Description |
|---|---|
| `pnpm build` | Compile TypeScript → `dist/` via tsup |
| `pnpm test` | Run Vitest unit tests |
| `pnpm typecheck` | TypeScript type-check only |
| `bash scripts/install-vendor.sh` | Run SWIFT vendor install scripts |
| `bash scripts/build-jar.sh` | Compile custom Java sources (optional) |

---

## Consumer Services

| Service | Port | Purpose |
|---|---|---|
| `@vnkrvietnam/swift-gateway` | 4004 | MT103/MT202/pacs.008 relay via SWIFT Microgateway |
| `@vnkrvietnam/swift-chain-bridge` | 4005 | SWIFT ↔ EVM/Solana bi-directional bridge |

---

## License

Internal — VNKR Tech Holding JSC. SWIFT vendor bundles are subject to the [SWIFT API Connectivity Option License](vendor/swift-sdk-2.17.10-6/Swift-API-Connectivity-Option-License.html).
