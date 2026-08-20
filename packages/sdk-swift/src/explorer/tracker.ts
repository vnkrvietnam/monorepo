import type { BlockchainNetwork } from "../generators/iso20022-dto.js";

/**
 * A single UETR ↔ On-Chain TxID mapping record stored by the tracker.
 */
export interface UETRMapping {
  /** SWIFT UETR (UUID v4) */
  uetr: string;
  /** Internal VNKR transaction ID */
  vnkrTxId: string;
  /** Target blockchain network */
  network: BlockchainNetwork;
  /** On-chain transaction hash */
  onChainTxHash: string;
  /** On-chain escrow identifier */
  escrowId?: string;
  /** ISO 8601 creation time */
  createdAt: string;
  /** ISO 8601 last-updated time */
  updatedAt: string;
  /** Current settlement phase */
  phase: "INITIATED" | "ESCROWED" | "SWIFT_CONFIRMED" | "SETTLED" | "REFUNDED";
}

/**
 * TransactionTracker — UETR ↔ On-Chain TxID Mapping Engine.
 *
 * Maintains a bi-directional index between:
 *  - SWIFT UETR (cross-border payment identifier)
 *  - On-Chain Transaction Hash (blockchain settlement leg)
 *  - VNKR Internal Transaction ID (internal orchestration ID)
 *
 * In production, the backing store should be a persistent database
 * (e.g. PostgreSQL or Redis). This module provides an in-memory
 * implementation suitable for tests and development.
 *
 * Compliance reference: NQ-05/NQ-CP, NĐ-284/2025/NĐ-CP
 */
export class TransactionTracker {
  private readonly byUETR: Map<string, UETRMapping> = new Map();
  private readonly byTxHash: Map<string, string> = new Map(); // txHash → uetr
  private readonly byVNKRTxId: Map<string, string> = new Map(); // vnkrTxId → uetr

  // ─── Registration ───────────────────────────────────────────────────────────

  /**
   * Register a new UETR ↔ On-Chain TxID mapping.
   *
   * @throws if a mapping for this UETR already exists
   */
  register(
    uetr: string,
    vnkrTxId: string,
    network: BlockchainNetwork,
    onChainTxHash: string,
    escrowId?: string
  ): UETRMapping {
    if (this.byUETR.has(uetr)) {
      throw new Error(`[TransactionTracker] UETR "${uetr}" is already registered`);
    }

    const now = new Date().toISOString();
    const mapping: UETRMapping = {
      uetr,
      vnkrTxId,
      network,
      onChainTxHash,
      escrowId,
      createdAt: now,
      updatedAt: now,
      phase: "INITIATED",
    };

    this.byUETR.set(uetr, mapping);
    this.byTxHash.set(onChainTxHash, uetr);
    this.byVNKRTxId.set(vnkrTxId, uetr);

    return mapping;
  }

  // ─── Phase transitions ──────────────────────────────────────────────────────

  /**
   * Advance the settlement phase of a tracked transaction.
   *
   * @param uetr  - SWIFT UETR
   * @param phase - New phase
   * @returns Updated mapping
   * @throws if the UETR is not registered
   */
  updatePhase(uetr: string, phase: UETRMapping["phase"]): UETRMapping {
    const mapping = this.getByUETR(uetr);
    mapping.phase = phase;
    mapping.updatedAt = new Date().toISOString();
    return mapping;
  }

  // ─── Lookups ────────────────────────────────────────────────────────────────

  /** Look up a mapping by SWIFT UETR */
  getByUETR(uetr: string): UETRMapping {
    const mapping = this.byUETR.get(uetr);
    if (!mapping) {
      throw new Error(`[TransactionTracker] UETR "${uetr}" not found`);
    }
    return mapping;
  }

  /** Look up a mapping by on-chain transaction hash */
  getByTxHash(txHash: string): UETRMapping | undefined {
    const uetr = this.byTxHash.get(txHash);
    return uetr ? this.byUETR.get(uetr) : undefined;
  }

  /** Look up a mapping by internal VNKR transaction ID */
  getByVNKRTxId(vnkrTxId: string): UETRMapping | undefined {
    const uetr = this.byVNKRTxId.get(vnkrTxId);
    return uetr ? this.byUETR.get(uetr) : undefined;
  }

  /**
   * List all mappings in a given settlement phase.
   */
  listByPhase(phase: UETRMapping["phase"]): UETRMapping[] {
    return Array.from(this.byUETR.values()).filter((m) => m.phase === phase);
  }

  /**
   * Return all registered mappings.
   */
  listAll(): UETRMapping[] {
    return Array.from(this.byUETR.values());
  }

  /**
   * Check whether a UETR is currently tracked.
   */
  has(uetr: string): boolean {
    return this.byUETR.has(uetr);
  }
}
