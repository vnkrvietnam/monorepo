import { expect } from "chai";
import { ethers } from "hardhat";

// ─── capital-control.spec.ts ──────────────────────────────────────────────────
// Unit tests cho CapitalControl: phí lũy tiến, hạn mức ngày, emergencyPause.
// ─────────────────────────────────────────────────────────────────────────────

describe("CapitalControl", () => {
  let deployer: any, alice: any, bob: any;
  let kernel: any, compl: any, trsry: any, capCtrl: any, vnkr: any;

  const Actions = { InstallModule: 0, ActivatePolicy: 2 };
  const toVnd = (n: string) => ethers.parseUnits(n, 18);

  beforeEach(async () => {
    [deployer, alice, bob] = await ethers.getSigners();

    vnkr = await (await (await ethers.getContractFactory("VNKRToken")).deploy(deployer.address)).waitForDeployment();

    kernel = await (await (await ethers.getContractFactory("Kernel")).deploy(
      deployer.address, deployer.address
    )).waitForDeployment();

    trsry = await (await (await ethers.getContractFactory("TRSRYv2")).deploy(
      kernel.target, vnkr.target
    )).waitForDeployment();
    await kernel.executeAction(Actions.InstallModule, trsry.target);

    compl = await (await (await ethers.getContractFactory("COMPLv1")).deploy(kernel.target)).waitForDeployment();
    await kernel.executeAction(Actions.InstallModule, compl.target);

    capCtrl = await (await (await ethers.getContractFactory("CapitalControl")).deploy(
      kernel.target, deployer.address
    )).waitForDeployment();
    await kernel.executeAction(Actions.ActivatePolicy, capCtrl.target);
  });

  it("should return zero fee for small outflow (< 100M VND)", async () => {
    const fee = await capCtrl.processOutflow.staticCall(alice.address, toVnd("50000000"));
    expect(fee).to.equal(0n);
  });

  it("should apply Tier1 fee (0.5%) for outflow in 100M–500M range", async () => {
    // Simulate totalDailyOutflow passing Tier1 threshold
    await capCtrl.processOutflow(alice.address, toVnd("100000000")); // 100M → crosses tier1
    const fee = await capCtrl.processOutflow.staticCall(alice.address, toVnd("10000000"));
    // 10M × 50bps = 50_000 VND
    expect(fee).to.equal(toVnd("10000000") * 50n / 10_000n);
  });

  it("should revert when daily limit exceeded", async () => {
    await expect(
      capCtrl.processOutflow(alice.address, toVnd("600000000")) // 600M > 500M limit
    ).to.be.revertedWithCustomError(capCtrl, "CapControl_DailyLimitExceeded");
  });

  it("should pause and block all outflows", async () => {
    await capCtrl.emergencyPause("test");
    await expect(capCtrl.processOutflow(alice.address, toVnd("1000000")))
      .to.be.revertedWithCustomError(capCtrl, "CapControl_Paused");
  });

  it("should unpause and allow outflows again", async () => {
    await capCtrl.emergencyPause("test");
    await capCtrl.emergencyUnpause();
    const fee = await capCtrl.processOutflow.staticCall(alice.address, toVnd("1000000"));
    expect(fee).to.equal(0n);
  });

  it("should update daily outflow limit", async () => {
    await capCtrl.setDailyOutflowLimit(toVnd("1000000000")); // 1B VND
    expect(await capCtrl.dailyOutflowLimit()).to.equal(toVnd("1000000000"));
  });
});
