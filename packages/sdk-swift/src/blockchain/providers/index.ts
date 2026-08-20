import type { BlockchainNetwork } from "../../generators/iso20022-dto.js";

/** Common interface every blockchain provider must implement */
export interface BlockchainProvider {
  readonly network: BlockchainNetwork;

  /**
   * Get the current block/slot/height of the chain.
   */
  getBlockHeight(): Promise<bigint>;

  /**
   * Get the native or token balance of `address`.
   *
   * @param address     - On-chain address (hex/base58/base64 depending on chain)
   * @param tokenAddress - Optional ERC20/TRC20/SPL mint address
   * @returns Balance as a string in the token's smallest unit
   */
  getBalance(address: string, tokenAddress?: string): Promise<string>;

  /**
   * Fetch a transaction receipt / confirmation status by hash.
   *
   * @returns `null` if not found, otherwise a minimal receipt
   */
  getTransaction(txHash: string): Promise<TransactionReceipt | null>;
}

export interface TransactionReceipt {
  txHash: string;
  network: BlockchainNetwork;
  /** `true` if the transaction was confirmed successfully */
  confirmed: boolean;
  /** Confirmation block/slot number */
  blockNumber?: bigint;
  /** ISO 8601 timestamp of the block */
  blockTime?: string;
  /** Raw fee paid (in native currency smallest unit) */
  fee?: string;
}

// ─── EVM Provider (Ethereum / BNB Chain) ─────────────────────────────────────

/**
 * EVMProvider — viem-based provider for EVM-compatible chains.
 *
 * Supports Ethereum mainnet, BNB Chain, and any EVM-compatible network.
 * Uses `fetch`-based JSON-RPC calls to avoid requiring a full viem client
 * import in environments that only need a subset of functionality.
 */
export class EVMProvider implements BlockchainProvider {
  readonly network: BlockchainNetwork = "EVM";
  private readonly rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  async getBlockHeight(): Promise<bigint> {
    const result = await this._rpc<string>("eth_blockNumber", []);
    return BigInt(result);
  }

  async getBalance(address: string, tokenAddress?: string): Promise<string> {
    if (tokenAddress) {
      // ERC20 balanceOf(address) — selector 0x70a08231
      const data = `0x70a08231${address.replace("0x", "").padStart(64, "0")}`;
      const result = await this._rpc<string>("eth_call", [
        { to: tokenAddress, data },
        "latest",
      ]);
      return BigInt(result).toString();
    }
    const result = await this._rpc<string>("eth_getBalance", [address, "latest"]);
    return BigInt(result).toString();
  }

  async getTransaction(txHash: string): Promise<TransactionReceipt | null> {
    const receipt = await this._rpc<EVMReceipt | null>(
      "eth_getTransactionReceipt",
      [txHash]
    );
    if (!receipt) return null;

    return {
      txHash,
      network: this.network,
      confirmed: receipt.status === "0x1",
      blockNumber: receipt.blockNumber ? BigInt(receipt.blockNumber) : undefined,
      fee: receipt.gasUsed && receipt.effectiveGasPrice
        ? (BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice)).toString()
        : undefined,
    };
  }

  private async _rpc<T>(method: string, params: unknown[]): Promise<T> {
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const body = (await res.json()) as { result?: T; error?: { message: string } };
    if (body.error) throw new Error(`[EVMProvider] RPC error: ${body.error.message}`);
    return body.result as T;
  }
}

interface EVMReceipt {
  status?: string;
  blockNumber?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

// ─── TRON Provider (TRC20) ────────────────────────────────────────────────────

/**
 * TronProvider — HTTP API provider for TRON network (TRC20/TRX).
 *
 * Uses the Tron Full Node HTTP API (`/wallet/` endpoints).
 */
export class TronProvider implements BlockchainProvider {
  readonly network: BlockchainNetwork = "TRON";
  private readonly rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl.replace(/\/$/, "");
  }

  async getBlockHeight(): Promise<bigint> {
    const res = await fetch(`${this.rpcUrl}/wallet/getnowblock`);
    const body = (await res.json()) as { block_header?: { raw_data?: { number?: number } } };
    return BigInt(body.block_header?.raw_data?.number ?? 0);
  }

