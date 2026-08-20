/**
 * WebSocket Gateway
 * PORT=5001 — standardised message envelope for all channels:
 *
 *  Channel                  | Direction       | Auth?
 *  ─────────────────────────|─────────────────|───────
 *  ticker@public            | server → client | no
 *  orderbook@<SYMBOL>       | server → client | no
 *  user@trades              | server → client | yes
 *  notifications@user       | server → client | yes
 *
 * Client → Server messages (subscribe / unsubscribe / ping):
 *  { type: "subscribe",   channel: "orderbook@BTCUSDT", id?: "req-1" }
 *  { type: "unsubscribe", channel: "orderbook@BTCUSDT" }
 *  { type: "ping",        id?: "req-2" }
 *
 * Server → Client messages use WSEnvelope<T>:
 *  { type, channel?, data?, ts, id? }
 */
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { verifyAccessToken } from "../lib/jwt.js";
import type {
  WSTicker,
  WSOrderBook,
  WSUserTrade,
  WSNotification,
  WSEnvelope,
  WSSubscribeMessage,
} from "@vnkrvietnam/types";

const WS_PORT        = Number(process.env.WEBSOCKET_PORT) || 5001;
const PING_INTERVAL  = Number(process.env.WS_PING_INTERVAL_MS)  || 30_000;
const PONG_TIMEOUT   = Number(process.env.WS_PONG_TIMEOUT_MS)   || 10_000;

const server = http.createServer();
const wss    = new WebSocketServer({ server });

// ─── Client registry ─────────────────────────────────────────────────────────
// userId → Set of WebSocket connections
const userSockets   = new Map<string, Set<WebSocket>>();
// symbol → Set of WebSocket connections
const marketSockets = new Map<string, Set<WebSocket>>();
// All connections subscribed to public ticker
const publicSockets = new Set<WebSocket>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function envelope<T>(type: WSEnvelope["type"], data?: T, channel?: string, id?: string): WSEnvelope<T> {
  return { type, ...(channel ? { channel } : {}), ...(data !== undefined ? { data } : {}), ts: Date.now(), ...(id ? { id } : {}) };
}

