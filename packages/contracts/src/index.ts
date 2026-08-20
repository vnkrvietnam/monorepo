export const CONTRACTS_VERSION = "1.0.0";

export interface NetworkContractAddresses {
  VNKR_TOKEN:     string;
  SVNKR_TOKEN:    string;
  GVNKR_TOKEN:    string;
  KERNEL:         string;
  ROLES_MODULE:   string;
  TRSRY_MODULE:   string;
  MINTR_MODULE:   string;
  RANGE_MODULE:   string;
  COMPL_MODULE:   string;
  STAKING_POLICY: string;
  GOVERNANCE:     string;
  RANGE_BOUND:    string;
  CAPITAL_CONTROL:string;
  VND_GATEWAY:    string;
  SWIFT_ESCROW:   string;
  P2P_ESCROW:     string;
}

export type NetworkEnvironment = "localhost" | "testnet" | "mainnet";

const ZERO = "0x0000000000000000000000000000000000000000";

const EMPTY: NetworkContractAddresses = {
  VNKR_TOKEN:     ZERO, SVNKR_TOKEN:    ZERO, GVNKR_TOKEN:    ZERO,
  KERNEL:         ZERO, ROLES_MODULE:   ZERO, TRSRY_MODULE:   ZERO,
  MINTR_MODULE:   ZERO, RANGE_MODULE:   ZERO, COMPL_MODULE:   ZERO,
  STAKING_POLICY: ZERO, GOVERNANCE:     ZERO, RANGE_BOUND:    ZERO,
  CAPITAL_CONTROL:ZERO, VND_GATEWAY:    ZERO, SWIFT_ESCROW:   ZERO,
  P2P_ESCROW:     ZERO,
};

export const CONTRACT_ADDRESSES: Record<NetworkEnvironment, NetworkContractAddresses> = {
  localhost: { ...EMPTY },
  testnet:   { ...EMPTY },
  mainnet:   { ...EMPTY },
} as const;

export function getContractAddresses(env: NetworkEnvironment): NetworkContractAddresses {
  return CONTRACT_ADDRESSES[env] ?? CONTRACT_ADDRESSES.localhost;
}

// ─── Bophades Module Keycodes ──────────────────────────────────────────────────

export const MODULE_KEYCODES = {
  ROLES: "ROLES",
  TRSRY: "TRSRY",
  MINTR: "MINTR",
  RANGE: "RANGE",
  COMPL: "COMPL",
  VOTES: "VOTES",
  CHRGS: "CHRGS",
} as const;

export type ModuleKeycode = keyof typeof MODULE_KEYCODES;

// ─── Token Constants ──────────────────────────────────────────────────────────

export const VNKR_DECIMALS = 18;
export const VNKR_MAX_SUPPLY = BigInt("10000000000000000000000000000000");
export const SVNKR_EPOCH_DURATION = 8 * 60 * 60; // 8 hours in seconds

// ─── Solana ───────────────────────────────────────────────────────────────────

export const SOLANA_PROGRAM_IDS = {
  P2P_ESCROW: "VNKRp2pEscrow11111111111111111111111111111111",
} as const;
