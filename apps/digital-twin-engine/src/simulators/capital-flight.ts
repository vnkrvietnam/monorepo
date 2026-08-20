import { ethers } from "ethers";

export interface CapitalFlightParams {
  tvlUsd: number;
  velocityThreshold: number;
  windowSeconds: number;
}

export interface CapitalFlightResult {
  triggered: boolean;
  outflowRate: number;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Simulates capital flight scenario based on TVL velocity.
 */
export function simulateCapitalFlight(params: CapitalFlightParams): CapitalFlightResult {
  const { tvlUsd, velocityThreshold, windowSeconds } = params;
  const outflowRate = tvlUsd / windowSeconds;
  const triggered = outflowRate > velocityThreshold;
  let severity: CapitalFlightResult["severity"] = "low";
  if (triggered) {
    const ratio = outflowRate / velocityThreshold;
    if (ratio > 5) severity = "critical";
    else if (ratio > 2) severity = "high";
    else severity = "medium";
  }
  return { triggered, outflowRate, severity };
}
