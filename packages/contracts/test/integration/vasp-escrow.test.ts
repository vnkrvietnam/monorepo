import { expect } from "chai";
import { ethers } from "hardhat";

// ─── vasp-escrow.test.ts ──────────────────────────────────────────────────────
// Integration: full P2P escrow lifecycle —
// createOrder → confirmFiat → releaseToken + dispute resolution.
// ─────────────────────────────────────────────────────────────────────────────

describe("VaspEscrowPolicy — Integration", () => {
  let deployer: any, seller: any, buyer: any, operator: any;
  let kernel: any, escrow: any, dai: any;

  const Actions   = { ActivatePolicy: 2 };
  const ORDER_ID  = ethers.keccak256(ethers.toUtf8Bytes("order-001"));
  const AMOUNT    = ethers.parseUnits("500", 18);

  before(async () => {
    [deployer, seller, buyer, operator] = await ethers.getSigners();

    // Deploy simple DAI mock (reuse VNKRToken as ERC-20)
    dai = await (await (await ethers.getContractFactory("VNKRToken")).deploy(deployer.address)).waitForDeployment();
    await dai.setMintAuthority(deployer.address);
    await dai.mint(seller.address, ethers.parseUnits("10000", 18));

    // Deploy Kernel + Escrow Policy
    kernel = await (await (await ethers.getContractFactory("Kernel")).deploy(
      deployer.address, deployer.address
    )).waitForDeployment();
    escrow = await (await (await ethers.getContractFactory("VaspEscrowPolicy")).deploy(kernel.target)).waitForDeployment();
    await kernel.executeAction(Actions.ActivatePolicy, escrow.target);

    // Set operator
    await escrow.setOperator(operator.address, true);
  });

  it("full happy-path: create → confirmFiat → release", async () => {
    await dai.connect(seller).approve(escrow.target, AMOUNT);
    await escrow.connect(seller).createOrder(
      ORDER_ID, buyer.address, dai.target, AMOUNT, 11_500_000, "VND"
    );

    // Buyer confirms fiat sent
    await escrow.connect(buyer).confirmFiat(ORDER_ID);

    // Operator releases tokens
    const balBefore = await dai.balanceOf(buyer.address);
    await escrow.connect(operator).releaseToken(ORDER_ID);
    const balAfter = await dai.balanceOf(buyer.address);

    expect(balAfter - balBefore).to.equal(AMOUNT);
  });

  it("dispute resolution — seller wins", async () => {
    const orderId2 = ethers.keccak256(ethers.toUtf8Bytes("order-002"));
    await dai.connect(seller).approve(escrow.target, AMOUNT);
    await escrow.connect(seller).createOrder(
      orderId2, buyer.address, dai.target, AMOUNT, 11_500_000, "VND"
    );

    await escrow.connect(buyer).raiseDispute(orderId2);
    const balBefore = await dai.balanceOf(seller.address);
    await escrow.connect(operator).resolveDispute(orderId2, seller.address);
    const balAfter = await dai.balanceOf(seller.address);

    expect(balAfter - balBefore).to.equal(AMOUNT);
  });

  it("should revert confirmFiat by unauthorized party", async () => {
    const orderId3 = ethers.keccak256(ethers.toUtf8Bytes("order-003"));
    await dai.connect(seller).approve(escrow.target, AMOUNT);
    await escrow.connect(seller).createOrder(
      orderId3, buyer.address, dai.target, AMOUNT, 11_500_000, "VND"
    );
    await expect(escrow.connect(deployer).confirmFiat(orderId3))
      .to.be.revertedWithCustomError(escrow, "Escrow_Unauthorized");
  });
});
