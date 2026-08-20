/**
 * In-memory store linking SWIFT UETR identifiers to on-chain transaction
 * hashes. This is a lightweight implementation suitable for single-process
 * deployments; replace `store` with a persistent repository (Redis, DB)
 * for production use.
 */
export class UetrTxTrackerService {
  /** In-memory map: UETR → blockchain transaction hash. */
  private readonly store = new Map<string, string>();

  /**
   * Associates a UETR with a blockchain transaction hash.
   * Overwrites any existing mapping for the same UETR.
   *
   * @param uetr   UUID v4 UETR string assigned to the SWIFT payment.
   * @param txHash 0x-prefixed EVM transaction hash (or TRON txID).
   */
  async linkUetrToTxHash(uetr: string, txHash: string): Promise<void> {
    this.store.set(uetr, txHash);
  }

  /**
   * Retrieves the blockchain transaction hash associated with a UETR.
   *
   * @param uetr UUID v4 UETR string to look up.
   * @returns    Transaction hash string, or `null` if no mapping exists.
   */
  async getTxHashByUetr(uetr: string): Promise<string | null> {
    return this.store.get(uetr) ?? null;
  }
}
