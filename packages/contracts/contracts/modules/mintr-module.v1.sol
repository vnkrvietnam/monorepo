// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ─── mintr-module.v1.sol — MINTR ─────────────────────────────────────────────
// Kiểm soát đúc (Mint) và đốt (Burn) token VNKR theo cơ chế bảo chứng Kho bạc.
// Chỉ các Policy được cấp phép (StakingPolicy, BondTeller) mới có thể gọi mint/burn.
// ─────────────────────────────────────────────────────────────────────────────

error MINTR_ZeroAmount();
error MINTR_NotMintable();

interface IMintable is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

contract MINTRv1 is Module {
    // ─── State ────────────────────────────────────────────────────────────

    IMintable public vnkr;

    uint256 public totalMinted;
    uint256 public totalBurned;

    /// @notice Maximum supply cap: 10,000,000,000,000 VNKR (18 decimals)
    uint256 public constant RESERVE_CAP = 10_000_000_000_000 * 1e18;

    // ─── Events ───────────────────────────────────────────────────────────

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_, address vnkr_) Module(kernel_) {
        vnkr = IMintable(vnkr_);
    }

    // ─── Module interface ─────────────────────────────────────────────────

    function KEYCODE() external pure override returns (bytes5) { return "MINTR"; }
    function VERSION() external pure override returns (uint8 major, uint8 minor) { return (1, 0); }

    // ─── Permissioned writes ──────────────────────────────────────────────

    /// @notice Mint VNKR tokens — must not exceed RESERVE_CAP
    function mintVnkr(address to_, uint256 amount_) external permissioned {
        if (amount_ == 0) revert MINTR_ZeroAmount();
        require(vnkr.totalSupply() + amount_ <= RESERVE_CAP, "MINTR: cap exceeded");
        totalMinted += amount_;
        vnkr.mint(to_, amount_);
        emit Minted(to_, amount_);
    }

    /// @notice Burn VNKR tokens (deflationary mechanism)
    function burnVnkr(address from_, uint256 amount_) external permissioned {
        if (amount_ == 0) revert MINTR_ZeroAmount();
        totalBurned += amount_;
        vnkr.burn(from_, amount_);
        emit Burned(from_, amount_);
    }

    // ─── View ─────────────────────────────────────────────────────────────

    function circulatingSupply() external view returns (uint256) {
        return vnkr.totalSupply();
    }

    function remainingCap() external view returns (uint256) {
        uint256 supply = vnkr.totalSupply();
        return supply < RESERVE_CAP ? RESERVE_CAP - supply : 0;
    }
}
