import { Pool, type PoolClient, type QueryResult } from "pg";
import type {
  FiatReceipt,
  P2POrder,
  ReserveSnapshot,
  SubgraphSwapEvent,
} from "@vnkrvietnam/types";

// ─── Pool singleton ───────────────────────────────────────────────────────────

let _pool: Pool | null = null;

/**
 * Returns the shared connection pool.
 * The pool is lazily created on first call using DATABASE_URL from env.
 * Call `closePool()` during graceful shutdown.
 */
export function getPool(): Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    _pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    _pool.on("error", (err) => {
      console.error("[db] Unexpected pool client error:", err.message);
    });
  }
  return _pool;
}

/**
 * Close the pool — call during process shutdown to drain connections cleanly.
 */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

// ─── Generic query helper ─────────────────────────────────────────────────────

/**
 * Execute a parameterised query and return all rows.
 * Uses a pool-checked-out client to guarantee schema search_path.
 */
export async function query<T extends object>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await getPool().query<T>(sql, params);
  return result.rows;
}

/**
 * Execute a query and return the first row, or `null` if no rows matched.
 */
export async function queryOne<T extends object>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Execute within an explicit transaction.
 * The callback receives the checked-out `PoolClient`; commit/rollback is
 * handled automatically based on whether the callback throws.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ─── payments.fiat_receipts ───────────────────────────────────────────────────

export interface FiatReceiptRow {
  receipt_id: string;
  order_id: string;
  bank_transaction_ref: string;
  amount: string;
  currency: string;
  bank_code: string | null;
  sender_account: string | null;
  sender_name: string | null;
  hmac_signature: string | null;
  hmac_verified: boolean;
  processed_at: Date | null;
  processing_error: string | null;
  confirmed_at: Date;
  created_at: Date;
}

/** Insert a fiat receipt row; returns the created row. */
export async function insertFiatReceipt(
  receipt: FiatReceipt & {
    bankCode?: string;
    senderAccount?: string;
    senderName?: string;
    hmacSignature?: string;
    hmacVerified?: boolean;
  }
): Promise<FiatReceiptRow> {
  const row = await queryOne<FiatReceiptRow>(
    `INSERT INTO payments.fiat_receipts
       (receipt_id, order_id, bank_transaction_ref, amount, currency,
        bank_code, sender_account, sender_name,
        hmac_signature, hmac_verified, confirmed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (receipt_id) DO NOTHING
     RETURNING *`,
    [
      receipt.receiptId,
      receipt.orderId,
      receipt.bankTransactionRef,
      receipt.amount,
      receipt.currency,
      receipt.bankCode ?? null,
      receipt.senderAccount ?? null,
      receipt.senderName ?? null,
      receipt.hmacSignature ?? null,
      receipt.hmacVerified ?? false,
      receipt.confirmedAt,
    ]
  );
  if (!row) {
    // Duplicate receipt — fetch the existing one.
    const existing = await queryOne<FiatReceiptRow>(
      `SELECT * FROM payments.fiat_receipts WHERE receipt_id = $1`,
      [receipt.receiptId]
    );
    return existing!;
  }
  return row;
}

// ─── payments.p2p_orders ──────────────────────────────────────────────────────

