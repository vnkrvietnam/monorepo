#!/usr/bin/env node
/**
 * publish-all.mjs — Publish all @vnkr/* public packages to npmjs.com
 *
 * Usage:
 *   node scripts/publish-all.mjs           # real publish
 *   node scripts/publish-all.mjs --dry-run # simulate (no upload)
 */

import { execaCommand } from "execa";
import { globby } from "globby";
import chalk from "chalk";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, "../../..");

const DRY_RUN = process.argv.includes("--dry-run");

/** Packages to publish (relative to monorepo root) */
const PUBLISHABLE = [
  "packages/core-sdk",
  "packages/merchant-sdk",
  "packages/swift-adapter",
  "packages/ui-kit",
  "packages/types",
  "packages/config",
];

async function main() {
  console.log(chalk.bold.cyan("\n📦  VNKR NPM Publisher"));
  console.log(DRY_RUN ? chalk.yellow("⚠  DRY-RUN mode — no packages will be uploaded\n") : chalk.green("🚀  LIVE publish mode\n"));

  let published = 0;
  let skipped   = 0;
  let failed    = 0;

  for (const pkgDir of PUBLISHABLE) {
    const pkgJsonPath = resolve(ROOT, pkgDir, "package.json");
    let meta;

    try {
      meta = JSON.parse(await readFile(pkgJsonPath, "utf8"));
    } catch {
      console.log(chalk.red(`  ✗ Cannot read ${pkgJsonPath}`));
      failed++;
      continue;
    }

    const { name, version, private: isPrivate } = meta;

    if (isPrivate) {
      console.log(chalk.gray(`  ─ ${name} @ ${version} — PRIVATE, skipped`));
      skipped++;
      continue;
    }

    process.stdout.write(chalk.white(`  Publishing ${chalk.bold(name)} @ ${version} … `));

    try {
      const args = ["publish", "--access", "public"];
      if (DRY_RUN) args.push("--dry-run");

      await execaCommand(`pnpm ${args.join(" ")}`, {
        cwd: resolve(ROOT, pkgDir),
        env: { ...process.env },
      });

      console.log(chalk.green("✓"));
      published++;
    } catch (err) {
      const msg = err?.stderr ?? err?.message ?? String(err);
      if (msg.includes("You cannot publish over the previously published")) {
        console.log(chalk.yellow("⊘ already published"));
        skipped++;
      } else {
        console.log(chalk.red("✗ FAILED"));
        console.error(chalk.red(`    ${msg.trim().split("\n")[0]}`));
        failed++;
      }
    }
  }

  console.log(`\n  Published: ${chalk.green(published)}  |  Skipped: ${chalk.yellow(skipped)}  |  Failed: ${chalk.red(failed)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
