import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ─── 02-deploy-modules.ts ─────────────────────────────────────────────────────
// Bước 2: Deploy tất cả Modules (ROLES, TRSRY, MINTR, RANGE, COMPL) + cài vào Kernel.
// ─────────────────────────────────────────────────────────────────────────────

const Actions = { InstallModule: 0 };

async function main() {
  const network = (await ethers.provider.getNetwork()).name;
  const net     = _load(network);
  const kernel  = await ethers.getContractAt("Kernel", net.KERNEL);
  console.log(`\n🔧  [02] Deploy Modules — Kernel: ${net.KERNEL}\n`);

  // ROLES
  const roles = await (await ethers.getContractFactory("ROLESv1")).deploy(net.KERNEL);
  await roles.waitForDeployment();
  await kernel.executeAction(Actions.InstallModule, await roles.getAddress());
  console.log(`  ✅ ROLESv1  → ${await roles.getAddress()}`);

  // TRSRY v2 (cần VNKR address để tính Floor Price)
  const trsry = await (await ethers.getContractFactory("TRSRYv2")).deploy(net.KERNEL, net.VNKR_TOKEN);
  await trsry.waitForDeployment();
  await kernel.executeAction(Actions.InstallModule, await trsry.getAddress());
  console.log(`  ✅ TRSRYv2  → ${await trsry.getAddress()}`);

  // MINTR v1 (cần VNKR + TRSRY address để kiểm tra Backing Ratio)
  const mintr = await (await ethers.getContractFactory("MINTRv1")).deploy(
    net.KERNEL, net.VNKR_TOKEN, await trsry.getAddress()
  );
  await mintr.waitForDeployment();
  await kernel.executeAction(Actions.InstallModule, await mintr.getAddress());
  // Chuyển mint authority của VNKRToken sang MINTR
  const vnkr = await ethers.getContractAt("VNKRToken", net.VNKR_TOKEN);
  await vnkr.setMintAuthority(await mintr.getAddress());
  console.log(`  ✅ MINTRv1  → ${await mintr.getAddress()}`);

  // RANGE v1 — dải giá VNKR/VND mặc định [20k, 22k, 28k, 30k] VND
  const range = await (await ethers.getContractFactory("RANGEv1")).deploy(
    net.KERNEL,
    ethers.parseUnits("20000", 18),
    ethers.parseUnits("22000", 18),
    ethers.parseUnits("28000", 18),
    ethers.parseUnits("30000", 18)
  );
  await range.waitForDeployment();
  await kernel.executeAction(Actions.InstallModule, await range.getAddress());
  console.log(`  ✅ RANGEv1  → ${await range.getAddress()}`);

  // COMPL v1
  const compl = await (await ethers.getContractFactory("COMPLv1")).deploy(net.KERNEL);
  await compl.waitForDeployment();
  await kernel.executeAction(Actions.InstallModule, await compl.getAddress());
  console.log(`  ✅ COMPLv1  → ${await compl.getAddress()}`);

  _save(network, {
    ROLES_MODULE:  await roles.getAddress(),
    TRSRY_MODULE:  await trsry.getAddress(),
    MINTR_MODULE:  await mintr.getAddress(),
    RANGE_MODULE:  await range.getAddress(),
    COMPL_MODULE:  await compl.getAddress(),
  });
}

function _load(n: string) {
  const p = path.resolve(__dirname, "../exports/addresses.json");
  const d = JSON.parse(fs.readFileSync(p, "utf-8"));
  if (!d[n]?.KERNEL) throw new Error(`Run 01-deploy-kernel first (network: ${n})`);
  return d[n] as Record<string, string>;
}
function _save(n: string, patch: Record<string, string>) {
  const p = path.resolve(__dirname, "../exports/addresses.json");
  const d = JSON.parse(fs.readFileSync(p, "utf-8"));
  d[n] = { ...d[n], ...patch };
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
  console.log(`\n  📄 addresses.json updated\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
