// ─── Smart Contract ABIs ──────────────────────────────────────────────────────
// Minimal ABI fragments for the cross-border escrow contracts used by
// `@vnkrvietnam/sdk-swift` blockchain bridge module.

/**
 * ABI fragment for the VNKR CrossBorderEscrow contract (EVM / Solidity).
 *
 * Deployed on Ethereum and BNB Chain for fiat ↔ crypto settlement.
 *
 * Functions:
 *   createEscrow(uetr, beneficiary, token, amount, expiry)
 *   releaseEscrow(escrowId, swiftConfirmation)
 *   refundEscrow(escrowId)
 *   getEscrow(escrowId) → EscrowData
 *
 * Events:
 *   EscrowCreated(escrowId, uetr, beneficiary, amount, expiry)
 *   EscrowReleased(escrowId, uetr, txHash)
 *   EscrowRefunded(escrowId, uetr)
 */
export const CROSS_BORDER_ESCROW_ABI = [
  // ─── Write functions ─────────────────────────────────────────────────────
  {
    name: "createEscrow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "uetr",        type: "bytes32" },
      { name: "beneficiary", type: "address" },
      { name: "token",       type: "address" },
      { name: "amount",      type: "uint256" },
      { name: "expiry",      type: "uint256" },
    ],
    outputs: [{ name: "escrowId", type: "bytes32" }],
  },
  {
    name: "releaseEscrow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "escrowId",           type: "bytes32" },
      { name: "swiftConfirmation",  type: "bytes"   },
    ],
    outputs: [],
  },
  {
    name: "refundEscrow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "escrowId", type: "bytes32" }],
    outputs: [],
  },
  // ─── Read functions ──────────────────────────────────────────────────────
  {
    name: "getEscrow",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "escrowId", type: "bytes32" }],
    outputs: [
      { name: "uetr",        type: "bytes32" },
      { name: "depositor",   type: "address" },
      { name: "beneficiary", type: "address" },
      { name: "token",       type: "address" },
      { name: "amount",      type: "uint256" },
      { name: "expiry",      type: "uint256" },
      { name: "status",      type: "uint8"   },
    ],
  },
  // ─── Events ──────────────────────────────────────────────────────────────
  {
    name: "EscrowCreated",
    type: "event",
    anonymous: false,
    inputs: [
      { name: "escrowId",    indexed: true,  type: "bytes32" },
      { name: "uetr",        indexed: true,  type: "bytes32" },
      { name: "beneficiary", indexed: false, type: "address" },
      { name: "amount",      indexed: false, type: "uint256" },
      { name: "expiry",      indexed: false, type: "uint256" },
    ],
  },
  {
    name: "EscrowReleased",
    type: "event",
    anonymous: false,
    inputs: [
      { name: "escrowId", indexed: true,  type: "bytes32" },
      { name: "uetr",     indexed: true,  type: "bytes32" },
      { name: "txHash",   indexed: false, type: "bytes32" },
    ],
  },
  {
    name: "EscrowRefunded",
    type: "event",
    anonymous: false,
    inputs: [
      { name: "escrowId", indexed: true, type: "bytes32" },
      { name: "uetr",     indexed: true, type: "bytes32" },
    ],
  },
] as const;

/**
 * ABI fragment for TRON TRC20 USDT contract — used by the TRON escrow bridge.
 * Standard OpenZeppelin ERC20 interface (compatible with TRC20 via TronWeb).
 */
export const TRC20_USDT_ABI = [
  {
    name: "transfer",
    type: "Function",
    inputs: [
      { name: "_to",    type: "address" },
      { name: "_value", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "Function",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "Function",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "remaining", type: "uint256" }],
  },
  {
    name: "approve",
    type: "Function",
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value",   type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;
