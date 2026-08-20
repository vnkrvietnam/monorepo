#!/usr/bin/env bash
# ─── scripts/install-vendor.sh ───────────────────────────────────────────────
# Runs the official SWIFT SDK install scripts from the vendor bundle.
# Must be executed once after cloning the repository on a machine that
# has Java ≥ 17 and bash available.
#
# Usage:
#   bash packages/swift-adapter/scripts/install-vendor.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENDOR_DIR="$SCRIPT_DIR/../vendor"

SDK_DIR="$VENDOR_DIR/swift-sdk-2.17.10-6"
SECURITY_SDK_DIR="$VENDOR_DIR/swift-security-sdk-2.17.5-6"

echo ">>> [swift-adapter] Installing SWIFT SDK vendor bundles..."

# ── swift-sdk ─────────────────────────────────────────────────────────────────
if [ -f "$SDK_DIR/install.sh" ]; then
  echo "  → Running swift-sdk install.sh"
  chmod +x "$SDK_DIR/install.sh"
  bash "$SDK_DIR/install.sh"
else
  echo "  [WARN] $SDK_DIR/install.sh not found — skipping swift-sdk install"
fi

# ── swift-security-sdk ────────────────────────────────────────────────────────
if [ -f "$SECURITY_SDK_DIR/install.sh" ]; then
  echo "  → Running swift-security-sdk install.sh"
  chmod +x "$SECURITY_SDK_DIR/install.sh"
  bash "$SECURITY_SDK_DIR/install.sh"
else
  echo "  [WARN] $SECURITY_SDK_DIR/install.sh not found — skipping swift-security-sdk install"
fi

echo ">>> [swift-adapter] Vendor install complete."
