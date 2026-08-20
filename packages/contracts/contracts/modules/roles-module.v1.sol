// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";

// ─── roles-module.v1.sol — ROLES ─────────────────────────────────────────────
// Role-Based Access Control module for VnkrvietnamDAO.
// Phân quyền hệ thống: Admin, Policy, Emergency, Auditor.
// ─────────────────────────────────────────────────────────────────────────────

error ROLES_InvalidRole(bytes32 role);
error ROLES_RequireRole(bytes32 role);
error ROLES_AlreadyHasRole(address addr, bytes32 role);
error ROLES_DoesNotHaveRole(address addr, bytes32 role);

contract ROLESv1 is Module {
    // ─── Role constants ───────────────────────────────────────────────────

    bytes32 public constant ROLE_ADMIN      = keccak256("admin");
    bytes32 public constant ROLE_POLICY     = keccak256("policy");
    bytes32 public constant ROLE_EMERGENCY  = keccak256("emergency");
    bytes32 public constant ROLE_AUDITOR    = keccak256("auditor");
    bytes32 public constant ROLE_GUARDIAN   = keccak256("guardian");

    // ─── State ────────────────────────────────────────────────────────────

    mapping(bytes32 => mapping(address => bool)) public hasRole;

    // ─── Events ───────────────────────────────────────────────────────────

    event RoleGranted(bytes32 indexed role, address indexed addr);
    event RoleRevoked(bytes32 indexed role, address indexed addr);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_) Module(kernel_) {}

    // ─── Module interface ─────────────────────────────────────────────────

    function KEYCODE() external pure override returns (bytes5) { return "ROLES"; }
    function VERSION() external pure override returns (uint8 major, uint8 minor) { return (1, 0); }

    function INIT() external override {
        // Seed the executor with admin role on first install
        hasRole[ROLE_ADMIN][kernel.executor()] = true;
        emit RoleGranted(ROLE_ADMIN, kernel.executor());
    }

    // ─── Permissioned writes (only Policies with granted selector) ────────

    /// @notice Grant a role to an address
    function grantRole(bytes32 role_, address addr_) external permissioned {
        if (hasRole[role_][addr_]) revert ROLES_AlreadyHasRole(addr_, role_);
        hasRole[role_][addr_] = true;
        emit RoleGranted(role_, addr_);
    }

    /// @notice Revoke a role from an address
    function revokeRole(bytes32 role_, address addr_) external permissioned {
        if (!hasRole[role_][addr_]) revert ROLES_DoesNotHaveRole(addr_, role_);
        hasRole[role_][addr_] = false;
        emit RoleRevoked(role_, addr_);
    }

    // ─── View helpers ─────────────────────────────────────────────────────

    /// @notice Revert if addr_ does not hold role_
    function requireRole(bytes32 role_, address addr_) external view {
        if (!hasRole[role_][addr_]) revert ROLES_RequireRole(role_);
    }
}
