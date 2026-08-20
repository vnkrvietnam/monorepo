import Fastify from "fastify";
import { getPool, closePool, insertOTCQuote } from "@vnkrvietnam/db";

const app = Fastify({ logger: true });

// ─── DB readiness probe ───────────────────────────────────────────────────────
async function dbReady(): Promise<boolean> {
  try {
    await getPool().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface OTCQuoteRequest {
  tokenIn:          string;
  tokenOut:         string;
  amountIn:         string; // bigint as string
  counterparty:     string;
  requesterWallet?: string;
}

interface OTCQuoteResponse {
  quoteId:   string;
  amountOut: string;
  price:     number;
  expiresAt: string;
}

/**
 * POST /otc/quote
 * Request a firm OTC quote from institutional liquidity providers,
 * then persist the quote to the database.
 */
app.post<{ Body: OTCQuoteRequest; Reply: OTCQuoteResponse }>(
  "/otc/quote",
  async (req) => {
    const { tokenIn, tokenOut, amountIn, counterparty, requesterWallet } = req.body;
    app.log.info({ tokenIn, tokenOut, amountIn, counterparty }, "[otc] Quote requested");

    // TODO: query institutional LP APIs (VARA-licensed), apply ISO 20022 routing
    const quoteId   = `OTC-${Date.now()}`;
    const amountOut = (BigInt(amountIn) * 997n / 1000n).toString();
    const price     = 0.997;
    const expiresAt = new Date(Date.now() + 30_000).toISOString();

    // Persist quote to DB (non-blocking on failure — don't reject client)
    try {
      await insertOTCQuote({
        quoteId,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        price,
        requesterWallet: requesterWallet ?? counterparty,
      });
    } catch (err) {
      app.log.error({ err }, "[otc] Failed to persist quote to DB");
    }

    return { quoteId, amountOut, price, expiresAt };
  }
);

/**
 * GET /health
 */
app.get("/health", async () => ({
  status: "ok",
  service: "otc-liquidity-engine",
  db: await dbReady(),
}));

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
for (const sig of signals) {
  process.on(sig, async () => {
    app.log.info(`[otc] Received ${sig}, shutting down…`);
    await app.close();
    await closePool();
    process.exit(0);
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await app.listen({ port: 4002, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
