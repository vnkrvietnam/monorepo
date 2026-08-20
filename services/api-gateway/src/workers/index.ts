/**
 * BullMQ Workers — Background job processors
 *  - deposit-worker   : Confirm crypto/fiat deposits
 *  - withdraw-worker  : Process withdrawal queue
 *  - compliance-worker: Scheduled NQ-05 & AML audit
 */
import { Worker, Queue, type Job } from "bullmq";
import type { CryptoDepositWebhook, VietQRWebhook } from "@vnkrvietnam/types";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Parse Redis URL for BullMQ connection
function redisConnection() {
  const url = new URL(REDIS_URL);
  return {
    host:     url.hostname,
    port:     Number(url.port) || 6379,
    password: url.password || undefined,
    db:       Number(url.pathname.slice(1)) || 0,
  };
}

const connection = redisConnection();

// ─── Queues ───────────────────────────────────────────────────────────────────
export const depositQueue    = new Queue("deposit",    { connection });
export const withdrawQueue   = new Queue("withdraw",   { connection });
export const complianceQueue = new Queue("compliance", { connection });

// ─── Deposit Worker ───────────────────────────────────────────────────────────
const depositWorker = new Worker(
  "deposit",
  async (job: Job) => {
    const { type, payload } = job.data as { type: "CRYPTO" | "FIAT"; payload: CryptoDepositWebhook | VietQRWebhook };
    console.log(`[deposit-worker] Processing job ${job.id} type=${type}`);

    if (type === "CRYPTO") {
      const event = payload as CryptoDepositWebhook;
      // TODO: verify confirmations >= threshold (6 for BTC, 12 for ETH, 32 for BNB)
      // TODO: credit user balance in DB atomically
      // TODO: push WebSocket notification to user
      console.log(`[deposit-worker] CRYPTO deposit confirmed: txHash=${event.txHash} amount=${event.amount} ${event.asset}`);
    }

    if (type === "FIAT") {
      const event = payload as VietQRWebhook;
      // TODO: parse description for orderId, credit VND balance, mark deposit order PAID
      // TODO: send receipt notification
      console.log(`[deposit-worker] FIAT deposit: transactionId=${event.transactionId} amount=${event.amount} VND`);
    }
  },
  { connection, concurrency: 10 }
);

// ─── Withdraw Worker ──────────────────────────────────────────────────────────
const withdrawWorker = new Worker(
  "withdraw",
  async (job: Job) => {
    const { withdrawId, type, userId } = job.data as { withdrawId: string; type: "CRYPTO" | "FIAT"; userId: string };
    console.log(`[withdraw-worker] Processing withdrawId=${withdrawId} type=${type}`);

    if (type === "CRYPTO") {
      // TODO: build & broadcast on-chain transaction (Tatum / custom node)
      // TODO: update withdrawal status to PROCESSING → SUCCESS/FAILED
      // TODO: notify user
    }

    if (type === "FIAT") {
      // TODO: call banking API / NAPAS for interbank transfer
      // TODO: update withdrawal status
      // TODO: notify user
    }
  },
  { connection, concurrency: 5 }
);

// ─── Compliance Worker ────────────────────────────────────────────────────────
const complianceWorker = new Worker(
  "compliance",
  async (job: Job) => {
    const { task } = job.data as { task: "NQ05_DAILY" | "AML_SCAN" | "ND284_AUDIT" };
    console.log(`[compliance-worker] Running task=${task}`);

    if (task === "NQ05_DAILY") {
      // TODO: aggregate yesterday's transactions, generate NQ-05 XML report, upload to S3
    }
    if (task === "AML_SCAN") {
      // TODO: scan flagged transactions, escalate HIGH/CRITICAL, send alert to compliance team
    }
    if (task === "ND284_AUDIT") {
      // TODO: rotate audit logs older than AUDIT_LOG_RETENTION_DAYS to cold storage
    }
  },
  { connection, concurrency: 2 }
);

// ─── Schedule recurring compliance jobs ──────────────────────────────────────
async function scheduleRecurringJobs() {
  // Daily NQ-05 report at 01:00 UTC
  await complianceQueue.add("NQ05_DAILY", { task: "NQ05_DAILY" }, {
    repeat: { pattern: "0 1 * * *" },
    removeOnComplete: 100,
    removeOnFail: 50,
  });

  // AML scan every 4 hours
  await complianceQueue.add("AML_SCAN", { task: "AML_SCAN" }, {
    repeat: { pattern: "0 */4 * * *" },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

// ─── Error handlers ───────────────────────────────────────────────────────────
for (const worker of [depositWorker, withdrawWorker, complianceWorker]) {
  worker.on("failed", (job, err) => {
    console.error(`[worker] Job ${job?.id} failed:`, err.message);
  });
  worker.on("completed", (job) => {
    console.log(`[worker] Job ${job.id} completed`);
  });
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
for (const sig of signals) {
  process.on(sig, async () => {
    console.log(`[workers] Received ${sig}, closing workers...`);
    await Promise.all([depositWorker.close(), withdrawWorker.close(), complianceWorker.close()]);
    process.exit(0);
  });
}

scheduleRecurringJobs().catch(console.error);
console.log("[workers] deposit-worker, withdraw-worker, compliance-worker started");
