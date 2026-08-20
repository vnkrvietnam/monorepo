#!/usr/bin/env node
/**
 * provenance-verify.mjs — Verify NPM provenance attestation for published packages
 *
 * Requires: npm CLI v9+ and CI OIDC tokens
 * Usage: node scripts/provenance-verify.mjs
 */

import { execaCommand } from "execa";
import chalk from "chalk";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, "../../..");

const PUBLISHABLE = [
  "packages/core-sdk",
  "packages/merchant-sdk",
  "packages/swift-adapter",
  "packages/ui-kit",
  "packages/types",
  "packages/config",
];

async function main() {
  console.log(chalk.bold.cyan("\n🔐  NPM Provenance Attestation Verifier\n"));

  for (const pkgDir of PUBLISHABLE) {
    const meta = JSON.parse(await readFile(resolve(ROOT, pkgDir, "package.json"), "utf8"));
    const { name, version } = meta;

    process.stdout.write(chalk.white(`  Verifying ${chalk.bold(name)}@${version} … `));

    try {
      const { stdout } = await execaCommand(`npm audit signatures ${name}@${version}`, {
        reject: false,
        all:    true,
      });
      if (stdout.includes("verified")) {
        console.log(chalk.green("✓ verified"));
      } else if (stdout.includes("not found")) {
        console.log(chalk.yellow("⊘ not published"));
      } else {
        console.log(chalk.gray("— no attestation data"));
      }
    } catch (err) {
      console.log(chalk.red("✗ error: " + err?.message?.split("\n")[0]));
    }
  }

  console.log();
}

main().catch((err) => { console.error(err); process.exit(1); });
