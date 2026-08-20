// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Kernel.sol";

// ─── IKernel.sol ─────────────────────────────────────────────────────────────
// External-facing interface for the VnkrvietnamDAO Kernel.
// SDKs and off-chain indexers use this to query state without importing
// the full Kernel implementation.
// ─────────────────────────────────────────────────────────────────────────────

interface IKernel {
    // ─── Getters ──────────────────────────────────────────────────────────

    function executor() external view returns (address);
    function admin() external view returns (address);

    function getModuleForKeycode(bytes5 keycode) external view returns (address module);
    function getKeycodeForModule(address module) external view returns (bytes5 keycode);
    function allKeycodes(uint256 index) external view returns (bytes5);
    function allKeycodesLength() external view returns (uint256);

    function isPolicyActive(address policy) external view returns (bool);
    function activePolicies(uint256 index) external view returns (address);
    function activePoliciesLength() external view returns (uint256);

    function modulePermissions(
        address module,
        address policy,
        bytes4  funcSelector
    ) external view returns (bool);

    // ─── Actions ──────────────────────────────────────────────────────────

    function executeAction(Actions action, address target) external;

    // ─── Permission check ─────────────────────────────────────────────────

    function modulePermissionRequired(
        bytes5  keycode,
        address caller,
        bytes4  funcSelector
    ) external view;
}
