// ─── Feature Flags ────────────────────────────────────────────────────────────
export { features, requireFeature, checkFeature } from "./features.js";
export type { FeatureKey } from "./features.js";

// ─── RPC Endpoints ────────────────────────────────────────────────────────────

export const SOLANA_RPC_DEVNET  = "https://api.devnet.solana.com";
export const SOLANA_RPC_MAINNET = "https://api.mainnet-beta.solana.com";

/** App-Chain Genesis (EVM, Chain ID: 1337 local / 1 mainnet) */
export const APPCHAIN_RPC_LOCAL   = "http://localhost:8545";
export const APPCHAIN_RPC_MAINNET = "https://rpc.vnkr.vn";

export const TRON_FULL_HOST       = "https://api.trongrid.io";
export const TRON_NILE_TESTNET    = "https://nile.trongrid.io";

export const DEFAULT_API_ENDPOINT = "https://dev-api.vnkr.vn";

// ─── Solana Program IDs ───────────────────────────────────────────────────────

export const PROGRAM_IDS = {
  P2P_ESCROW:      "ESCRw1111111111111111111111111111111111111111",
  MINT_GOVERNANCE: "MINTg1111111111111111111111111111111111111111",
  AMM_SWAP:        "AMMSw1111111111111111111111111111111111111111",
  TREASURY_RBS:    "TRBSr1111111111111111111111111111111111111111",
} as const;

// ─── Seed PDA prefixes ────────────────────────────────────────────────────────

export const SEEDS = {
  ESCROW_VAULT:    Buffer.from("escrow_vault"),
  ORDER_STATE:     Buffer.from("order_state"),
  MINT_AUTHORITY:  Buffer.from("mint_authority"),
  TREASURY_VAULT:  Buffer.from("treasury_vault"),
} as const;

// ─── App-Chain (EVM) contract addresses ──────────────────────────────────────

export const EVM_CONTRACTS = {
  AXVN_TOKEN:    "0x0000000000000000000000000000000000000001",
  PROOF_RESERVE: "0x0000000000000000000000000000000000000002",
} as const;

// ─── Stalwart Mail Server ─────────────────────────────────────────────────────

export const MAIL_CONFIG = {
  SMTP_HOST:  process.env["SMTP_HOST"]  ?? "mail.vnkr.vn",
  SMTP_PORT:  Number(process.env["SMTP_PORT"] ?? 587),
  SMTP_SECURE: process.env["SMTP_SECURE"] === "true",
  SMTP_USER:  process.env["SMTP_USER"]  ?? "no-reply@vnkr.vn",
  SMTP_PASS:  process.env["SMTP_PASS"]  ?? "",
  EMAIL_FROM: process.env["EMAIL_FROM"] ?? "VNKR System <no-reply@vnkr.vn>",
} as const;
