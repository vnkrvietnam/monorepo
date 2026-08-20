// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ─── VNKRToken.sol — Reserve Currency Token (10T Max Supply) ─────────────────
// VNKR Reserve Currency (ERC-20).
// Bảo chứng 1:1 với tài sản Kho bạc (≥ 1 VND / 1 token).
// Quyền mint/burn được uỷ quyền cho MINTR.v1.sol — chỉ được đúc khi Backing Ratio đảm bảo.
// ─────────────────────────────────────────────────────────────────────────────

error VNKRToken_NotAuthorized(address caller);

contract VNKRToken is ERC20, Ownable {
    address public mintAuthority;

    event MintAuthorityUpdated(address indexed prev, address indexed next);

    constructor(address admin_)
        ERC20("VNKR Reserve Token", "VNKR")
        Ownable(admin_)
    {}

    function setMintAuthority(address authority_) external onlyOwner {
        emit MintAuthorityUpdated(mintAuthority, authority_);
        mintAuthority = authority_;
    }

    modifier onlyMintAuthority() {
        if (msg.sender != mintAuthority) revert VNKRToken_NotAuthorized(msg.sender);
        _;
    }

    function mint(address to_, uint256 amount_) external onlyMintAuthority {
        _mint(to_, amount_);
    }

    function burn(address from_, uint256 amount_) external onlyMintAuthority {
        _burn(from_, amount_);
    }

    function decimals() public pure override returns (uint8) { return 18; }
}
