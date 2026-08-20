import { expect } from "chai";
import { ethers } from "hardhat";

// ─── bophades-kernel.test.ts ──────────────────────────────────────────────────
// Integration: full Bophades kernel boot sequence —
// install all modules, activate all policies, verify permissions.
// ─────────────────────────────────────────────────────────────────────────────

describe("Bophades Kernel — Integration", () => {
  let deployer: any;

  let kernel:   any;
  let vnkr:     any;
  let svnkr:    any;
  let gvnkr:    any;
  let roles:    any;
  let mintr:    any;
  let treas:    any;
  let staking:  any;
  let escrow:   any;
  let compliance: any;

  const Actions = { InstallModule: 0, ActivatePolicy: 2, DeactivatePolicy: 3 };

  before(async () => {
    [deployer] = await ethers.getSigners();

    // Tokens
    vnkr  = await (await (await ethers.getContractFactory("VNKRToken")).deploy(deployer.address)).waitForDeployment();
    svnkr = await (await (await ethers.getContractFactory("SVNKRToken")).deploy(deployer.address)).waitForDeployment();
    gvnkr = await (await (await ethers.getContractFactory("GVNKRToken")).deploy(deployer.address)).waitForDeployment();

    // Kernel
    kernel = await (await (await ethers.getContractFactory("Kernel")).deploy(
      deployer.address, deployer.address
    )).waitForDeployment();

    // Modules
    roles = await (await (await ethers.getContractFactory("ROLESv1")).deploy(kernel.target)).waitForDeployment();
    await kernel.executeAction(Actions.InstallModule, roles.target);

    mintr = await (await (await ethers.getContractFactory("MINTRv1")).deploy(kernel.target, vnkr.target)).waitForDeployment();
    await kernel.executeAction(Actions.InstallModule, mintr.target);
    await vnkr.setMintAuthority(mintr.target);

    treas = await (await (await ethers.getContractFactory("TREASv1")).deploy(kernel.target)).waitForDeployment();
    await kernel.executeAction(Actions.InstallModule, treas.target);

    // Policies
    staking = await (await (await ethers.getContractFactory("StakingPolicy")).deploy(
      kernel.target, vnkr.target, svnkr.target, gvnkr.target
    )).waitForDeployment();
    await kernel.executeAction(Actions.ActivatePolicy, staking.target);
    await svnkr.setStakingPolicy(staking.target);
    await gvnkr.setStakingPolicy(staking.target);

    escrow = await (await (await ethers.getContractFactory("VaspEscrowPolicy")).deploy(kernel.target)).waitForDeployment();
    await kernel.executeAction(Actions.ActivatePolicy, escrow.target);

    compliance = await (await (await ethers.getContractFactory("CompliancePolicy")).deploy(kernel.target)).waitForDeployment();
    await kernel.executeAction(Actions.ActivatePolicy, compliance.target);
  });

  it("should have installed all modules", async () => {
    expect(await kernel.allKeycodesLength()).to.be.gte(3n);
  });

  it("should have activated staking policy", async () => {
    expect(await kernel.isPolicyActive(staking.target)).to.equal(true);
  });

  it("should have activated escrow policy", async () => {
    expect(await kernel.isPolicyActive(escrow.target)).to.equal(true);
  });

  it("should have activated compliance policy", async () => {
    expect(await kernel.isPolicyActive(compliance.target)).to.equal(true);
  });

  it("should deactivate a policy", async () => {
    await kernel.executeAction(Actions.DeactivatePolicy, compliance.target);
    expect(await kernel.isPolicyActive(compliance.target)).to.equal(false);
    // Re-activate for subsequent tests
    await kernel.executeAction(Actions.ActivatePolicy, compliance.target);
  });

  it("should resolve module address by keycode", async () => {
    const rolesAddr = await kernel.getModuleForKeycode(ethers.encodeBytes32String("ROLES").slice(0, 12));
    // ROLES keycode is bytes5 — verify it resolves to the deployed address
    expect(await kernel.getModuleForKeycode("0x524f4c455300")).to.equal(roles.target);
  });
});