export interface P2POrderRow {
  order_id: string;
  side: string;
  status: string;
  token_mint: string;
  token_amount: string;
  fiat_amount: string;
  fiat_currency: string;
  seller_wallet: string;
  buyer_wallet: string | null;
  escrow_pda: string | null;
  payment_method: string | null;
  payment_ref: string | null;
  matched_at: Date | null;
  fiat_confirmed_at: Date | null;
  token_released_at: Date | null;
  cancelled_at: Date | null;
  cancel_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Find an open P2P order by order_id. */
export async function findP2POrder(
  orderId: string
): Promise<P2POrderRow | null> {
  return queryOne<P2POrderRow>(
    `SELECT * FROM payments.p2p_orders WHERE order_id = $1`,
    [orderId]
  );
}

/**
 * Transition a matched P2P order to FIAT_CONFIRMED and link the payment ref.
 * Returns the updated row.
 */
export async function confirmP2PFiatPayment(
  client: PoolClient,
  orderId: string,
  paymentRef: string
): Promise<P2POrderRow | null> {
  const result = await client.query<P2POrderRow>(
    `UPDATE payments.p2p_orders
        SET status           = 'FIAT_CONFIRMED',
            payment_ref      = $2,
            fiat_confirmed_at = now()
      WHERE order_id = $1
        AND status IN ('OPEN','MATCHED')
      RETURNING *`,
    [orderId, paymentRef]
  );
  return result.rows[0] ?? null;
}

// ─── otc.quotes ───────────────────────────────────────────────────────────────

export interface OTCQuoteRow {
  id: string;
  quote_id: string;
  counterparty_id: string | null;
  token_in: string;
  token_out: string;
  amount_in: string;
  amount_out: string | null;
  price: string | null;
  fee_bps: number | null;
  status: string;
  requester_wallet: string | null;
  settlement_tx_hash: string | null;
  expires_at: Date;
  accepted_at: Date | null;
  settled_at: Date | null;
  created_at: Date;
}

/** Persist an OTC quote; returns the created row. */
export async function insertOTCQuote(opts: {
  quoteId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  price: number;
  requesterWallet?: string;
  feeBps?: number;
}): Promise<OTCQuoteRow> {
  const row = await queryOne<OTCQuoteRow>(
    `INSERT INTO otc.quotes
       (quote_id, token_in, token_out, amount_in, amount_out,
        price, fee_bps, requester_wallet, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now() + INTERVAL '30 seconds')
     RETURNING *`,
    [
      opts.quoteId,
      opts.tokenIn,
      opts.tokenOut,
      opts.amountIn,
      opts.amountOut,
      opts.price,
      opts.feeBps ?? 30,
      opts.requesterWallet ?? null,
    ]
  );
  return row!;
}

// ─── treasury.reserve_snapshots ───────────────────────────────────────────────

export interface ReserveSnapshotRow {
  id: string;
  block_number: string | null;
  tx_hash: string | null;
  total_reserve_usd: string;
  axvn_circulating_supply: string;
  backing_ratio: string;
  source: string;
  snapshot_ts: Date;
  created_at: Date;
}

/** Persist a reserve snapshot emitted by the on-chain ProofOfReserve contract. */
export async function insertReserveSnapshot(
  snapshot: ReserveSnapshot & { blockNumber?: number; txHash?: string }
): Promise<ReserveSnapshotRow> {
  const row = await queryOne<ReserveSnapshotRow>(
    `INSERT INTO treasury.reserve_snapshots
       (block_number, tx_hash, total_reserve_usd,
        axvn_circulating_supply, backing_ratio, source, snapshot_ts)
     VALUES ($1,$2,$3,$4,$5,'on-chain',$6)
     RETURNING *`,
    [
      snapshot.blockNumber ?? null,
      snapshot.txHash ?? null,
      snapshot.totalReserveUsd,
      snapshot.axvnCirculatingSupply.toString(),
      snapshot.backingRatio,
      snapshot.timestamp,
    ]
  );
  return row!;
}

// ─── treasury.swap_events ─────────────────────────────────────────────────────

export interface SwapEventRow {
  id: string;
  tx_hash: string;
  block_number: string;
  log_index: number | null;
  token_in: string;
  token_out: string;
  amount_in: string;
  amount_out: string;
  trader: string;
  pool_address: string | null;
  price_impact_bps: number | null;
  fee_bps: number | null;
  chain: string;
  block_timestamp: Date | null;
  indexed_at: Date;
}

/** Persist a swap event; silently ignores duplicates (ON CONFLICT tx_hash). */
export async function insertSwapEvent(
  event: SubgraphSwapEvent & {
    logIndex?: number;
    poolAddress?: string;
    priceImpactBps?: number;
    feeBps?: number;
    chain?: "solana" | "evm" | "tron";
    blockTimestamp?: string;
  }
): Promise<SwapEventRow | null> {
  return queryOne<SwapEventRow>(
    `INSERT INTO treasury.swap_events
       (tx_hash, block_number, log_index, token_in, token_out,
        amount_in, amount_out, trader, pool_address,
        price_impact_bps, fee_bps, chain, block_timestamp)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (tx_hash) DO NOTHING
     RETURNING *`,
    [
      event.txHash,
      event.blockNumber,
      event.logIndex ?? null,
      event.tokenIn,
      event.tokenOut,
      event.amountIn.toString(),
      event.amountOut.toString(),
      event.trader,
      event.poolAddress ?? null,
      event.priceImpactBps ?? null,
      event.feeBps ?? null,
      event.chain ?? "evm",
      event.blockTimestamp ?? null,
    ]
  );
}

// ─── Re-exports ───────────────────────────────────────────────────────────────
export { type PoolClient } from "pg";
