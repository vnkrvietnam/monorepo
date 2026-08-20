import { expect } from "chai";
import { ethers } from "hardhat";

// ─── range-stability.spec.ts ──────────────────────────────────────────────────
// Unit tests for RangeBoundStability (RBS Engine).
// Đơn vị giá: VND (1 VNKR ≈ 25.000 VND theo cơ chế bảo chứng Kho bạc)
// ─────────────────────────────────────────────────────────────────────────────

describe("RangeBoundStability", () => {
  let deployer: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let keeper:   Awaited<ReturnType<typeof ethers.getSigners>>[0];

  let kernel: any, mintr: any, treas: any, rbs: any, vnkr: any, dai: any;

  const toVnd = (n: string) => ethers.parseUnits(n, 18); // n = VND đơn vị
  const Actions = { InstallModule: 0, ActivatePolicy: 2 };

  beforeEach(async () => {
    [deployer, keeper] = await ethers.getSigners();

    // Deploy VNKR
    vnkr = await (await (await ethers.getContractFactory("VNKRToken")).deploy(deployer.address)).waitForDeployment();

    // Deploy mock ERC-20 DAI
    const MockERC20 = await ethers.getContractFactory("VNKRToken"); // reuse as simple ERC-20
    dai  = await (await MockERC20.deploy(deployer.address)).waitForDeployment();
    await dai.setMintAuthority(deployer.address);
    await dai.mint(deployer.address, toUsd("1000000"));

    // Deploy Kernel
    kernel = await (await (await ethers.getContractFactory("Kernel")).deploy(
      deployer.address, deployer.address
    )).waitForDeployment();

    // Deploy + install MINTR
    mintr = await (await (await ethers.getContractFactory("MINTRv1")).deploy(
      kernel.target, vnkr.target
    )).waitForDeployment();
    await kernel.executeAction(Actions.InstallModule, mintr.target);
    await vnkr.setMintAuthority(mintr.target);

    // Deploy + install TREAS
    treas = await (await (await ethers.getContractFactory("TREASv1")).deploy(kernel.target)).waitForDeployment();
    await kernel.executeAction(Actions.InstallModule, treas.target);

    // Deploy + activate RBS
    rbs = await (await (await ethers.getContractFactory("RangeBoundStability")).deploy(
      kernel.target,
      dai.target,
      vnkr.target,
      toVnd("20000"),        // wallLow:     20.000 VND
      toVnd("22000"),        // cushionLow:  22.000 VND
      toVnd("28000"),        // cushionHigh: 28.000 VND
      toVnd("30000"),        // wallHigh:    30.000 VND
      toVnd("2500000000")    // cushionBudget: 2.500.000.000 VND
    )).waitForDeployment();
    await kernel.executeAction(Actions.ActivatePolicy, rbs.target);
  });

  it("should store correct price range (VND)", async () => {
    expect(await rbs.wallLow()).to.equal(toVnd("20000"));
    expect(await rbs.cushionLow()).to.equal(toVnd("22000"));
    expect(await rbs.cushionHigh()).to.equal(toVnd("28000"));
    expect(await rbs.wallHigh()).to.equal(toVnd("30000"));
  });

  it("should update price range (VND)", async () => {
    await rbs.updatePriceRange(
      toVnd("18000"), toVnd("21000"), toVnd("29000"), toVnd("32000")
    );
    expect(await rbs.wallLow()).to.equal(toVnd("18000"));
    expect(await rbs.wallHigh()).to.equal(toVnd("32000"));
  });

  it("should revert updatePriceRange with invalid ordering", async () => {
    await expect(rbs.updatePriceRange(
      toVnd("30000"), toVnd("22000"), toVnd("28000"), toVnd("35000")
    )).to.be.revertedWith("RBS: invalid range");
  });
});
