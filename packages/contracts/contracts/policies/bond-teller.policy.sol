// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "../modules/treas-module.v1.sol";
import "../modules/mintr-module.v1.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── bond-teller.policy.sol — BondTeller ─────────────────────────────────────
// Cơ chế Trái phiếu (Bonding): Nhà đầu tư nộp tài sản dự trữ / LP Token
// để nhận VNKR với giá chiết khấu, vesting 5-7 ngày.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error BondTeller_MarketClosed(uint256 marketId);
error BondTeller_InvalidAmount();
error BondTeller_VestingNotComplete(uint256 vestingEnd);
error BondTeller_NothingToRedeem();
error BondTeller_MaxPayoutExceeded(uint256 maxPayout, uint256 requested);

struct BondMarket {
    address quoteToken;    // asset being deposited (DAI, USDT…)
    uint256 price;         // VNKR per quoteToken (18 dec)
    uint256 discount;      // basis points discount off market price
    uint256 vestingSeconds;
    uint256 maxPayout;     // max VNKR per single bond
    uint256 totalSold;     // total VNKR already sold
    uint256 capacity;      // total VNKR available in this market
    bool    active;
}

struct BondNote {
    uint256 marketId;
    uint256 payout;        // VNKR owed
    uint256 vestingEnd;
    bool    redeemed;
}

contract BondTeller is Policy {
    // ─── Modules ──────────────────────────────────────────────────────────

    TREASv1 public TREAS;
    MINTRv1 public MINTR;

    // ─── State ────────────────────────────────────────────────────────────

    uint256 public marketCount;
    mapping(uint256 => BondMarket) public markets;
    mapping(address => BondNote[]) public userNotes;

    // ─── Events ───────────────────────────────────────────────────────────

    event MarketCreated(uint256 indexed id, address quoteToken, uint256 capacity);
    event BondPurchased(uint256 indexed marketId, address indexed buyer, uint256 quoteAmount, uint256 vnkrPayout);
    event BondRedeemed(address indexed user, uint256 noteIndex, uint256 payout);
    event MarketClosed(uint256 indexed id);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_) Policy(kernel_) {}

    // ─── Policy interface ─────────────────────────────────────────────────

    function configureDependencies()
        external
        override
        returns (bytes5[] memory deps)
    {
        deps    = new bytes5[](2);
        deps[0] = "TREAS";
        deps[1] = "MINTR";
        TREAS   = TREASv1(getModuleAddress("TREAS"));
        MINTR   = MINTRv1(getModuleAddress("MINTR"));
    }

    function requestPermissions()
        external
        view
        override
        returns (Permissions[] memory reqs)
    {
        reqs    = new Permissions[](2);
        reqs[0] = Permissions({ keycode: "TREAS", funcSelector: TREASv1.deposit.selector });
        reqs[1] = Permissions({ keycode: "MINTR", funcSelector: MINTRv1.mintVnkr.selector });
    }

    // ─── Market management ────────────────────────────────────────────────

    function createMarket(
        address quoteToken_,
        uint256 price_,
        uint256 discountBps_,
        uint256 vestingSeconds_,
        uint256 capacity_,
        uint256 maxPayout_
    ) external returns (uint256 id) {
        require(kernel.isPolicyActive(address(this)), "BondTeller: not active");
        id = ++marketCount;
        markets[id] = BondMarket({
            quoteToken:     quoteToken_,
            price:          price_,
            discount:       discountBps_,
            vestingSeconds: vestingSeconds_,
            maxPayout:      maxPayout_,
            totalSold:      0,
            capacity:       capacity_,
            active:         true
        });
        emit MarketCreated(id, quoteToken_, capacity_);
    }

    function closeMarket(uint256 marketId_) external {
        require(kernel.isPolicyActive(address(this)), "BondTeller: not active");
        markets[marketId_].active = false;
        emit MarketClosed(marketId_);
    }

    // ─── Bonding ──────────────────────────────────────────────────────────

    /// @notice Purchase a bond — deposit quoteToken → receive VNKR on vesting
    function purchase(uint256 marketId_, uint256 quoteAmount_) external returns (uint256 payout) {
        BondMarket storage mkt = markets[marketId_];
        if (!mkt.active) revert BondTeller_MarketClosed(marketId_);
        if (quoteAmount_ == 0) revert BondTeller_InvalidAmount();

        // payout = quoteAmount * price * (1 + discount%)
        payout = (quoteAmount_ * mkt.price * (10_000 + mkt.discount)) / (10_000 * 1e18);
        if (payout > mkt.maxPayout) revert BondTeller_MaxPayoutExceeded(mkt.maxPayout, payout);
        require(mkt.totalSold + payout <= mkt.capacity, "BondTeller: capacity exceeded");

        mkt.totalSold += payout;

        // Pull quote token into treasury
        TREAS.deposit(mkt.quoteToken, msg.sender, quoteAmount_);

        // Mint VNKR to this contract — user redeems after vesting
        MINTR.mintVnkr(address(this), payout);

        userNotes[msg.sender].push(BondNote({
            marketId:   marketId_,
            payout:     payout,
            vestingEnd: block.timestamp + mkt.vestingSeconds,
            redeemed:   false
        }));

        emit BondPurchased(marketId_, msg.sender, quoteAmount_, payout);
    }

    /// @notice Redeem a vested bond note
    function redeem(uint256 noteIndex_) external {
        BondNote storage note = userNotes[msg.sender][noteIndex_];
        if (note.redeemed || note.payout == 0) revert BondTeller_NothingToRedeem();
        if (block.timestamp < note.vestingEnd)
            revert BondTeller_VestingNotComplete(note.vestingEnd);

        note.redeemed = true;
        IERC20(MINTR.vnkr()).safeTransfer(msg.sender, note.payout);
        emit BondRedeemed(msg.sender, noteIndex_, note.payout);
    }

    function notesOf(address user_) external view returns (BondNote[] memory) {
        return userNotes[user_];
    }
}
