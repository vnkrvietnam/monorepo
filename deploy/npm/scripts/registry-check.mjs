#!/usr/bin/env node
/**
 * registry-check.mjs — Compare local package versions against npmjs.com registry
 */

import semver from "semver";
import axios from "axios";
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

async function fetchRegistryVersion(name) {
  try {
    const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`;
    const { data } = await axios.get(url, { timeout: 8_000 });
    return data?.version ?? null;
  } catch {
    return null;
  }
}

async function main() {
  console.log(chalk.bold.cyan("\n🔍  Registry Version Check\n"));

  for (const pkgDir of PUBLISHABLE) {
    const pkgJsonPath = resolve(ROOT, pkgDir, "package.json");
    const meta = JSON.parse(await readFile(pkgJsonPath, "utf8"));
    const { name, version: local } = meta;

    process.stdout.write(chalk.white(`  ${chalk.bold(name)}: local=${chalk.yellow(local)} … `));

    const remote = await fetchRegistryVersion(name);

    if (!remote) {
      console.log(chalk.gray("not published yet"));
    } else if (local === remote) {
      console.log(chalk.green(`registry=${remote} ✓`));
    } else {
      const cmp = semver.compare(local, remote);
      if (cmp > 0) console.log(chalk.cyan(`registry=${remote} — local is AHEAD`));
      else         console.log(chalk.red(`registry=${remote} — local is BEHIND`));
    }
  }

  console.log();
}

main().catch((err) => { console.error(err); process.exit(1); });
