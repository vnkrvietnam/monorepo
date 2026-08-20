export interface RBSParams {
  collateralRatio: number;       // e.g. 1.5 = 150%
  pegDeviation: number;          // absolute VNKR/USD deviation
  liquidityDepthUsd: number;
}

export interface RBSResult {
  stable: boolean;
  stabilityScore: number;        // 0-100
  recommendations: string[];
}

/**
 * Rule-Based Stability simulator for the VNKR peg mechanism.
 */
export function simulateRBSStability(params: RBSParams): RBSResult {
  const { collateralRatio, pegDeviation, liquidityDepthUsd } = params;
  const recommendations: string[] = [];

  let score = 100;

  if (collateralRatio < 1.2) {
    score -= 40;
    recommendations.push("Increase collateral ratio — below 120% minimum.");
  } else if (collateralRatio < 1.5) {
    score -= 15;
    recommendations.push("Collateral ratio below 150% target; consider top-up.");
  }

  if (pegDeviation > 0.05) {
    score -= 30;
    recommendations.push("Peg deviation > 5% — trigger rebalance operation.");
  } else if (pegDeviation > 0.02) {
    score -= 10;
    recommendations.push("Peg deviation > 2% — monitor closely.");
  }

  if (liquidityDepthUsd < 500_000) {
    score -= 20;
    recommendations.push("Liquidity depth below $500K — add LP incentives.");
  }

  return {
    stable: score >= 60,
    stabilityScore: Math.max(0, score),
    recommendations,
  };
}
