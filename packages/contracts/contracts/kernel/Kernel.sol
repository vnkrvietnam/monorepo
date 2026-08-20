// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─── Kernel.sol ───────────────────────────────────────────────────────────────
// VnkrvietnamDAO — Bophades Architecture
// Trung tâm điều phối quyền hạn giữa các Modules và Policies.
// ─────────────────────────────────────────────────────────────────────────────

/// @dev Action enum used by executeAction()
enum Actions {
    InstallModule,   // Cài đặt Module mới
    UpgradeModule,   // Nâng cấp Module (thay thế)
    ActivatePolicy,  // Kích hoạt Policy
    DeactivatePolicy,// Vô hiệu hóa Policy
    ChangeExecutor,  // Chuyển quyền điều hành Kernel
    ChangeAdmin      // Chuyển quyền Admin
}

/// @dev Packed instruction struct passed to executeAction()
struct Instruction {
    Actions action;
    address target;
}

/// @dev Permissions granted from a Module to a Policy
struct Permissions {
    bytes5 keycode;   // Module identifier (e.g. "TREAS")
    bytes4 funcSelector;
}

// ─── Custom Errors ────────────────────────────────────────────────────────────

error Kernel_OnlyExecutor();
error Kernel_OnlyAdmin();
error Kernel_InvalidModuleKeycode(bytes5 keycode);
error Kernel_InvalidModuleUpgrade(bytes5 keycode);
error Kernel_PolicyAlreadyActivated(address policy);
error Kernel_PolicyNotActivated(address policy);
error Kernel_AddressIsNotAContract(address addr);
error Kernel_ModuleNotInstalled(bytes5 keycode);

// ─── Forward declarations ─────────────────────────────────────────────────────

interface IModule {
    function KEYCODE() external pure returns (bytes5);
    function VERSION() external pure returns (uint8 major, uint8 minor);
    function INIT() external;
}

interface IPolicy {
    function configureDependencies() external returns (bytes5[] memory dependencies);
    function requestPermissions() external view returns (Permissions[] memory requests);
    function isActive() external view returns (bool);
    function setActiveStatus(bool active_) external;
}

// ─────────────────────────────────────────────────────────────────────────────
//                              KERNEL
// ─────────────────────────────────────────────────────────────────────────────

