// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "../modules/ROLES/ROLES.v1.sol";
import "../tokens/sVNKRToken.sol";
import "../tokens/gVNKRToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── Governance.sol — Wrap sVNKR → gVNKR (Index Multiplier) ─────────────────
// Wrap sVNKR thành gVNKR có chỉ số nhân (Index) để biểu quyết DAO,
// giao dịch Cross-Chain và thế chấp tín chấp tại các L2/Sidechain.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error Governance_ZeroAmount();
error Governance_InvalidIndex();

contract Governance is Policy {
    // ─── Modules ──────────────────────────────────────────────────────────

    ROLESv1    public ROLES;
    SVNKRToken public sVNKR;
    GVNKRToken public gVNKR;

    // ─── Index (gVNKR index multiplier — tăng theo mỗi Epoch rebase) ────
    /// @notice Index = tổng tích lũy rebase — 1 gVNKR = index × sVNKR (18 dec)
    uint256 public index = 1e18;

    // ─── Events ───────────────────────────────────────────────────────────

    event Wrapped(address indexed user, uint256 svnkrIn, uint256 gvnkrOut);
    event Unwrapped(address indexed user, uint256 gvnkrIn, uint256 svnkrOut);
    event IndexUpdated(uint256 prevIndex, uint256 newIndex);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_, address svnkr_, address gvnkr_) Policy(kernel_) {
        sVNKR = SVNKRToken(svnkr_);
        gVNKR = GVNKRToken(gvnkr_);
    }

    // ─── Policy interface ─────────────────────────────────────────────────

    function configureDependencies() external override returns (bytes5[] memory deps) {
        deps    = new bytes5[](1);
        deps[0] = "ROLES";
        ROLES   = ROLESv1(getModuleAddress("ROLES"));
    }

    function requestPermissions() external view override returns (Permissions[] memory reqs) {
        reqs = new Permissions[](0);
    }

    // ─── Wrap / Unwrap ────────────────────────────────────────────────────

    /// @notice Wrap sVNKR → gVNKR theo index hiện tại
    /// gvnkrOut = svnkrIn × 1e18 / index
    function wrap(uint256 svnkrAmount_) external returns (uint256 gvnkrOut) {
        if (svnkrAmount_ == 0) revert Governance_ZeroAmount();
        if (index == 0) revert Governance_InvalidIndex();
        gvnkrOut = (svnkrAmount_ * 1e18) / index;
        sVNKR.burn(msg.sender, svnkrAmount_);
        gVNKR.mint(msg.sender, gvnkrOut);
        emit Wrapped(msg.sender, svnkrAmount_, gvnkrOut);
    }

    /// @notice Unwrap gVNKR → sVNKR theo index hiện tại
    /// svnkrOut = gvnkrIn × index / 1e18
    function unwrap(uint256 gvnkrAmount_) external returns (uint256 svnkrOut) {
        if (gvnkrAmount_ == 0) revert Governance_ZeroAmount();
        svnkrOut = (gvnkrAmount_ * index) / 1e18;
        gVNKR.burn(msg.sender, gvnkrAmount_);
        sVNKR.mint(msg.sender, svnkrOut);
        emit Unwrapped(msg.sender, gvnkrAmount_, svnkrOut);
    }

    /// @notice Cập nhật index sau mỗi Epoch rebase (gọi bởi StakingPolicy)
    function updateIndex(uint256 newIndex_) external {
        require(kernel.isPolicyActive(address(this)), "Governance: not active");
        if (newIndex_ == 0) revert Governance_InvalidIndex();
        emit IndexUpdated(index, newIndex_);
        index = newIndex_;
    }

    // ─── View helpers ─────────────────────────────────────────────────────

    /// @notice Quy đổi sVNKR → gVNKR theo index
    function toGVNKR(uint256 svnkrAmount_) external view returns (uint256) {
        return (svnkrAmount_ * 1e18) / index;
    }

    /// @notice Quy đổi gVNKR → sVNKR theo index
    function toSVNKR(uint256 gvnkrAmount_) external view returns (uint256) {
        return (gvnkrAmount_ * index) / 1e18;
    }
}
