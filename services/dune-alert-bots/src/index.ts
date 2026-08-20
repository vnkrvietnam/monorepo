import TelegramBot from "node-telegram-bot-api";
import axios from "axios";

const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN ?? "";
const ALERT_CHAT_ID    = process.env.TELEGRAM_ALERT_CHAT_ID ?? "";
const DUNE_API_KEY     = process.env.DUNE_API_KEY ?? "";
// Query IDs from https://dune.com/vnkr
const DUNE_RESERVE_QUERY = process.env.DUNE_RESERVE_QUERY_ID ?? "1234567";

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

/** Fetch latest result from Dune Analytics */
async function fetchDuneResult(queryId: string): Promise<Record<string, unknown>[]> {
  const { data } = await axios.get(
    `https://api.dune.com/api/v1/query/${queryId}/results`,
    { headers: { "x-dune-api-key": DUNE_API_KEY } }
  );
  return data?.result?.rows ?? [];
}

/** Send a reserve health alert to the Telegram channel */
async function sendReserveAlert(): Promise<void> {
  try {
    const rows = await fetchDuneResult(DUNE_RESERVE_QUERY);
    if (!rows.length) return;

    const latest = rows[0] as { total_reserve_usd: number; backing_ratio: number };
    const msg = [
      "📊 *VNKR Reserve Alert*",
      `Total Reserve: $${latest.total_reserve_usd?.toLocaleString() ?? "N/A"}`,
      `Backing Ratio: ${((latest.backing_ratio ?? 0) * 100).toFixed(2)}%`,
      `_Updated: ${new Date().toUTCString()}_`,
    ].join("\n");

    await bot.sendMessage(ALERT_CHAT_ID, msg, { parse_mode: "Markdown" });
    console.log("[dune-alert] Reserve alert sent.");
  } catch (err) {
    console.error("[dune-alert] Error:", err);
  }
}

// ─── Scheduler: run every 15 minutes ─────────────────────────────────────────
const INTERVAL_MS = 15 * 60 * 1000;
console.log(`[dune-alert] Starting — interval ${INTERVAL_MS / 1000}s`);
sendReserveAlert();
setInterval(sendReserveAlert, INTERVAL_MS);
