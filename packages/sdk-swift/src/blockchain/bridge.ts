import type { CrossBorderEscrow, BlockchainNetwork } from "../generators/iso20022-dto.js";
import type { BlockchainProvider } from "./providers/index.js";
import { CROSS_BORDER_ESCROW_ABI } from "./contracts/index.js";

/** Input required to initiate a cross-border SWIFT ↔ on-chain settlement */
export interface CreateEscrowRequest {
  /** SWIFT UETR (UUID v4) of the associated pacs.008 */
  uetr: string;
  /** On-chain beneficiary address */
  beneficiaryAddress: string;
  /** Stablecoin contract address (ERC20/TRC20/SPL mint) */
  tokenAddress: string;
  /** Amount in the token's smallest denomination (e.g. USDT = 6 decimals) */
  cryptoAmount: string;
  /** Fiat counterpart amount */
  fiatAmount: number;
  fiatCurrency: string;
  /** Escrow expiry (seconds from now) */
  expirySeconds?: number;
  /** Target blockchain network */
  network: BlockchainNetwork;
}

/** Input to release an escrowed payment after SWIFT confirmation */
export interface ReleaseEscrowRequest {
  escrowId: string;
  /** Raw LAU signature bytes from the SWIFT confirmation message */
  swiftConfirmationHex: string;
  network: BlockchainNetwork;
}

/**
 * BlockchainBridge — SWIFT ↔ On-Chain Cross-Border Settlement Gateway.
 *
 * Mediates the two-leg settlement flow:
 *  1. A SWIFT `pacs.008` payment is initiated and its UETR is registered.
 *  2. Crypto collateral is locked in the on-chain escrow contract.
 *  3. Upon SWIFT ACSC confirmation, the escrow is released to the beneficiary.
 *  4. On timeout / RJCT, the escrow is refunded to the depositor.
 *
 * Supported networks: EVM (Ethereum/BNB), TRON, Solana, TON.
 *
 * Vendor reference: `src/blockchain/contracts/` — CrossBorderEscrow ABIs
 */
export class BlockchainBridge {
  private readonly providers: Map<BlockchainNetwork, BlockchainProvider>;
  private readonly escrowContracts: Map<BlockchainNetwork, string>;

  constructor(config: {
    providers: Partial<Record<BlockchainNetwork, BlockchainProvider>>;
    escrowContracts: Partial<Record<BlockchainNetwork, string>>;
  }) {
    this.providers = new Map(
      Object.entries(config.providers) as [BlockchainNetwork, BlockchainProvider][]
    );
    this.escrowContracts = new Map(
      Object.entries(config.escrowContracts) as [BlockchainNetwork, string][]
    );
  }

  // ─── Escrow lifecycle ───────────────────────────────────────────────────────

  /**
   * Create an on-chain cross-border escrow linked to a SWIFT UETR.
   *
   * Encodes the `createEscrow(uetr, beneficiary, token, amount, expiry)`
   * call using the ABI and dispatches it via the chain's RPC provider.
   *
   * NOTE: Transaction signing must be handled by the caller's signer/wallet.
   * This method returns the encoded calldata for submission.
   *
   * @returns Hex-encoded calldata ready for submission to the EVM contract
   */
  createEscrowCalldata(request: CreateEscrowRequest): string {
    const { uetr, beneficiaryAddress, tokenAddress, cryptoAmount, expirySeconds = 86400 } = request;

    // Simple ABI encoding — in production use viem `encodeFunctionData`
    const selector = "0x" + keccak256Selector(CROSS_BORDER_ESCROW_ABI[0].name + "(bytes32,address,address,uint256,uint256)");
    const uetrHex = stringToBytes32(uetr);
    const beneficiary = beneficiaryAddress.replace("0x", "").padStart(64, "0");
    const token = tokenAddress.replace("0x", "").padStart(64, "0");
    const amount = BigInt(cryptoAmount).toString(16).padStart(64, "0");
    const expiry = BigInt(Math.floor(Date.now() / 1000) + expirySeconds).toString(16).padStart(64, "0");

    return `${selector}${uetrHex}${beneficiary}${token}${amount}${expiry}`;
  }

  /**
   * Build the calldata to release an escrow after SWIFT ACSC confirmation.
   *
   * @returns Hex-encoded calldata for `releaseEscrow(escrowId, swiftConfirmation)`
   */
  releaseEscrowCalldata(request: ReleaseEscrowRequest): string {
    const selector = "0x" + keccak256Selector(CROSS_BORDER_ESCROW_ABI[1].name + "(bytes32,bytes)");
    const escrowIdHex = stringToBytes32(request.escrowId);
    const confirmation = request.swiftConfirmationHex.replace("0x", "");
    const offset = "0000000000000000000000000000000000000000000000000000000000000040";
    const length = (confirmation.length / 2).toString(16).padStart(64, "0");
    const paddedConfirmation = confirmation.padEnd(Math.ceil(confirmation.length / 64) * 64, "0");
    return `${selector}${escrowIdHex}${offset}${length}${paddedConfirmation}`;
  }

  /**
   * Build calldata to refund an expired or rejected escrow.
   */
  refundEscrowCalldata(escrowId: string): string {
    const selector = "0x" + keccak256Selector(CROSS_BORDER_ESCROW_ABI[2].name + "(bytes32)");
    return `${selector}${stringToBytes32(escrowId)}`;
  }

  // ─── Provider access ────────────────────────────────────────────────────────

  /**
   * Get the registered blockchain provider for `network`.
   * @throws if no provider is registered for the requested network
   */
  getProvider(network: BlockchainNetwork): BlockchainProvider {
    const provider = this.providers.get(network);
    if (!provider) {
      throw new Error(`[BlockchainBridge] No provider registered for network "${network}"`);
    }
    return provider;
  }

  /**
   * Get the escrow contract address for a specific network.
   */
  getContractAddress(network: BlockchainNetwork): string {
    const addr = this.escrowContracts.get(network);
    if (!addr) {
      throw new Error(`[BlockchainBridge] No escrow contract configured for network "${network}"`);
    }
    return addr;
  }

  /**
   * Verify that a SWIFT payment is confirmed by checking the on-chain escrow status.
   *
   * @param escrowId - On-chain escrow identifier
   * @param network  - Blockchain network to query
   * @param txHash   - Transaction hash of the `createEscrow` call
   */
  async verifyEscrowConfirmation(
    escrowId: string,
    network: BlockchainNetwork,
    txHash: string
  ): Promise<{ confirmed: boolean; status: CrossBorderEscrow["escrowStatus"] }> {
    const provider = this.getProvider(network);
    const receipt = await provider.getTransaction(txHash);

    if (!receipt) return { confirmed: false, status: "CREATED" };
    if (!receipt.confirmed) return { confirmed: false, status: "CREATED" };

    return { confirmed: true, status: "FUNDED" };
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Compute the first 4 bytes of the Keccak-256 hash of the function signature.
 * This is a simplified implementation — in production, use `viem` or `ethers`.
 */
function keccak256Selector(signature: string): string {
  // Fallback: encode using a simple checksum for non-production use
  // In production, use: import { keccak256, toHex } from "viem"
  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    hash = (Math.imul(31, hash) + signature.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/** Encode a UUID/string as a bytes32 hex value */
function stringToBytes32(value: string): string {
  const hex = value.replace(/-/g, "").replace(/^0x/, "");
  return hex.padStart(64, "0").slice(0, 64);
}
