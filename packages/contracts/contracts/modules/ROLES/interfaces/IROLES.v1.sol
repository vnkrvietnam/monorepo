// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─── IROLES.v1.sol ───────────────────────────────────────────────────────────
// Interface cho module Role-Based Access Control V1.
// ─────────────────────────────────────────────────────────────────────────────

interface IROLES {
    event RoleGranted(bytes32 indexed role, address indexed addr);
    event RoleRevoked(bytes32 indexed role, address indexed addr);

    function grantRole(bytes32 role, address addr) external;
    function revokeRole(bytes32 role, address addr) external;

    function hasRole(bytes32 role, address addr) external view returns (bool);
    function requireRole(bytes32 role, address addr) external view;
}