function send(ws: WebSocket, payload: WSEnvelope): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function broadcast(sockets: Set<WebSocket>, payload: WSEnvelope): void {
  const msg = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

function addToRoom(map: Map<string, Set<WebSocket>>, key: string, ws: WebSocket): void {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(ws);
}

function removeFromRoom(map: Map<string, Set<WebSocket>>, key: string, ws: WebSocket): void {
  map.get(key)?.delete(ws);
  if (map.get(key)?.size === 0) map.delete(key);
}

// ─── Connection handler ───────────────────────────────────────────────────────

wss.on("connection", (ws, req) => {
  const url   = new URL(req.url ?? "/", `ws://localhost:${WS_PORT}`);
  const token = url.searchParams.get("token");
  const sym   = url.searchParams.get("market");  // e.g. BTCUSDT (optional shortcut)

  let userId: string | null = null;

  // Authenticate if token provided
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      userId = payload.sub;
    } catch {
      ws.close(4001, "Invalid token");
      return;
    }
  }

  // Default subscriptions based on query params
  publicSockets.add(ws);

  if (sym) {
    addToRoom(marketSockets, sym, ws);
  }

  if (userId) {
    addToRoom(userSockets, userId, ws);
  }

  // ── Ping / pong heartbeat ────────────────────────────────────────────────
  let isAlive = true;
  let pongTimer: ReturnType<typeof setTimeout> | null = null;

  const heartbeat = setInterval(() => {
    if (!isAlive) {
      // Client didn't respond in time — terminate
      ws.terminate();
      return;
    }
    isAlive = false;
    send(ws, envelope("ping"));
    pongTimer = setTimeout(() => {
      if (!isAlive) ws.terminate();
    }, PONG_TIMEOUT);
  }, PING_INTERVAL);

  ws.on("pong", () => {
    // native WS pong (ws library)
    isAlive = true;
    if (pongTimer) { clearTimeout(pongTimer); pongTimer = null; }
  });

  // ── Inbound messages from client ──────────────────────────────────────────
  ws.on("message", (raw) => {
    let msg: WSSubscribeMessage & { type: string };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, envelope("error", { code: 4000, message: "Malformed JSON" }));
      return;
    }

    switch (msg.type) {
      case "ping": {
        // Application-level ping (for environments that strip native WS frames)
        isAlive = true;
        if (pongTimer) { clearTimeout(pongTimer); pongTimer = null; }
        send(ws, { type: "pong", ts: Date.now(), ...(msg.id ? { id: msg.id } : {}) });
        break;
      }

      case "subscribe": {
        if (!msg.channel) {
          send(ws, envelope("error", { code: 4001, message: "channel required" }, undefined, msg.id));
          return;
        }

        // Private channels require an authenticated connection
        if ((msg.channel === "user@trades" || msg.channel === "notifications@user") && !userId) {
          // Check if token sent in subscribe message
          if (msg.token) {
            try {
              const payload = verifyAccessToken(msg.token);
              userId = payload.sub;
              addToRoom(userSockets, userId, ws);
            } catch {
              send(ws, envelope("error", { code: 4001, message: "Invalid token" }, undefined, msg.id));
              return;
            }
          } else {
            send(ws, envelope("error", { code: 4003, message: "Authentication required" }, undefined, msg.id));
            return;
          }
        }

        // Dynamic orderbook subscription
        if (msg.channel.startsWith("orderbook@")) {
          const symbol = msg.channel.split("@")[1];
          if (symbol) addToRoom(marketSockets, symbol, ws);
        }

        // Ack
        send(ws, { type: "subscribed", channel: msg.channel, ts: Date.now(), ...(msg.id ? { id: msg.id } : {}) });
        break;
      }

      case "unsubscribe": {
        if (!msg.channel) return;

        if (msg.channel.startsWith("orderbook@")) {
          const symbol = msg.channel.split("@")[1];
          if (symbol) removeFromRoom(marketSockets, symbol, ws);
        }

        send(ws, { type: "unsubscribed", channel: msg.channel, ts: Date.now(), ...(msg.id ? { id: msg.id } : {}) });
        break;
      }

      default:
        send(ws, envelope("error", { code: 4002, message: `Unknown message type: ${msg.type}` }));
    }
  });

  ws.on("close", () => {
    clearInterval(heartbeat);
    if (pongTimer) clearTimeout(pongTimer);
    publicSockets.delete(ws);
    if (sym)    removeFromRoom(marketSockets, sym, ws);
    if (userId) removeFromRoom(userSockets, userId, ws);
  });

  ws.on("error", (err) => {
    console.error("[ws] Socket error:", err.message);
  });

  // Welcome frame
  send(ws, envelope("connected", {
    subscriptions: [
      "ticker@public",
      ...(sym ? [`orderbook@${sym}`] : []),
      ...(userId ? ["user@trades", "notifications@user"] : []),
    ],
  }));
});

// ─── Public API — push events from other services ────────────────────────────

export function pushTicker(data: WSTicker): void {
  broadcast(publicSockets, { type: "ticker", channel: "ticker@public", data, ts: Date.now() });
}

export function pushOrderBook(symbol: string, data: WSOrderBook): void {
  const sockets = marketSockets.get(symbol);
  if (sockets) broadcast(sockets, { type: "orderbook", channel: `orderbook@${symbol}`, data, ts: Date.now() });
}

export function pushUserTrade(userId: string, data: WSUserTrade): void {
  const sockets = userSockets.get(userId);
  if (sockets) broadcast(sockets, { type: "trade", channel: "user@trades", data, ts: Date.now() });
}

export function pushNotification(userId: string, data: WSNotification): void {
  const sockets = userSockets.get(userId);
  if (sockets) broadcast(sockets, { type: "notification", channel: "notifications@user", data, ts: Date.now() });
}

// ─── Ticker Simulator (dev only) ─────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
  const prices: Record<string, number> = { BTCUSDT: 67420, ETHUSDT: 3420, SOLUSDT: 148 };
  setInterval(() => {
    for (const sym of SYMBOLS) {
      const delta = (Math.random() - 0.5) * 10;
      prices[sym] = Math.max(1, prices[sym] + delta);
      pushTicker({
        channel:   "ticker@public",
        symbol:    sym,
        price:     prices[sym].toFixed(2),
        change:    delta.toFixed(2),
        volume:    (Math.random() * 100).toFixed(2),
        timestamp: Date.now(),
      });
    }
  }, 1000);
}

server.listen(WS_PORT, () => {
  console.log(`[ws-gateway] WebSocket server listening on port ${WS_PORT}`);
});
