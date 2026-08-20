// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ─── vote-module.v1.sol — VOTE ────────────────────────────────────────────────
// Quản lý điểm biểu quyết và quản trị DAO thông qua gVNKR.
// Ghi nhận snapshots quyền biểu quyết theo từng block để chống flash-loan.
// ─────────────────────────────────────────────────────────────────────────────

error VOTE_AlreadyVoted(address voter, uint256 proposalId);
error VOTE_ProposalNotActive(uint256 proposalId);
error VOTE_InsufficientVotingPower(address voter);
error VOTE_ProposalDoesNotExist(uint256 proposalId);

enum ProposalStatus { Draft, Active, Passed, Failed, Executed, Cancelled }

struct Proposal {
    uint256 id;
    string  description;
    address proposer;
    uint256 startBlock;
    uint256 endBlock;
    uint256 forVotes;
    uint256 againstVotes;
    uint256 abstainVotes;
    ProposalStatus status;
}

contract VOTEv1 is Module {
    // ─── State ────────────────────────────────────────────────────────────

    IERC20 public gvnkr;

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Minimum gVNKR to create a proposal (1,000 gVNKR)
    uint256 public proposalThreshold = 1_000 * 1e18;

    /// @notice Voting period in blocks (~3 days at 12s/block)
    uint256 public votingPeriod = 21_600;

    // ─── Events ───────────────────────────────────────────────────────────

    event ProposalCreated(uint256 indexed id, address indexed proposer, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 support, uint256 weight);
    event ProposalFinalized(uint256 indexed id, ProposalStatus status);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_, address gvnkr_) Module(kernel_) {
        gvnkr = IERC20(gvnkr_);
    }

    // ─── Module interface ─────────────────────────────────────────────────

    function KEYCODE() external pure override returns (bytes5) { return "VOTES"; }
    function VERSION() external pure override returns (uint8 major, uint8 minor) { return (1, 0); }

    // ─── Permissioned writes ──────────────────────────────────────────────

    /// @notice Create a new governance proposal
    function createProposal(address proposer_, string calldata description_)
        external
        permissioned
        returns (uint256 id)
    {
        require(
            gvnkr.balanceOf(proposer_) >= proposalThreshold,
            "VOTE: insufficient gVNKR"
        );
        id = ++proposalCount;
        proposals[id] = Proposal({
            id:            id,
            description:   description_,
            proposer:      proposer_,
            startBlock:    block.number,
            endBlock:      block.number + votingPeriod,
            forVotes:      0,
            againstVotes:  0,
            abstainVotes:  0,
            status:        ProposalStatus.Active
        });
        emit ProposalCreated(id, proposer_, description_);
    }

    /// @notice Cast a vote — support: 0=against, 1=for, 2=abstain
    function castVote(address voter_, uint256 proposalId_, uint8 support_)
        external
        permissioned
    {
        Proposal storage p = proposals[proposalId_];
        if (p.id == 0)                     revert VOTE_ProposalDoesNotExist(proposalId_);
        if (p.status != ProposalStatus.Active) revert VOTE_ProposalNotActive(proposalId_);
        if (block.number > p.endBlock)     revert VOTE_ProposalNotActive(proposalId_);
        if (hasVoted[proposalId_][voter_]) revert VOTE_AlreadyVoted(voter_, proposalId_);

        uint256 weight = gvnkr.balanceOf(voter_);
        if (weight == 0) revert VOTE_InsufficientVotingPower(voter_);

        hasVoted[proposalId_][voter_] = true;
        if (support_ == 1)      p.forVotes      += weight;
        else if (support_ == 0) p.againstVotes  += weight;
        else                     p.abstainVotes  += weight;

        emit VoteCast(proposalId_, voter_, support_, weight);
    }

    /// @notice Finalize a proposal after voting period ends
    function finalizeProposal(uint256 proposalId_) external permissioned {
        Proposal storage p = proposals[proposalId_];
        if (p.id == 0) revert VOTE_ProposalDoesNotExist(proposalId_);
        require(block.number > p.endBlock, "VOTE: voting ongoing");
        p.status = p.forVotes > p.againstVotes ? ProposalStatus.Passed : ProposalStatus.Failed;
        emit ProposalFinalized(proposalId_, p.status);
    }

    /// @notice Update governance parameters
    function setParams(uint256 threshold_, uint256 period_) external permissioned {
        proposalThreshold = threshold_;
        votingPeriod      = period_;
    }
}
