// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../kernel/Module.sol";
import "./interfaces/IROLES.v1.sol";

// ─── ROLES.v1.sol — Access Control & Role Management ─────────────────────────
// Phân quyền hệ thống: Admin, Policy, Emergency, Auditor, Guardian.
// ─────────────────────────────────────────────────────────────────────────────

error ROLES_AlreadyHasRole(address addr, bytes32 role);
error ROLES_DoesNotHaveRole(address addr, bytes32 role);
error ROLES_RequireRole(bytes32 role);

contract ROLESv1 is Module, IROLES {
    // ─── Role constants ───────────────────────────────────────────────────

    bytes32 public constant ROLE_ADMIN      = keccak256("admin");
    bytes32 public constant ROLE_POLICY     = keccak256("policy");
    bytes32 public constant ROLE_EMERGENCY  = keccak256("emergency");
    bytes32 public constant ROLE_AUDITOR    = keccak256("auditor");
    bytes32 public constant ROLE_GUARDIAN   = keccak256("guardian");
    bytes32 public constant ROLE_AML_ORACLE = keccak256("aml_oracle");

    // ─── State ────────────────────────────────────────────────────────────

    mapping(bytes32 => mapping(address => bool)) private _roles;

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_) Module(kernel_) {}

    // ─── Module interface ─────────────────────────────────────────────────

    function KEYCODE() external pure override returns (bytes5) { return "ROLES"; }
    function VERSION() external pure override returns (uint8 major, uint8 minor) { return (1, 0); }

    function INIT() external override {
        _roles[ROLE_ADMIN][kernel.executor()] = true;
        emit RoleGranted(ROLE_ADMIN, kernel.executor());
    }

    // ─── Permissioned writes ──────────────────────────────────────────────

    function grantRole(bytes32 role_, address addr_) external override permissioned {
        if (_roles[role_][addr_]) revert ROLES_AlreadyHasRole(addr_, role_);
        _roles[role_][addr_] = true;
        emit RoleGranted(role_, addr_);
    }

    function revokeRole(bytes32 role_, address addr_) external override permissioned {
        if (!_roles[role_][addr_]) revert ROLES_DoesNotHaveRole(addr_, role_);
        _roles[role_][addr_] = false;
        emit RoleRevoked(role_, addr_);
    }

    // ─── Views ────────────────────────────────────────────────────────────

    function hasRole(bytes32 role_, address addr_) external view override returns (bool) {
        return _roles[role_][addr_];
    }

    function requireRole(bytes32 role_, address addr_) external view override {
        if (!_roles[role_][addr_]) revert ROLES_RequireRole(role_);
    }
}
