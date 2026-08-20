import Fastify from "fastify";
import { createPublicClient, http, parseAbiItem, type Log } from "viem";
import { APPCHAIN_RPC_MAINNET, EVM_CONTRACTS } from "@vnkrvietnam/config";
import type { ReserveSnapshot, SubgraphSwapEvent } from "@vnkrvietnam/types";
import {
  getPool,
  closePool,
  insertReserveSnapshot,
  insertSwapEvent,
} from "@vnkrvietnam/db";

// ─── Fastify HTTP server (health + manual triggers) ───────────────────────────
const app = Fastify({ logger: true });

app.get("/health", async () => ({
  status: "ok",
  service: "indexer-subgraph",
  db: await dbReady(),
}));

async function dbReady(): Promise<boolean> {
  try {
    await getPool().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

// ─── EVM client for App-Chain Genesis ────────────────────────────────────────

const client = createPublicClient({
  transport: http(APPCHAIN_RPC_MAINNET),
});

// ─── Watch Proof-of-Reserve events ───────────────────────────────────────────

const RESERVE_UPDATED_ABI = parseAbiItem(
  "event ReserveUpdated(uint256 totalReserveUsd, uint256 axvnCirculatingSupply, uint256 backingRatio)"
);

// ABI for DEX swap events (generic; adjust to the actual contract ABI)
const SWAP_ABI = parseAbiItem(
  "event Swap(address indexed trader, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)"
);

export async function watchReserveEvents(
  onSnapshot: (s: ReserveSnapshot) => Promise<void>
): Promise<void> {
  app.log.info("[indexer] Watching ReserveUpdated events on App-Chain Genesis…");

  client.watchEvent({
    address:  EVM_CONTRACTS.PROOF_RESERVE as `0x${string}`,
    event:    RESERVE_UPDATED_ABI,
    onLogs:   async (logs: Log[]) => {
      for (const log of logs) {
        const args = (log as any).args;
        const snapshot: ReserveSnapshot = {
          timestamp:             new Date().toISOString(),
          totalReserveUsd:       Number(args.totalReserveUsd) / 1e6,
          axvnCirculatingSupply: BigInt(args.axvnCirculatingSupply),
          backingRatio:          Number(args.backingRatio) / 1e6,
        };
        await onSnapshot(snapshot);
      }
    },
  });
}

export async function watchSwapEvents(
  onSwap: (e: SubgraphSwapEvent) => Promise<void>
): Promise<void> {
  app.log.info("[indexer] Watching Swap events on App-Chain Genesis…");

  client.watchEvent({
    event:  SWAP_ABI,
    onLogs: async (logs: Log[]) => {
      for (const log of logs) {
        const args = (log as any).args;
        const event: SubgraphSwapEvent = {
          txHash:      log.transactionHash ?? "",
          blockNumber: Number(log.blockNumber ?? 0),
          tokenIn:     args.tokenIn,
          tokenOut:    args.tokenOut,
          amountIn:    BigInt(args.amountIn),
          amountOut:   BigInt(args.amountOut),
          trader:      args.trader,
        };
        await onSwap(event);
      }
    },
  });
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
for (const sig of signals) {
  process.on(sig, async () => {
    app.log.info(`[indexer] Received ${sig}, shutting down…`);
    await app.close();
    await closePool();
    process.exit(0);
  });
}

// ─── Entry ────────────────────────────────────────────────────────────────────

if (require.main === module) {
  (async () => {
    // Start HTTP server
    try {
      await app.listen({ port: 4003, host: "0.0.0.0" });
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }

    // Start event watchers — each snapshot/swap is persisted to PostgreSQL.
    await watchReserveEvents(async (snapshot) => {
      app.log.info(
        { backingRatio: snapshot.backingRatio, usd: snapshot.totalReserveUsd },
        "[indexer] ReserveUpdated"
      );
      try {
        await insertReserveSnapshot(snapshot);
      } catch (err) {
        app.log.error({ err }, "[indexer] Failed to persist reserve snapshot");
      }
    });

    await watchSwapEvents(async (event) => {
      app.log.info(
        { txHash: event.txHash, trader: event.trader },
        "[indexer] Swap event"
      );
      try {
        await insertSwapEvent({ ...event, chain: "evm" });
      } catch (err) {
        app.log.error({ err }, "[indexer] Failed to persist swap event");
      }
    });
  })().catch((err) => {
    console.error("[indexer] Fatal startup error:", err);
    process.exit(1);
  });
}
