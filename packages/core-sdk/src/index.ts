import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { createPublicClient, http, type Chain } from "viem";

// ─── Solana helpers ───────────────────────────────────────────────────────────

/**
 * Create an Anchor provider from a Solana RPC endpoint and a wallet.
 */
export function createAnchorProvider(
  endpoint: string,
  wallet: anchor.Wallet,
  opts?: anchor.web3.ConfirmOptions
): anchor.AnchorProvider {
  const connection = new Connection(endpoint, opts?.commitment ?? "confirmed");
  return new anchor.AnchorProvider(connection, wallet, opts ?? {});
}

/**
 * Load a deployed Anchor program by its IDL and Program ID.
 */
export function loadProgram<T extends anchor.Idl>(
  idl: T,
  programId: PublicKey,
  provider: anchor.AnchorProvider
): anchor.Program<T> {
  anchor.setProvider(provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (anchor.Program as any)(idl, provider) as anchor.Program<T>;
}

// ─── EVM helpers ─────────────────────────────────────────────────────────────

/**
 * Create a viem public client for an EVM-compatible chain (e.g. App-Chain Genesis).
 */
export function createEvmClient(rpcUrl: string, chain: Chain) {
  return createPublicClient({ chain, transport: http(rpcUrl) });
}

export { anchor, Connection, PublicKey, clusterApiUrl };
