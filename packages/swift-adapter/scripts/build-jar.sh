#!/usr/bin/env bash
# ─── scripts/build-jar.sh ────────────────────────────────────────────────────
# Compiles any Java source files inside the vendor sdk-code-generator and
# packages them into runnable JARs.  Only needed if you extend the generated
# stubs from the SWIFT SDK code generator.
#
# Prerequisites: JDK ≥ 17 on PATH, Apache Maven (optional)
#
# Usage:
#   bash packages/swift-adapter/scripts/build-jar.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENDOR_DIR="$SCRIPT_DIR/../vendor"
SDK_DIR="$VENDOR_DIR/swift-sdk-2.17.10-6"
CODE_GEN_DIR="$SDK_DIR/sdk-code-generator"

echo ">>> [swift-adapter] Building vendor JARs..."

if ! command -v java &>/dev/null; then
  echo "  [ERROR] 'java' not found on PATH. Install JDK ≥ 17 before running this script."
  exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F'"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
  echo "  [ERROR] JDK ≥ 17 required (found $JAVA_VERSION). Please upgrade."
  exit 1
fi

if [ -d "$CODE_GEN_DIR" ] && find "$CODE_GEN_DIR" -name "*.java" -maxdepth 5 | grep -q .; then
  echo "  → Compiling Java sources in $CODE_GEN_DIR"
  COMPILED_DIR="$CODE_GEN_DIR/build/classes"
  mkdir -p "$COMPILED_DIR"

  # Collect all .java files
  JAVA_FILES=$(find "$CODE_GEN_DIR" -name "*.java")
  # shellcheck disable=SC2086
  javac -d "$COMPILED_DIR" -cp "$SDK_DIR/lib/*" $JAVA_FILES

  OUTPUT_JAR="$SDK_DIR/lib/swift-codegen-custom.jar"
  jar --create --file="$OUTPUT_JAR" -C "$COMPILED_DIR" .
  echo "  → Built: $OUTPUT_JAR"
else
  echo "  [INFO] No Java sources found in code generator — nothing to build."
fi

echo ">>> [swift-adapter] JAR build complete."
