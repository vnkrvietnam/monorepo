/**
 * JSON-RPC 2.0 Router — Blockchain Node Proxy
 * POST /api/v1/rpc  (and /api/v2/rpc)
 *
 * Supported methods (mirrors Ethereum/Solana compatible subset):
 *   eth_blockNumber          — latest EVM block height
 *   eth_getBalance           — EVM account balance
 *   eth_call                 — read-only smart-contract call
 *   eth_sendRawTransaction   — broadcast signed EVM tx
 *   eth_getTransactionByHash — get EVM tx by hash
 *   eth_getTransactionReceipt
 *   net_version              — chain id (numeric string)
 *   web3_clientVersion       — node software version string
 *   sol_getBalance           — Solana account lamports
 *   sol_getTransaction       — Solana tx by signature
 *   sol_sendTransaction      — broadcast signed Solana tx
 */
import { Router } from "express";
import type { Request, Response } from "express";
import {
  type JsonRpcRequest,
  type JsonRpcResponse,
  JSON_RPC_ERRORS,
} from "@vnkrvietnam/types";
import { authenticate } from "../middlewares/auth.middleware.js";

export const rpcRouter = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rpcOk<T>(res: Response, id: JsonRpcRequest["id"], result: T): void {
  res.status(200).json({ jsonrpc: "2.0", id, result } satisfies JsonRpcResponse<T>);
}

function rpcErr(res: Response, id: JsonRpcRequest["id"], error: { code: number; message: string }, data?: unknown): void {
  res.status(200).json({ // JSON-RPC always returns HTTP 200; error is in body
    jsonrpc: "2.0",
    id,
    error: { ...error, ...(data !== undefined ? { data } : {}) },
  } satisfies JsonRpcResponse<never>);
}

// ─── Supported method registry ────────────────────────────────────────────────
//
// Each handler receives (params, req) and returns a value or throws.
// Actual node forwarding is a TODO — stubs return deterministic dev values.

type RpcHandler = (params: unknown, req: Request) => Promise<unknown> | unknown;

const METHODS: Record<string, RpcHandler> = {
  // ── EVM / Ethereum-compatible ────────────────────────────────────────────
  eth_blockNumber: () => "0x" + (12_000_000).toString(16),

  eth_getBalance: (params) => {
    const [address] = params as [string, string?];
    if (!address) throw JSON_RPC_ERRORS.INVALID_PARAMS;
    // TODO: proxy to EVM RPC (VNKR_EVM_RPC)
    return "0x" + (1_000_000_000_000_000_000n).toString(16);
  },

  eth_call: (params) => {
    const [tx] = params as [{ to?: string; data?: string }, string?];
    if (!tx?.to) throw JSON_RPC_ERRORS.INVALID_PARAMS;
    // TODO: proxy to EVM RPC
    return "0x";
  },

  eth_sendRawTransaction: (params) => {
    const [signedTx] = params as [string];
    if (!signedTx) throw JSON_RPC_ERRORS.INVALID_PARAMS;
    // TODO: broadcast via Tatum / direct RPC node
    return "0x" + Buffer.from(signedTx.slice(2, 34), "hex").toString("hex");
  },

  eth_getTransactionByHash: (params) => {
    const [hash] = params as [string];
    if (!hash) throw JSON_RPC_ERRORS.INVALID_PARAMS;
    // TODO: fetch from node or indexed DB
    return null; // null = tx not found (standard behaviour)
  },

  eth_getTransactionReceipt: (params) => {
    const [hash] = params as [string];
    if (!hash) throw JSON_RPC_ERRORS.INVALID_PARAMS;
    return null;
  },

  net_version: () => process.env.CHAIN_ID ?? "1",

  web3_clientVersion: () => "VNKR/1.0.0/linux/node",

  // ── Solana-compatible ────────────────────────────────────────────────────
  sol_getBalance: (params) => {
    const [address] = params as [string];
    if (!address) throw JSON_RPC_ERRORS.INVALID_PARAMS;
    // TODO: proxy to Solana RPC (SOL_RPC_URL)
    return { value: 1_000_000_000, context: { slot: 300_000_000 } };
  },

  sol_getTransaction: (params) => {
    const [signature] = params as [string];
    if (!signature) throw JSON_RPC_ERRORS.INVALID_PARAMS;
    return null;
  },

  sol_sendTransaction: (params) => {
    const [encodedTx] = params as [string];
    if (!encodedTx) throw JSON_RPC_ERRORS.INVALID_PARAMS;
    // TODO: forward to Solana RPC
    return "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLiSLiSLiSLiSLiSLiS";
  },
};

// ─── Single endpoint — handles both individual and batch requests ─────────────

rpcRouter.post(
  "/",
  authenticate,          // all RPC calls require a valid JWT
  async (req: Request, res: Response) => {
    const body = req.body as JsonRpcRequest | JsonRpcRequest[];

    // ── Batch request ──────────────────────────────────────────────────────
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return rpcErr(res, null, JSON_RPC_ERRORS.INVALID_REQUEST);
      }
      const results = await Promise.all(body.map((item) => handleSingle(item, req)));
      return res.status(200).json(results);
    }

    // ── Single request ─────────────────────────────────────────────────────
    return handleSingleHttp(body, req, res);
  },
);

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function handleSingle(item: JsonRpcRequest, req: Request): Promise<JsonRpcResponse> {
  if (item.jsonrpc !== "2.0" || !item.method) {
    return { jsonrpc: "2.0", id: item.id ?? null, error: JSON_RPC_ERRORS.INVALID_REQUEST };
  }

  const handler = METHODS[item.method];
  if (!handler) {
    return { jsonrpc: "2.0", id: item.id, error: JSON_RPC_ERRORS.METHOD_NOT_FOUND };
  }

  try {
    const result = await handler(item.params ?? [], req);
    return { jsonrpc: "2.0", id: item.id, result };
  } catch (err: unknown) {
    const known = err as { code?: number; message?: string };
    if (known?.code !== undefined) {
      return { jsonrpc: "2.0", id: item.id, error: { code: known.code, message: known.message ?? "Error" } };
    }
    console.error("[rpc] Unhandled error:", err);
    return { jsonrpc: "2.0", id: item.id, error: JSON_RPC_ERRORS.INTERNAL_ERROR };
  }
}

function handleSingleHttp(item: JsonRpcRequest, req: Request, res: Response): void {
  if (item.jsonrpc !== "2.0" || !item.method) {
    rpcErr(res, item.id ?? null, JSON_RPC_ERRORS.INVALID_REQUEST);
    return;
  }

  const handler = METHODS[item.method];
  if (!handler) {
    rpcErr(res, item.id, JSON_RPC_ERRORS.METHOD_NOT_FOUND);
    return;
  }

  Promise.resolve()
    .then(() => handler(item.params ?? [], req))
    .then((result) => rpcOk(res, item.id, result))
    .catch((err: unknown) => {
      const known = err as { code?: number; message?: string };
      if (known?.code !== undefined) {
        rpcErr(res, item.id, { code: known.code, message: known.message ?? "Error" });
      } else {
        console.error("[rpc] Unhandled error:", err);
        rpcErr(res, item.id, JSON_RPC_ERRORS.INTERNAL_ERROR);
      }
    });
}
