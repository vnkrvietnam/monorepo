export interface Transaction {
  hash: string;
  from: string;
  to: string;
  valueUsd: number;
  timestamp: number;
}

export interface AMLResult {
  flagged: boolean;
  riskScore: number;   // 0-100
  reasons: string[];
}

const HIGH_VALUE_THRESHOLD_USD = 10_000;
const VELOCITY_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Lightweight AML rule-based analyzer.
 * For production use, integrate with a dedicated AML/CFT service.
 */
export function analyzeTransaction(
  tx: Transaction,
  history: Transaction[]
): AMLResult {
  const reasons: string[] = [];
  let riskScore = 0;

  // Rule 1: High-value single transaction
  if (tx.valueUsd >= HIGH_VALUE_THRESHOLD_USD) {
    riskScore += 30;
    reasons.push(`High-value transaction: $${tx.valueUsd.toFixed(2)}`);
  }

  // Rule 2: Velocity — many transactions in 1h window
  const windowStart = tx.timestamp - VELOCITY_WINDOW_MS;
  const recentTxs = history.filter(
    (h) => h.from === tx.from && h.timestamp >= windowStart
  );
  if (recentTxs.length > 10) {
    riskScore += 40;
    reasons.push(`High velocity: ${recentTxs.length} txs in last hour from ${tx.from}`);
  }

  // Rule 3: Round-number structuring
  if (tx.valueUsd % 1000 === 0 && tx.valueUsd >= 5000) {
    riskScore += 15;
    reasons.push("Possible structuring: round-number amount.");
  }

  return {
    flagged: riskScore >= 40,
    riskScore: Math.min(100, riskScore),
    reasons,
  };
}
