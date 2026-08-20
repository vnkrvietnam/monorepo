// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "../modules/TRSRY/TRSRY.v2.sol";
import "../modules/MINTR/MINTR.v1.sol";
import "../modules/COMPL/COMPL.v1.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── VNDGateway.sol — VietQR / Fiat On-Ramp eKYC Policy ─────────────────────
// Cổng nạp/rút VNĐ tích hợp eKYC & NĐ-284.
// Xác thực căn cước chính chủ trước khi quy đổi VNĐ ↔ VNKR.
// Chặn tài khoản rác/mạo danh và nguồn tiền đáng ngờ.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error VNDGateway_NotVerified(address user);
error VNDGateway_Blacklisted(address user);
error VNDGateway_DailyLimitExceeded(address user, uint256 limit, uint256 attempted);
error VNDGateway_ZeroAmount();
error VNDGateway_Paused();

enum KYCTier { NONE, TIER1, TIER2, TIER3 }

struct VNDOrder {
    bytes32  orderId;
    address  user;
    uint256  vndAmount;     // 18 dec
    uint256  vnkrAmount;    // 18 dec
    uint8    direction;     // 0 = nạp VNĐ→VNKR, 1 = rút VNKR→VNĐ
    bool     settled;
    uint256  createdAt;
}

contract VNDGateway is Policy {
    // ─── Modules ──────────────────────────────────────────────────────────

    TRSRYv2 public TRSRY;
    MINTRv1 public MINTR;
    COMPLv1 public COMPL;

    // ─── State ────────────────────────────────────────────────────────────

    address public vndToken;   // Stablecoin VND on-chain (wrapped VND)
    bool    public paused;

    mapping(address => KYCTier) public kycTier;
    mapping(address => mapping(uint256 => uint256)) private _dailyVolume;

    /// @notice Hạn mức ngày theo KYC tier (VND, 18 dec)
    uint256[4] public dailyLimits = [
        0,                          // NONE — không được dùng
        20_000_000 * 1e18,         // TIER1 — 20M VND/ngày
        100_000_000 * 1e18,        // TIER2 — 100M VND/ngày
        500_000_000 * 1e18         // TIER3 — 500M VND/ngày
    ];

    mapping(bytes32 => VNDOrder) public orders;

    // ─── Events ───────────────────────────────────────────────────────────

    event KYCVerified(address indexed user, KYCTier tier);
    event KYCRevoked(address indexed user);
    event DepositCreated(bytes32 indexed orderId, address indexed user, uint256 vndAmount, uint256 vnkrAmount);
    event WithdrawCreated(bytes32 indexed orderId, address indexed user, uint256 vnkrAmount, uint256 vndAmount);
    event OrderSettled(bytes32 indexed orderId);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_, address vndToken_) Policy(kernel_) {
        vndToken = vndToken_;
    }

    // ─── Policy interface ─────────────────────────────────────────────────

    function configureDependencies() external override returns (bytes5[] memory deps) {
        deps    = new bytes5[](3);
        deps[0] = "TRSRY";
        deps[1] = "MINTR";
        deps[2] = "COMPL";
        TRSRY   = TRSRYv2(getModuleAddress("TRSRY"));
        MINTR   = MINTRv1(getModuleAddress("MINTR"));
        COMPL   = COMPLv1(getModuleAddress("COMPL"));
    }

    function requestPermissions() external view override returns (Permissions[] memory reqs) {
        reqs    = new Permissions[](4);
        reqs[0] = Permissions({ keycode: "TRSRY", funcSelector: TRSRYv2.deposit.selector });
        reqs[1] = Permissions({ keycode: "TRSRY", funcSelector: TRSRYv2.withdraw.selector });
        reqs[2] = Permissions({ keycode: "MINTR", funcSelector: MINTRv1.mintVnkr.selector });
        reqs[3] = Permissions({ keycode: "MINTR", funcSelector: MINTRv1.burnVnkr.selector });
    }

    // ─── KYC management ───────────────────────────────────────────────────

    function verifyKYC(address user_, KYCTier tier_) external {
        require(kernel.isPolicyActive(address(this)), "VNDGateway: not active");
        kycTier[user_] = tier_;
        emit KYCVerified(user_, tier_);
    }

    function revokeKYC(address user_) external {
        require(kernel.isPolicyActive(address(this)), "VNDGateway: not active");
        kycTier[user_] = KYCTier.NONE;
        emit KYCRevoked(user_);
    }

    // ─── Deposit: VNĐ → VNKR ─────────────────────────────────────────────

    function deposit(bytes32 orderId_, uint256 vndAmount_) external {
        if (paused) revert VNDGateway_Paused();
        if (vndAmount_ == 0) revert VNDGateway_ZeroAmount();
        _requireKYC(msg.sender);
        _requireNotBlacklisted(msg.sender);
        _checkDailyLimit(msg.sender, vndAmount_);

        // Lấy tỷ giá VNKR/VND từ Kho bạc
        uint256 priceVnd  = TRSRY.tokenPriceVnd(vndToken);
        uint256 vnkrAmount = priceVnd > 0 ? (vndAmount_ * 1e18) / priceVnd : vndAmount_;

        TRSRY.deposit(vndToken, msg.sender, vndAmount_);
        MINTR.mintVnkr(msg.sender, vnkrAmount);

        orders[orderId_] = VNDOrder({
            orderId:    orderId_,
            user:       msg.sender,
            vndAmount:  vndAmount_,
            vnkrAmount: vnkrAmount,
            direction:  0,
            settled:    true,
            createdAt:  block.timestamp
        });

        emit DepositCreated(orderId_, msg.sender, vndAmount_, vnkrAmount);
        emit OrderSettled(orderId_);
    }

    // ─── Withdraw: VNKR → VNĐ ────────────────────────────────────────────

    function withdraw(bytes32 orderId_, uint256 vnkrAmount_) external {
        if (paused) revert VNDGateway_Paused();
        if (vnkrAmount_ == 0) revert VNDGateway_ZeroAmount();
        _requireKYC(msg.sender);
        _requireNotBlacklisted(msg.sender);

        uint256 priceVnd = TRSRY.tokenPriceVnd(vndToken);
        uint256 vndOut   = priceVnd > 0 ? (vnkrAmount_ * priceVnd) / 1e18 : vnkrAmount_;

        _checkDailyLimit(msg.sender, vndOut);

        MINTR.burnVnkr(msg.sender, vnkrAmount_);
        TRSRY.withdraw(vndToken, msg.sender, vndOut);

        orders[orderId_] = VNDOrder({
            orderId:    orderId_,
            user:       msg.sender,
            vndAmount:  vndOut,
            vnkrAmount: vnkrAmount_,
            direction:  1,
            settled:    true,
            createdAt:  block.timestamp
        });

        emit WithdrawCreated(orderId_, msg.sender, vnkrAmount_, vndOut);
        emit OrderSettled(orderId_);
    }

    // ─── Internal guards ──────────────────────────────────────────────────

    function _requireKYC(address user_) internal view {
        if (kycTier[user_] == KYCTier.NONE) revert VNDGateway_NotVerified(user_);
    }

    function _requireNotBlacklisted(address user_) internal view {
        if (COMPL.isBlacklisted(user_)) revert VNDGateway_Blacklisted(user_);
    }

    function _checkDailyLimit(address user_, uint256 amountVnd_) internal {
        uint256 bucket = block.timestamp / 1 days;
        uint256 limit  = dailyLimits[uint8(kycTier[user_])];
        uint256 used   = _dailyVolume[user_][bucket] + amountVnd_;
        if (used > limit) revert VNDGateway_DailyLimitExceeded(user_, limit, used);
        _dailyVolume[user_][bucket] = used;
    }
}
