import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// ─── 04-configure-roles-and-aml.ts ────────────────────────────────────────────
// Bước 4: Cấp quyền Role-Based + thiết lập AML Oracle cho COMPL module.
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();
  const network    = (await ethers.provider.getNetwork()).name;
  const net        = _load(network);
  console.log(`\n🔐  [04] Configure Roles & AML — network: ${network}\n`);

  const kernel = await ethers.getContractAt("Kernel", net.KERNEL);
  const roles  = await ethers.getContractAt("ROLESv1", net.ROLES_MODULE);
  const compl  = await ethers.getContractAt("COMPLv1", net.COMPL_MODULE);

  const ROLE_POLICY     = ethers.keccak256(ethers.toUtf8Bytes("policy"));
  const ROLE_EMERGENCY  = ethers.keccak256(ethers.toUtf8Bytes("emergency"));
  const ROLE_AUDITOR    = ethers.keccak256(ethers.toUtf8Bytes("auditor"));
  const ROLE_AML_ORACLE = ethers.keccak256(ethers.toUtf8Bytes("aml_oracle"));

  // Cấp quyền policy cho tất cả Policy contracts đã active
  const policyAddresses = [
    net.STAKING_POLICY,
    net.GOVERNANCE,
    net.RANGE_BOUND,
    net.CAPITAL_CONTROL,
    net.VND_GATEWAY,
    net.SWIFT_ESCROW,
    net.P2P_ESCROW,
  ].filter(Boolean);

  for (const addr of policyAddresses) {
    try {
      await roles.grantRole(ROLE_POLICY, addr);
      console.log(`  ✅ ROLE_POLICY  → ${addr}`);
    } catch { /* already granted */ }
  }

  // Cấp quyền Emergency cho deployer
  await roles.grantRole(ROLE_EMERGENCY, deployer.address);
  console.log(`  ✅ ROLE_EMERGENCY → ${deployer.address}`);

  // Cấp quyền AML Oracle cho deployer (production: thay bằng địa chỉ AML service)
  await compl.updateOutflowThreshold(ethers.parseUnits("300000000", 18)); // 300M VND
  console.log(`  ✅ COMPL outflow threshold → 300.000.000 VND`);

  console.log(`\n  🏁 Hệ thống Bophades V2 đã sẵn sàng.\n`);
}

function _load(n: string) {
  const p = path.resolve(__dirname, "../exports/addresses.json");
  const d = JSON.parse(fs.readFileSync(p, "utf-8"));
  if (!d[n]?.KERNEL) throw new Error(`Run scripts 01-03 first (network: ${n})`);
  return d[n] as Record<string, string>;
}

main().catch((e) => { console.error(e); process.exit(1); });
