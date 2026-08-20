import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ─── 03-deploy-policies.ts ────────────────────────────────────────────────────
// Bước 3: Deploy tất cả Policy contracts + activate qua Kernel.
// ─────────────────────────────────────────────────────────────────────────────

const Actions = { ActivatePolicy: 2 };

async function main() {
  const [deployer] = await ethers.getSigners();
  const network    = (await ethers.provider.getNetwork()).name;
  const net        = _load(network);
  const kernel     = await ethers.getContractAt("Kernel", net.KERNEL);
  console.log(`\n⚙️   [03] Deploy Policies — Kernel: ${net.KERNEL}\n`);

  // Staking (dùng policy cũ từ V1 — vẫn tương thích)
  const staking = await (await ethers.getContractFactory("StakingPolicy")).deploy(
    net.KERNEL, net.VNKR_TOKEN, net.SVNKR_TOKEN, net.GVNKR_TOKEN
  );
  await staking.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await staking.getAddress());
  const svnkr = await ethers.getContractAt("SVNKRToken", net.SVNKR_TOKEN);
  const gvnkr = await ethers.getContractAt("GVNKRToken", net.GVNKR_TOKEN);
  await svnkr.setStakingPolicy(await staking.getAddress());
  console.log(`  ✅ StakingPolicy     → ${await staking.getAddress()}`);

  // Governance wrapper
  const gov = await (await ethers.getContractFactory("Governance")).deploy(
    net.KERNEL, net.SVNKR_TOKEN, net.GVNKR_TOKEN
  );
  await gov.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await gov.getAddress());
  await gvnkr.setStakingPolicy(await gov.getAddress());
  console.log(`  ✅ Governance        → ${await gov.getAddress()}`);

  // RangeBound (cushionBudget: 2.5B VND)
  const rangeBound = await (await ethers.getContractFactory("RangeBound")).deploy(
    net.KERNEL,
    ethers.ZeroAddress,           // reserveToken — set post-deploy when VND stablecoin deployed
    ethers.parseUnits("2500000000", 18)
  );
  await rangeBound.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await rangeBound.getAddress());
  console.log(`  ✅ RangeBound        → ${await rangeBound.getAddress()}`);

  // CapitalControl
  const capCtrl = await (await ethers.getContractFactory("CapitalControl")).deploy(
    net.KERNEL, deployer.address  // feeCollector = deployer; update later
  );
  await capCtrl.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await capCtrl.getAddress());
  console.log(`  ✅ CapitalControl    → ${await capCtrl.getAddress()}`);

  // VNDGateway (vndToken = ZeroAddress — set when VND stablecoin deployed)
  const vndGw = await (await ethers.getContractFactory("VNDGateway")).deploy(
    net.KERNEL, ethers.ZeroAddress
  );
  await vndGw.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await vndGw.getAddress());
  console.log(`  ✅ VNDGateway        → ${await vndGw.getAddress()}`);

  // SwiftEscrow (relayerOracle = deployer for now)
  const swiftEscrow = await (await ethers.getContractFactory("SwiftEscrow")).deploy(
    net.KERNEL, deployer.address
  );
  await swiftEscrow.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await swiftEscrow.getAddress());
  console.log(`  ✅ SwiftEscrow       → ${await swiftEscrow.getAddress()}`);

  // P2PEscrow
  const p2p = await (await ethers.getContractFactory("P2PEscrow")).deploy(net.KERNEL);
  await p2p.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await p2p.getAddress());
  await p2p.setOperator(deployer.address, true);
  console.log(`  ✅ P2PEscrow         → ${await p2p.getAddress()}`);

  _save(network, {
    STAKING_POLICY:  await staking.getAddress(),
    GOVERNANCE:      await gov.getAddress(),
    RANGE_BOUND:     await rangeBound.getAddress(),
    CAPITAL_CONTROL: await capCtrl.getAddress(),
    VND_GATEWAY:     await vndGw.getAddress(),
    SWIFT_ESCROW:    await swiftEscrow.getAddress(),
    P2P_ESCROW:      await p2p.getAddress(),
  });
}

function _load(n: string) {
  const p = path.resolve(__dirname, "../exports/addresses.json");
  const d = JSON.parse(fs.readFileSync(p, "utf-8"));
  if (!d[n]?.KERNEL) throw new Error(`Run 01/02 scripts first (network: ${n})`);
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
