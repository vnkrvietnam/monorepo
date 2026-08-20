import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ─── deploy-kernel.ts ─────────────────────────────────────────────────────────
// Deploy VNKRToken + Kernel, then save addresses to exports/addresses.json.
// Run: hardhat run scripts/deploy-kernel.ts --network <network>
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n🚀  Deploying Kernel — deployer: ${deployer.address}`);
  console.log(`    Network: ${(await ethers.provider.getNetwork()).name}\n`);

  // ── 1. Deploy VNKR token ────────────────────────────────────────────────
  const VNKRToken = await ethers.getContractFactory("VNKRToken");
  const vnkr      = await VNKRToken.deploy(deployer.address);
  await vnkr.waitForDeployment();
  console.log(`  ✅ VNKRToken    → ${await vnkr.getAddress()}`);

  // ── 2. Deploy sVNKR token ───────────────────────────────────────────────
  const SVNKRToken = await ethers.getContractFactory("SVNKRToken");
  const svnkr      = await SVNKRToken.deploy(deployer.address);
  await svnkr.waitForDeployment();
  console.log(`  ✅ SVNKRToken   → ${await svnkr.getAddress()}`);

  // ── 3. Deploy gVNKR token ───────────────────────────────────────────────
  const GVNKRToken = await ethers.getContractFactory("GVNKRToken");
  const gvnkr      = await GVNKRToken.deploy(deployer.address);
  await gvnkr.waitForDeployment();
  console.log(`  ✅ GVNKRToken   → ${await gvnkr.getAddress()}`);

  // ── 4. Deploy Kernel ────────────────────────────────────────────────────
  const Kernel = await ethers.getContractFactory("Kernel");
  const kernel = await Kernel.deploy(deployer.address, deployer.address);
  await kernel.waitForDeployment();
  console.log(`  ✅ Kernel       → ${await kernel.getAddress()}`);

  // ── 5. Persist addresses ────────────────────────────────────────────────
  const network = (await ethers.provider.getNetwork()).name;
  const outPath  = path.resolve(__dirname, "../exports/addresses.json");
  let existing: Record<string, Record<string, string>> = {};
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, "utf-8"));
  }

  existing[network] = {
    ...(existing[network] ?? {}),
    VNKR_TOKEN:  await vnkr.getAddress(),
    SVNKR_TOKEN: await svnkr.getAddress(),
    GVNKR_TOKEN: await gvnkr.getAddress(),
    KERNEL:      await kernel.getAddress(),
  };

  fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
  console.log(`\n  📄 Addresses saved → exports/addresses.json\n`);
}

main().catch((err) => { console.error(err); process.exit(1); });
