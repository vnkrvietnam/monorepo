#!/usr/bin/env bash
# ─── scripts/extract-swift-sdk.sh ─────────────────────────────────────────────
# Extracts the three SWIFT SDK ZIPs from TODO/ into their vendor directories.
# Run once after cloning, or whenever the ZIPs are updated.
#
# Usage:  bash scripts/extract-swift-sdk.sh [--zip-dir <path>]
#
# Default ZIP source: ./TODO/
set -euo pipefail

ZIP_DIR="${1:-./TODO}"

echo "📦 Extracting SWIFT SDKs from ${ZIP_DIR} …"

python3 - <<EOF
import zipfile, io, os, sys

pairs = [
    ("${ZIP_DIR}/swift-sdk-2.17.10-6.zip",          "swift-sdk-2.17.10-6.zip",
     "packages/swift-adapter/vendor/swift-sdk-2.17.10-6"),
    ("${ZIP_DIR}/swift-security-sdk-2.17.5-6.zip",  "swift-security-sdk-2.17.5-6.zip",
     "packages/swift-adapter/vendor/swift-security-sdk-2.17.5-6"),
    ("${ZIP_DIR}/swift-mgw-package-2.0.17-1.zip",   "swift-mgw-2.0.17-1.zip",
     "services/swift-gateway/vendor/swift-mgw-2.0.17-1"),
]

for outer_path, inner_name, dest in pairs:
    print(f"  → {outer_path}  ({inner_name})")
    outer = zipfile.ZipFile(outer_path)
    inner = zipfile.ZipFile(io.BytesIO(outer.read(inner_name)))
    os.makedirs(dest, exist_ok=True)
    inner.extractall(dest)
    print(f"     ✓  {len(inner.namelist())} entries  →  {dest}")

print("\n✅  All SWIFT SDK packages extracted successfully.")
EOF
