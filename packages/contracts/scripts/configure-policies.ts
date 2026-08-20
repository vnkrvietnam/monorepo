import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ─── configure-policies.ts ────────────────────────────────────────────────────
// Deploy all Policy contracts and activate them via Kernel.executeAction.
// Prerequisite: deploy-kernel.ts + deploy-modules.ts must have been run.
// Run: hardhat run scripts/configure-policies.ts --network <network>
// ─────────────────────────────────────────────────────────────────────────────

const Actions = { ActivatePolicy: 2 };

async function main() {
  const [deployer] = await ethers.getSigners();
  const network    = (await ethers.provider.getNetwork()).name;
  const addrFile   = path.resolve(__dirname, "../exports/addresses.json");

  const addresses: Record<string, Record<string, string>> = JSON.parse(
    fs.readFileSync(addrFile, "utf-8")
  );
  const net = addresses[network];
  if (!net?.KERNEL) throw new Error(`No addresses for network: ${network}`);

  const kernel = await ethers.getContractAt("Kernel", net.KERNEL);
  console.log(`\n⚙️   Configuring Policies — Kernel: ${net.KERNEL}\n`);

  // ── 1. StakingPolicy ────────────────────────────────────────────────────
  const StakingPolicy = await ethers.getContractFactory("StakingPolicy");
  const staking = await StakingPolicy.deploy(
    net.KERNEL, net.VNKR_TOKEN, net.SVNKR_TOKEN, net.GVNKR_TOKEN
  );
  await staking.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await staking.getAddress());
  // Wire sVNKR + gVNKR staking authority
  const svnkr = await ethers.getContractAt("SVNKRToken", net.SVNKR_TOKEN);
  const gvnkr = await ethers.getContractAt("GVNKRToken", net.GVNKR_TOKEN);
  await svnkr.setStakingPolicy(await staking.getAddress());
  await gvnkr.setStakingPolicy(await staking.getAddress());
  console.log(`  ✅ StakingPolicy     → ${await staking.getAddress()}`);

  // ── 2. BondTeller ───────────────────────────────────────────────────────
  const BondTeller = await ethers.getContractFactory("BondTeller");
  const teller     = await BondTeller.deploy(net.KERNEL);
  await teller.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await teller.getAddress());
  console.log(`  ✅ BondTeller        → ${await teller.getAddress()}`);

  // ── 3. RangeBoundStability ──────────────────────────────────────────────
  // Example default price range: wall [0.80, 0.90 … 1.10, 1.20] USD
  const RBS = await ethers.getContractFactory("RangeBoundStability");
  const rbs  = await RBS.deploy(
    net.KERNEL,
    ethers.ZeroAddress,   // reserveToken — update to VUSD/USDT address post-deploy
    net.VNKR_TOKEN,
    ethers.parseUnits("20000", 18),      // wallLow:     20.000 VND / VNKR
    ethers.parseUnits("22000", 18),      // cushionLow:  22.000 VND / VNKR
    ethers.parseUnits("28000", 18),      // cushionHigh: 28.000 VND / VNKR
    ethers.parseUnits("30000", 18),      // wallHigh:    30.000 VND / VNKR
    ethers.parseUnits("2500000000", 18)  // cushionBudget: 2.500.000.000 VND
  );
  await rbs.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await rbs.getAddress());
  console.log(`  ✅ RangeBoundStability → ${await rbs.getAddress()}`);

  // ── 4. TreasuryAllocator ────────────────────────────────────────────────
  const TreasuryAllocator = await ethers.getContractFactory("TreasuryAllocator");
  const allocator          = await TreasuryAllocator.deploy(net.KERNEL);
  await allocator.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await allocator.getAddress());
  console.log(`  ✅ TreasuryAllocator → ${await allocator.getAddress()}`);

  // ── 5. CoolerLoans ──────────────────────────────────────────────────────
  const CoolerLoans = await ethers.getContractFactory("CoolerLoans");
  const cooler       = await CoolerLoans.deploy(net.KERNEL, net.GVNKR_TOKEN);
  await cooler.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await cooler.getAddress());
  console.log(`  ✅ CoolerLoans       → ${await cooler.getAddress()}`);

  // ── 6. VaspEscrowPolicy ─────────────────────────────────────────────────
  const VaspEscrowPolicy = await ethers.getContractFactory("VaspEscrowPolicy");
  const escrow            = await VaspEscrowPolicy.deploy(net.KERNEL);
  await escrow.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await escrow.getAddress());
  console.log(`  ✅ VaspEscrowPolicy  → ${await escrow.getAddress()}`);

  // ── 7. CompliancePolicy ─────────────────────────────────────────────────
  const CompliancePolicy = await ethers.getContractFactory("CompliancePolicy");
  const compliance        = await CompliancePolicy.deploy(net.KERNEL);
  await compliance.waitForDeployment();
  await kernel.executeAction(Actions.ActivatePolicy, await compliance.getAddress());
  console.log(`  ✅ CompliancePolicy  → ${await compliance.getAddress()}`);

  // ── Persist ──────────────────────────────────────────────────────────────
  addresses[network] = {
    ...net,
    STAKING_POLICY:     await staking.getAddress(),
    BOND_TELLER:        await teller.getAddress(),
    RANGE_STABILITY:    await rbs.getAddress(),
    TREAS_ALLOCATOR:    await allocator.getAddress(),
    COOLER_LOANS:       await cooler.getAddress(),
    VASP_ESCROW:        await escrow.getAddress(),
    COMPLIANCE_POLICY:  await compliance.getAddress(),
  };

  fs.writeFileSync(addrFile, JSON.stringify(addresses, null, 2));
  console.log(`\n  📄 Addresses updated → exports/addresses.json\n`);
}

main().catch((err) => { console.error(err); process.exit(1); });