  async getBalance(address: string, tokenAddress?: string): Promise<string> {
    if (tokenAddress) {
      // TRC20 balanceOf — uses triggersmartcontract
      const res = await fetch(`${this.rpcUrl}/wallet/triggerconstantcontract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_address: address,
          contract_address: tokenAddress,
          function_selector: "balanceOf(address)",
          parameter: address.replace(/^0x/, "").padStart(64, "0"),
        }),
      });
      const body = (await res.json()) as { constant_result?: string[] };
      return BigInt(`0x${body.constant_result?.[0] ?? "0"}`).toString();
    }

    const res = await fetch(`${this.rpcUrl}/wallet/getaccount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const body = (await res.json()) as { balance?: number };
    return String(body.balance ?? 0);
  }

  async getTransaction(txHash: string): Promise<TransactionReceipt | null> {
    const res = await fetch(`${this.rpcUrl}/wallet/gettransactioninfobyid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: txHash }),
    });
    const body = (await res.json()) as { id?: string; receipt?: { result?: string }; blockNumber?: number };

    if (!body.id) return null;

    return {
      txHash,
      network: this.network,
      confirmed: body.receipt?.result === "SUCCESS",
      blockNumber: body.blockNumber ? BigInt(body.blockNumber) : undefined,
    };
  }
}

// ─── Solana Provider ──────────────────────────────────────────────────────────

/**
 * SolanaProvider — JSON-RPC provider for Solana.
 *
 * Uses the Solana JSON-RPC API directly (compatible with mainnet-beta,
 * devnet, and local validator).
 */
export class SolanaProvider implements BlockchainProvider {
  readonly network: BlockchainNetwork = "SOLANA";
  private readonly rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  async getBlockHeight(): Promise<bigint> {
    const result = await this._rpc<number>("getBlockHeight", []);
    return BigInt(result);
  }

  async getBalance(address: string, tokenAddress?: string): Promise<string> {
    if (tokenAddress) {
      const result = await this._rpc<{ value?: { amount?: string } }>(
        "getTokenAccountsByOwner",
        [address, { mint: tokenAddress }, { encoding: "jsonParsed" }]
      );
      return result.value?.amount ?? "0";
    }
    const result = await this._rpc<{ value?: number }>("getBalance", [address]);
    return String(result.value ?? 0);
  }

  async getTransaction(txHash: string): Promise<TransactionReceipt | null> {
    const result = await this._rpc<SolanaTransaction | null>("getTransaction", [
      txHash,
      { encoding: "json", commitment: "confirmed" },
    ]);
    if (!result) return null;

    return {
      txHash,
      network: this.network,
      confirmed: result.meta?.err === null,
      blockNumber: result.slot ? BigInt(result.slot) : undefined,
      blockTime: result.blockTime
        ? new Date(result.blockTime * 1000).toISOString()
        : undefined,
      fee: result.meta?.fee ? String(result.meta.fee) : undefined,
    };
  }

  private async _rpc<T>(method: string, params: unknown[]): Promise<T> {
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const body = (await res.json()) as { result?: T; error?: { message: string } };
    if (body.error) throw new Error(`[SolanaProvider] RPC error: ${body.error.message}`);
    return body.result as T;
  }
}

interface SolanaTransaction {
  slot?: number;
  blockTime?: number;
  meta?: { err: unknown; fee?: number };
}

// ─── TON Provider ─────────────────────────────────────────────────────────────

/**
 * TONProvider — HTTP API provider for The Open Network (TON).
 *
 * Uses the TON HTTP API v2 (`ton.access.orbs.network` or custom endpoint).
 */
export class TONProvider implements BlockchainProvider {
  readonly network: BlockchainNetwork = "TON";
  private readonly rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl.replace(/\/$/, "");
  }

  async getBlockHeight(): Promise<bigint> {
    const res = await fetch(`${this.rpcUrl}/getLastBlock`);
    const body = (await res.json()) as { result?: { last?: { seqno?: number } } };
    return BigInt(body.result?.last?.seqno ?? 0);
  }

  async getBalance(address: string): Promise<string> {
    const res = await fetch(
      `${this.rpcUrl}/getAddressBalance?address=${encodeURIComponent(address)}`
    );
    const body = (await res.json()) as { result?: string };
    return body.result ?? "0";
  }

  async getTransaction(txHash: string): Promise<TransactionReceipt | null> {
    const res = await fetch(
      `${this.rpcUrl}/getTransactions?address=&limit=1&hash=${encodeURIComponent(txHash)}`
    );
    const body = (await res.json()) as { result?: TONTransaction[] };
    const tx = body.result?.[0];
    if (!tx) return null;

    return {
      txHash,
      network: this.network,
      confirmed: !tx.out_msgs?.some((m) => m.error),
      blockTime: tx.utime ? new Date(tx.utime * 1000).toISOString() : undefined,
      fee: tx.fee ? String(tx.fee) : undefined,
    };
  }
}

interface TONTransaction {
  utime?: number;
  fee?: number;
  out_msgs?: Array<{ error?: unknown }>;
}
