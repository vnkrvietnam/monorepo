import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

// ─── staking-policy.spec.ts ───────────────────────────────────────────────────
// Unit tests for StakingPolicy: stake, unstake, wrap, unwrap, rebase.
// ─────────────────────────────────────────────────────────────────────────────

describe("StakingPolicy", () => {
  let deployer: Signer;
  let alice: Signer;

  let kernel:       Awaited<ReturnType<typeof ethers.getContractAt>>;
  let vnkr:         Awaited<ReturnType<typeof ethers.getContractAt>>;
  let svnkr:        Awaited<ReturnType<typeof ethers.getContractAt>>;
  let gvnkr:        Awaited<ReturnType<typeof ethers.getContractAt>>;
  let mintr:        Awaited<ReturnType<typeof ethers.getContractAt>>;
  let staking:      Awaited<ReturnType<typeof ethers.getContractAt>>;

  const Actions = { InstallModule: 0, ActivatePolicy: 2 };
  const STAKE_AMOUNT = ethers.parseUnits("1000", 18);

  beforeEach(async () => {
    [deployer, alice] = await ethers.getSigners();

    // Deploy tokens
    const VNKRToken   = await ethers.getContractFactory("VNKRToken");
    const SVNKRToken  = await ethers.getContractFactory("SVNKRToken");
    const GVNKRToken  = await ethers.getContractFactory("GVNKRToken");
    vnkr  = await (await VNKRToken.deploy(await deployer.getAddress())).waitForDeployment();
    svnkr = await (await SVNKRToken.deploy(await deployer.getAddress())).waitForDeployment();
    gvnkr = await (await GVNKRToken.deploy(await deployer.getAddress())).waitForDeployment();

    // Deploy kernel
    const Kernel = await ethers.getContractFactory("Kernel");
    kernel = await (await Kernel.deploy(
      await deployer.getAddress(),
      await deployer.getAddress()
    )).waitForDeployment();

    // Deploy + install MINTRv1
    const MINTRv1 = await ethers.getContractFactory("MINTRv1");
    mintr = await (await MINTRv1.deploy(
      await kernel.getAddress(),
      await vnkr.getAddress()
    )).waitForDeployment();
    await (kernel as any).executeAction(Actions.InstallModule, await mintr.getAddress());
    await (vnkr as any).setMintAuthority(await mintr.getAddress());

    // Deploy + activate StakingPolicy
    const StakingPolicy = await ethers.getContractFactory("StakingPolicy");
    staking = await (await StakingPolicy.deploy(
      await kernel.getAddress(),
      await vnkr.getAddress(),
      await svnkr.getAddress(),
      await gvnkr.getAddress()
    )).waitForDeployment();
    await (kernel as any).executeAction(Actions.ActivatePolicy, await staking.getAddress());
    await (svnkr as any).setStakingPolicy(await staking.getAddress());
    await (gvnkr as any).setStakingPolicy(await staking.getAddress());

    // Mint VNKR to alice for testing (deployer is still mint authority)
    await (vnkr as any).setMintAuthority(await deployer.getAddress());
    await (vnkr as any).mint(await alice.getAddress(), ethers.parseUnits("10000", 18));
    await (vnkr as any).setMintAuthority(await mintr.getAddress());
  });

  it("should stake VNKR and receive sVNKR 1:1", async () => {
    await (vnkr as any).connect(alice).approve(await staking.getAddress(), STAKE_AMOUNT);
    await (staking as any).connect(alice).stake(STAKE_AMOUNT);

    expect(await (svnkr as any).balanceOf(await alice.getAddress())).to.equal(STAKE_AMOUNT);
  });

  it("should unstake sVNKR and return VNKR", async () => {
    await (vnkr as any).connect(alice).approve(await staking.getAddress(), STAKE_AMOUNT);
    await (staking as any).connect(alice).stake(STAKE_AMOUNT);
    await (staking as any).connect(alice).unstake(STAKE_AMOUNT);

    expect(await (svnkr as any).balanceOf(await alice.getAddress())).to.equal(0n);
  });

  it("should wrap sVNKR → gVNKR and unwrap back", async () => {
    await (vnkr as any).connect(alice).approve(await staking.getAddress(), STAKE_AMOUNT);
    await (staking as any).connect(alice).stake(STAKE_AMOUNT);
    await (staking as any).connect(alice).wrap(STAKE_AMOUNT);

    expect(await (gvnkr as any).balanceOf(await alice.getAddress())).to.equal(STAKE_AMOUNT);
    expect(await (svnkr as any).balanceOf(await alice.getAddress())).to.equal(0n);

    await (staking as any).connect(alice).unwrap(STAKE_AMOUNT);
    expect(await (svnkr as any).balanceOf(await alice.getAddress())).to.equal(STAKE_AMOUNT);
  });

  it("should revert unstake if insufficient staked balance", async () => {
    await expect((staking as any).connect(alice).unstake(STAKE_AMOUNT))
      .to.be.revertedWithCustomError(staking, "Staking_NotEnoughStaked");
  });

  it("should revert stake of zero amount", async () => {
    await expect((staking as any).connect(alice).stake(0n))
      .to.be.revertedWithCustomError(staking, "Staking_InvalidAmount");
  });
});
