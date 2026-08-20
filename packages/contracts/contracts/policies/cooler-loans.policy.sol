// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "../modules/treas-module.v1.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── cooler-loans.policy.sol — CoolerLoans ────────────────────────────────────
// Cho phép thế chấp gVNKR để vay tài sản dự trữ (DAI/USDT).
// Không bị thanh lý cưỡng chế (non-liquidating) — người vay chỉ mất quyền
// đòi lại collateral nếu không trả nợ đúng hạn.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error Cooler_LoanNotFound(uint256 loanId);
error Cooler_LoanAlreadyRepaid(uint256 loanId);
error Cooler_LoanExpired(uint256 loanId);
error Cooler_InsufficientRepayment();
error Cooler_InvalidAmount();
error Cooler_LTVExceeded(uint256 maxLoan, uint256 requested);

struct CoolerLoan {
    uint256 id;
    address borrower;
    address collateralToken;  // gVNKR
    uint256 collateralAmount;
    address debtToken;        // DAI or USDT
    uint256 principal;
    uint256 interest;         // accrued at expiry
    uint256 expiry;
    bool    repaid;
    bool    defaulted;
}

contract CoolerLoans is Policy {
    // ─── Modules ──────────────────────────────────────────────────────────

    TREASv1 public TREAS;

    // ─── State ────────────────────────────────────────────────────────────

    address public gvnkr;

    /// @notice LTV basis points (e.g. 6667 = 66.67% LTV)
    uint256 public ltvBps = 6_667;

    /// @notice Interest rate per year in basis points
    uint256 public interestBps = 500; // 5% APR

    uint256 public loanDuration = 365 days;

    uint256 private _loanCount;
    mapping(uint256 => CoolerLoan) public loans;
    mapping(address => uint256[]) public borrowerLoans;

    // ─── Events ───────────────────────────────────────────────────────────

    event LoanCreated(uint256 indexed id, address indexed borrower, uint256 collateral, uint256 principal);
    event LoanRepaid(uint256 indexed id, uint256 repayAmount);
    event LoanDefaulted(uint256 indexed id, address indexed borrower, uint256 collateralSeized);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_, address gvnkr_) Policy(kernel_) {
        gvnkr = gvnkr_;
    }

    // ─── Policy interface ─────────────────────────────────────────────────

    function configureDependencies()
        external
        override
        returns (bytes5[] memory deps)
    {
        deps    = new bytes5[](1);
        deps[0] = "TREAS";
        TREAS   = TREASv1(getModuleAddress("TREAS"));
    }

    function requestPermissions()
        external
        view
        override
        returns (Permissions[] memory reqs)
    {
        reqs    = new Permissions[](1);
        reqs[0] = Permissions({ keycode: "TREAS", funcSelector: TREASv1.withdraw.selector });
    }

    // ─── Loan lifecycle ───────────────────────────────────────────────────

    /// @notice Open a loan by locking gVNKR collateral
    function borrow(
        address debtToken_,
        uint256 collateralAmount_,
        uint256 loanAmount_
    ) external returns (uint256 id) {
        if (collateralAmount_ == 0 || loanAmount_ == 0) revert Cooler_InvalidAmount();

        // Fetch gVNKR price from TREAS oracle
        uint256 gvnkrPrice    = TREAS.tokenPriceVnd(gvnkr);   // 1e18 = 1 VND (bảo chứng tối thiểu)
        uint256 collateralVnd = (collateralAmount_ * gvnkrPrice) / 1e18;
        uint256 maxLoan       = (collateralVnd * ltvBps) / 10_000;
        if (loanAmount_ > maxLoan) revert Cooler_LTVExceeded(maxLoan, loanAmount_);

        // Pull collateral from borrower
        IERC20(gvnkr).safeTransferFrom(msg.sender, address(this), collateralAmount_);

        // Pay out loan from treasury
        TREAS.withdraw(debtToken_, msg.sender, loanAmount_);

        uint256 interest = (loanAmount_ * interestBps * loanDuration) / (10_000 * 365 days);

        id = ++_loanCount;
        loans[id] = CoolerLoan({
            id:               id,
            borrower:         msg.sender,
            collateralToken:  gvnkr,
            collateralAmount: collateralAmount_,
            debtToken:        debtToken_,
            principal:        loanAmount_,
            interest:         interest,
            expiry:           block.timestamp + loanDuration,
            repaid:           false,
            defaulted:        false
        });
        borrowerLoans[msg.sender].push(id);
        emit LoanCreated(id, msg.sender, collateralAmount_, loanAmount_);
    }

    /// @notice Repay loan in full (principal + interest) → receive collateral back
    function repay(uint256 loanId_) external {
        CoolerLoan storage loan = loans[loanId_];
        if (loan.id == 0)       revert Cooler_LoanNotFound(loanId_);
        if (loan.repaid)        revert Cooler_LoanAlreadyRepaid(loanId_);
        if (block.timestamp > loan.expiry) revert Cooler_LoanExpired(loanId_);

        uint256 totalOwed = loan.principal + loan.interest;
        IERC20(loan.debtToken).safeTransferFrom(msg.sender, address(TREAS), totalOwed);

        loan.repaid = true;
        IERC20(gvnkr).safeTransfer(loan.borrower, loan.collateralAmount);
        emit LoanRepaid(loanId_, totalOwed);
    }

    /// @notice Claim defaulted collateral after expiry
    function claimDefault(uint256 loanId_) external {
        CoolerLoan storage loan = loans[loanId_];
        if (loan.id == 0)  revert Cooler_LoanNotFound(loanId_);
        if (loan.repaid)   revert Cooler_LoanAlreadyRepaid(loanId_);
        require(block.timestamp > loan.expiry, "Cooler: not expired");
        require(!loan.defaulted, "Cooler: already claimed");

        loan.defaulted = true;
        // Collateral goes to treasury
        IERC20(gvnkr).safeTransfer(address(TREAS), loan.collateralAmount);
        emit LoanDefaulted(loanId_, loan.borrower, loan.collateralAmount);
    }

    function loansOf(address borrower_) external view returns (uint256[] memory) {
        return borrowerLoans[borrower_];
    }
}
