import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ─── deploy-modules.ts ────────────────────────────────────────────────────────
// Deploy all Bophades System Modules and install them into the Kernel.
// Prerequisite: deploy-kernel.ts must have been run first.
// Run: hardhat run scripts/deploy-modules.ts --network <network>
// ─────────────────────────────────────────────────────────────────────────────

const Actions = { InstallModule: 0, UpgradeModule: 1, ActivatePolicy: 2, DeactivatePolicy: 3 };

async function main() {
  const [deployer] = await ethers.getSigners();
  const network    = (await ethers.provider.getNetwork()).name;
  const addrFile   = path.resolve(__dirname, "../exports/addresses.json");

  if (!fs.existsSync(addrFile)) {
    throw new Error("Run deploy-kernel.ts first — exports/addresses.json not found.");
  }

  const addresses: Record<string, Record<string, string>> = JSON.parse(
    fs.readFileSync(addrFile, "utf-8")
  );
  const net = addresses[network];
  if (!net?.KERNEL) throw new Error(`KERNEL address not found for network: ${network}`);

  const kernel = await ethers.getContractAt("Kernel", net.KERNEL);
  console.log(`\n🔧  Deploying Modules — Kernel: ${net.KERNEL}\n`);

  // ── 1. ROLESv1 ──────────────────────────────────────────────────────────
  const ROLESv1 = await ethers.getContractFactory("ROLESv1");
  const roles   = await ROLESv1.deploy(net.KERNEL);
  await roles.waitForDeployment();
  await kernel.executeAction(Actions.InstallModule, await roles.getAddress());
  console.log(`  ✅ ROLESv1      → ${await roles.getAddress()}`);

  // ── 2. MINTRv1 ──────────────────────────────────────────────────────────
  const MINTRv1 = await ethers.getContractFactory("MINTRv1");
  const mintr   = await MINTRv1.deploy(net.KERNEL, net.VNKR_TOKEN);
  await mintr.waitForDeployment();
  await kernel.executeAction(Actions.InstallModule, await mintr.getAddress());
  console.log(`  ✅ MINTRv1      → ${await mintr.getAddress()}`);

  // Transfer mint authority of VNKRToken to MINTRv1
  const vnkr = await ethers.getContractAt("VNKRToken", net.VNKR_TOKEN);
  await vnkr.setMintAuthority(await mintr.getAddress());
  console.log(`     VNKRToken mint authority → MINTRv1`);

  // ── 3. TREASv1 ──────────────────────────────────────────────────────────
  const TREASv1 = await ethers.getContractFactory("TREASv1");
  const treas   = await TREASv1.deploy(net.KERNEL);
  await treas.waitForDeployment();
  await kernel.executeAction(Actions.InstallModule, await treas.getAddress());
  console.log(`  ✅ TREASv1      → ${await treas.getAddress()}`);

  // ── 4. VOTEv1 ───────────────────────────────────────────────────────────
  const VOTEv1 = await ethers.getContractFactory("VOTEv1");
  const vote   = await VOTEv1.deploy(net.KERNEL, net.GVNKR_TOKEN);
  await vote.waitForDeployment();
  await kernel.executeAction(Actions.InstallModule, await vote.getAddress());
  console.log(`  ✅ VOTEv1       → ${await vote.getAddress()}`);

  // ── 5. CHRGv1 ───────────────────────────────────────────────────────────
  // POL receiver = treasury for now; update post-deploy via updateReceivers()
  const CHRGv1 = await ethers.getContractFactory("CHRGv1");
  const chrg   = await CHRGv1.deploy(net.KERNEL, await treas.getAddress(), await treas.getAddress());
  await chrg.waitForDeployment();
  await kernel.executeAction(Actions.InstallModule, await chrg.getAddress());
  console.log(`  ✅ CHRGv1       → ${await chrg.getAddress()}`);

  // ── Persist addresses ────────────────────────────────────────────────────
  addresses[network] = {
    ...net,
    ROLES_MODULE: await roles.getAddress(),
    MINTR_MODULE: await mintr.getAddress(),
    TREAS_MODULE: await treas.getAddress(),
    VOTE_MODULE:  await vote.getAddress(),
    CHRG_MODULE:  await chrg.getAddress(),
  };

  fs.writeFileSync(addrFile, JSON.stringify(addresses, null, 2));
  console.log(`\n  📄 Addresses updated → exports/addresses.json\n`);
}

main().catch((err) => { console.error(err); process.exit(1); });