/// @title  Kernel — VnkrvietnamDAO Bophades Core Coordinator
/// @notice Manages installation/upgrade of Modules and activation/deactivation
///         of Policies, along with role-based permission grants.
contract Kernel {
    // ─── State ────────────────────────────────────────────────────────────

    /// @notice Address that can call executeAction()
    address public executor;

    /// @notice Address that can change executor / admin
    address public admin;

    /// @notice Module instances keyed by 5-byte keycode
    mapping(bytes5 => address) public getModuleForKeycode;

    /// @notice Reverse lookup: module address → keycode
    mapping(address => bytes5) public getKeycodeForModule;

    /// @notice All registered keycodes (for enumeration)
    bytes5[] public allKeycodes;

    /// @notice Active policy set
    mapping(address => bool) public isPolicyActive;
    address[] public activePolicies;

    /// @notice Module → Policy → selector → granted
    mapping(address => mapping(address => mapping(bytes4 => bool))) public modulePermissions;

    // ─── Events ───────────────────────────────────────────────────────────

    event ActionExecuted(Actions indexed action, address indexed target);
    event PermissionSet(bytes5 indexed keycode, address indexed policy, bytes4 funcSelector, bool granted);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(address executor_, address admin_) {
        executor = executor_;
        admin    = admin_;
    }

    // ─── Access Modifiers ─────────────────────────────────────────────────

    modifier onlyExecutor() {
        if (msg.sender != executor) revert Kernel_OnlyExecutor();
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Kernel_OnlyAdmin();
        _;
    }

    // ─── Core: executeAction ──────────────────────────────────────────────

    /// @notice Main entry point — dispatches governance actions
    function executeAction(Actions action_, address target_) external onlyExecutor {
        if (action_ == Actions.InstallModule)    _installModule(target_);
        else if (action_ == Actions.UpgradeModule)    _upgradeModule(target_);
        else if (action_ == Actions.ActivatePolicy)   _activatePolicy(target_);
        else if (action_ == Actions.DeactivatePolicy) _deactivatePolicy(target_);
        else if (action_ == Actions.ChangeExecutor)   executor = target_;
        else if (action_ == Actions.ChangeAdmin)      admin    = target_;

        emit ActionExecuted(action_, target_);
    }

    // ─── Internal helpers ─────────────────────────────────────────────────

    function _ensureContract(address target_) internal view {
        uint256 size;
        assembly { size := extcodesize(target_) }
        if (size == 0) revert Kernel_AddressIsNotAContract(target_);
    }

    function _installModule(address newModule_) internal {
        _ensureContract(newModule_);
        bytes5 keycode = IModule(newModule_).KEYCODE();
        _validateKeycode(keycode);
        if (getModuleForKeycode[keycode] != address(0))
            revert Kernel_InvalidModuleUpgrade(keycode); // use UpgradeModule instead

        getModuleForKeycode[keycode] = newModule_;
        getKeycodeForModule[newModule_] = keycode;
        allKeycodes.push(keycode);
        IModule(newModule_).INIT();
    }

    function _upgradeModule(address newModule_) internal {
        _ensureContract(newModule_);
        bytes5 keycode = IModule(newModule_).KEYCODE();
        _validateKeycode(keycode);
        address oldModule = getModuleForKeycode[keycode];
        if (oldModule == address(0))
            revert Kernel_ModuleNotInstalled(keycode);

        getKeycodeForModule[oldModule] = bytes5(0);
        getModuleForKeycode[keycode]   = newModule_;
        getKeycodeForModule[newModule_] = keycode;
        IModule(newModule_).INIT();

        // Re-configure all active policies that depend on this module
        uint256 len = activePolicies.length;
        for (uint256 i; i < len; ++i) {
            IPolicy policy = IPolicy(activePolicies[i]);
            if (policy.isActive()) _configureDependencies(policy);
        }
    }

    function _activatePolicy(address policy_) internal {
        _ensureContract(policy_);
        if (isPolicyActive[policy_]) revert Kernel_PolicyAlreadyActivated(policy_);

        IPolicy policy = IPolicy(policy_);
        _configureDependencies(policy);
        _grantPermissions(policy);

        isPolicyActive[policy_] = true;
        activePolicies.push(policy_);
        policy.setActiveStatus(true);
    }

    function _deactivatePolicy(address policy_) internal {
        if (!isPolicyActive[policy_]) revert Kernel_PolicyNotActivated(policy_);

        IPolicy policy = IPolicy(policy_);
        _revokePermissions(policy);

        isPolicyActive[policy_] = false;
        uint256 len = activePolicies.length;
        for (uint256 i; i < len; ++i) {
            if (activePolicies[i] == policy_) {
                activePolicies[i] = activePolicies[len - 1];
                activePolicies.pop();
                break;
            }
        }
        policy.setActiveStatus(false);
    }

    function _configureDependencies(IPolicy policy_) internal {
        bytes5[] memory deps = policy_.configureDependencies();
        uint256 len = deps.length;
        for (uint256 i; i < len; ++i) {
            if (getModuleForKeycode[deps[i]] == address(0))
                revert Kernel_ModuleNotInstalled(deps[i]);
        }
    }

    function _grantPermissions(IPolicy policy_) internal {
        Permissions[] memory reqs = policy_.requestPermissions();
        uint256 len = reqs.length;
        for (uint256 i; i < len; ++i) {
            address module = getModuleForKeycode[reqs[i].keycode];
            if (module == address(0)) revert Kernel_ModuleNotInstalled(reqs[i].keycode);
            modulePermissions[module][address(policy_)][reqs[i].funcSelector] = true;
            emit PermissionSet(reqs[i].keycode, address(policy_), reqs[i].funcSelector, true);
        }
    }

    function _revokePermissions(IPolicy policy_) internal {
        Permissions[] memory reqs = policy_.requestPermissions();
        uint256 len = reqs.length;
        for (uint256 i; i < len; ++i) {
            address module = getModuleForKeycode[reqs[i].keycode];
            if (module == address(0)) continue;
            modulePermissions[module][address(policy_)][reqs[i].funcSelector] = false;
            emit PermissionSet(reqs[i].keycode, address(policy_), reqs[i].funcSelector, false);
        }
    }

    function _validateKeycode(bytes5 keycode_) internal pure {
        for (uint256 i; i < 5; ++i) {
            uint8 char = uint8(keycode_[i]);
            // Only uppercase A-Z and null terminator allowed
            if (char != 0 && (char < 65 || char > 90))
                revert Kernel_InvalidModuleKeycode(keycode_);
        }
    }

    // ─── Permission check (called by Modules) ─────────────────────────────

    /// @notice Modules call this to verify the caller (Policy) has permission
    function modulePermissionRequired(
        bytes5 keycode_,
        address caller_,
        bytes4 funcSelector_
    ) external view {
        address module = getModuleForKeycode[keycode_];
        if (!modulePermissions[module][caller_][funcSelector_])
            revert Kernel_OnlyExecutor(); // reuse generic revert — caller not permitted
    }

    // ─── View helpers ─────────────────────────────────────────────────────

    function allKeycodesLength() external view returns (uint256) {
        return allKeycodes.length;
    }

    function activePoliciesLength() external view returns (uint256) {
        return activePolicies.length;
    }
}
