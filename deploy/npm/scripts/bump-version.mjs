#!/usr/bin/env node
/**
 * bump-version.mjs — Bump version of all publishable @vnkr/* packages
 *
 * Usage:
 *   node scripts/bump-version.mjs patch   # 1.0.0 → 1.0.1
 *   node scripts/bump-version.mjs minor   # 1.0.0 → 1.1.0
 *   node scripts/bump-version.mjs major   # 1.0.0 → 2.0.0
 */

import semver from "semver";
import chalk from "chalk";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, "../../..");

const RELEASE_TYPE = process.argv[2];
if (!["patch", "minor", "major"].includes(RELEASE_TYPE ?? "")) {
  console.error("Usage: node bump-version.mjs <patch|minor|major>");
  process.exit(1);
}

const PUBLISHABLE = [
  "packages/core-sdk",
  "packages/merchant-sdk",
  "packages/swift-adapter",
  "packages/ui-kit",
  "packages/types",
  "packages/config",
];

async function main() {
  console.log(chalk.bold.cyan(`\n🔖  Version Bump — ${RELEASE_TYPE?.toUpperCase()}\n`));

  for (const pkgDir of PUBLISHABLE) {
    const pkgJsonPath = resolve(ROOT, pkgDir, "package.json");
    const raw = await readFile(pkgJsonPath, "utf8");
    const meta = JSON.parse(raw);

    const oldVersion = meta.version;
    const newVersion = semver.inc(oldVersion, RELEASE_TYPE);

    if (!newVersion) {
      console.log(chalk.red(`  ✗ ${meta.name}: cannot bump ${oldVersion}`));
      continue;
    }

    meta.version = newVersion;
    await writeFile(pkgJsonPath, JSON.stringify(meta, null, 2) + "\n");
    console.log(chalk.white(`  ${chalk.bold(meta.name)}: ${chalk.gray(oldVersion)} → ${chalk.green(newVersion)}`));
  }

  console.log(chalk.cyan("\n  ✅ Done. Run `pnpm install` to update lockfile.\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
