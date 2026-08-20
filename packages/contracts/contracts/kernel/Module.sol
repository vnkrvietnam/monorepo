// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Kernel.sol";

// ─── Module.sol ───────────────────────────────────────────────────────────────
// Base abstract contract for all Bophades Data-Store Modules.
// Each Module stores on-chain state and exposes guarded write functions
// that only permitted Policies (approved by the Kernel) may call.
// ─────────────────────────────────────────────────────────────────────────────

error Module_PolicyNotPermitted(address policy);

abstract contract Module {
    // ─── State ────────────────────────────────────────────────────────────

    Kernel public kernel;

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_) {
        kernel = kernel_;
    }

    // ─── Modifiers ────────────────────────────────────────────────────────

    /// @notice Restricts function access to Policies approved by the Kernel
    modifier permissioned() {
        if (
            !kernel.modulePermissions(
                address(this),
                msg.sender,
                msg.sig
            )
        ) revert Module_PolicyNotPermitted(msg.sender);
        _;
    }

    // ─── Interface functions (must be implemented) ─────────────────────────

    /// @notice 5-byte uppercase identifier for this module (e.g. "TREAS")
    function KEYCODE() external pure virtual returns (bytes5);

    /// @notice Semantic version of this module implementation
    function VERSION() external pure virtual returns (uint8 major, uint8 minor);

    /// @notice Called by Kernel during install/upgrade — initialise storage if needed
    function INIT() external virtual {}
}

// ─── Policy.sol (base for all Policies) ──────────────────────────────────────

error Policy_OnlyKernel(address caller);

abstract contract Policy {
    Kernel public kernel;
    bool   private _active;

    constructor(Kernel kernel_) {
        kernel = kernel_;
    }

    modifier onlyKernel() {
        if (msg.sender != address(kernel)) revert Policy_OnlyKernel(msg.sender);
        _;
    }

    /// @notice Returns list of Module keycodes this Policy depends on
    function configureDependencies() external virtual returns (bytes5[] memory dependencies);

    /// @notice Returns list of (keycode, selector) permissions this Policy needs
    function requestPermissions() external view virtual returns (Permissions[] memory requests);

    function isActive() external view returns (bool) {
        return _active;
    }

    function setActiveStatus(bool active_) external onlyKernel {
        _active = active_;
    }

    /// @dev Helper — resolve module address from keycode
    function getModuleAddress(bytes5 keycode_) internal view returns (address) {
        address mod = kernel.getModuleForKeycode(keycode_);
        if (mod == address(0)) revert Kernel_ModuleNotInstalled(keycode_);
        return mod;
    }
}
