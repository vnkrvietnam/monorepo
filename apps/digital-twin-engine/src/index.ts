import { SOLANA_RPC_MAINNET } from "@vnkrvietnam/config";

/**
 * VNKR Digital Twin Simulation Engine
 * [lab.vnkr.vn] — R&D Engine & Digital Twin Simulation (VNKR Digital Twin & AI Labs)
 *
 * Uses snarkjs for ZKP proof generation, @veramo/core for DID management,
 * and @iden3/js-iden3-core for Polygon ID attestation circuits.
 */

console.log("[digital-twin] VNKR Digital Twin Engine starting…");
console.log(`[digital-twin] Solana RPC: ${SOLANA_RPC_MAINNET}`);

// ─── Simulation tick ──────────────────────────────────────────────────────────

interface SimulationTick {
  ts:           number;
  blockNumber:  number;
  tvlUsd:       number;
  axvnSupply:   bigint;
  backingRatio: number;
}

function generateMockTick(block: number): SimulationTick {
  return {
    ts:           Date.now(),
    blockNumber:  block,
    tvlUsd:       1_000_000 + block * 12.5,
    axvnSupply:   BigInt(block) * 25_000_000_000_000_000_000n,
    backingRatio: 1.0 + (Math.random() * 0.05 - 0.025),
  };
}

let currentBlock = 1;
const interval = setInterval(() => {
  const tick = generateMockTick(currentBlock++);
  console.log(
    `[tick] block=${tick.blockNumber}  tvl=$${tick.tvlUsd.toLocaleString()}  ratio=${tick.backingRatio.toFixed(4)}`
  );
}, 5_000);

process.on("SIGTERM", () => { clearInterval(interval); process.exit(0); });
process.on("SIGINT",  () => { clearInterval(interval); process.exit(0); });
