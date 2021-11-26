//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./CollectorBase.sol";

// TODO remove
import "hardhat/console.sol";

contract CollectorDAO is CollectorBase {
    /// @notice The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");

    /// @notice The EIP-712 typehash for the ballot struct used by the contract
    bytes32 public constant BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");

    string public constant name = "Collector DAO Governor";

    address public guardian;

    /// @notice The latest proposal for each proposer
    mapping(address => uint256) public latestProposalIds;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => bool) public members;
    uint24 memberCount;
    uint24 numProposals;

    constructor() {
        // TODO send guardian_ in as a param
        guardian = msg.sender;
    }

    function _quorum() internal view returns (uint24) {
        // Avoiding loss of precision
        return (memberCount * 100) / 25;
    }

    function state(uint256 proposalId_) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId_];

        if (proposal.canceled) {
            // TODO need to create method for canceling if not extra feature
            return ProposalState.CANCELED;
        } else if (proposal.executed) {
            return ProposalState.EXECUTED;
        } else if (block.number < proposal.startBlock) {
            return ProposalState.PENDING;
        } else if (block.number <= proposal.endBlock) {
            return ProposalState.ACTIVE;
        } else if (proposal.forVotes <= _quorum() || proposal.forVotes <= proposal.againstVotes) {
            return ProposalState.DEFEATED;
        } else if (proposal.eta == 0) {
            return ProposalState.SUCCEEDED;
        } else if (block.timestamp > proposal.eta) {
            return ProposalState.EXPIRED;
        } else {
            return ProposalState.QUEUED;
        }
    }

    function _hashProposal(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal pure returns (uint256) {
        return uint256(keccak256(abi.encode(targets, values, signatures, calldatas, descriptionHash)));
    }

    function propose(
        address[] memory targets_,
        uint256[] memory values_,
        string[] memory signatures_,
        bytes[] memory calldatas_,
        string memory description_
    ) external returns (uint256) {
        require(members[msg.sender], "propose: Only members can vote.");
        require(targets_.length == values_.length, "propose: information arity mismatch; values");
        require(targets_.length == signatures_.length, "propose: information arity mismatch; signatures");
        require(targets_.length == calldatas_.length, "propose: information arity mismatch; calldatas");

        // TODO this does not create a deterministic hash
        // uint256 proposalId = _hashProposal(targets_, values_, signatures_, calldatas_, keccak256(bytes(description_)));
        uint256 proposalId = numProposals;
        numProposals++;

        Proposal storage proposal = proposals[proposalId]; // creates proposal
        // TODO this check not functioning
        require(proposal.startBlock == 0, "This proposal already exists.");
        latestProposalIds[msg.sender] = proposalId;
        console.log("PROPOSAL ID: ", proposalId);

        uint256 endBlock = block.number + _votingPeriod();

        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.targets = targets_;
        proposal.values = values_;
        proposal.signatures = signatures_;
        proposal.calldatas = calldatas_;
        proposal.startBlock = block.number;
        proposal.endBlock = endBlock;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets_,
            values_,
            signatures_,
            calldatas_,
            block.number,
            endBlock,
            description_
        );

        return proposalId;
    }

    function _castVote(
        uint256 proposalId_,
        uint8 support_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) internal {
        // TODO require proposal is active
        // require(state(proposalId_) == ProposalState.ACTIVE, "_castVote: proposal is not active.");

        /* Get Signer */
        bytes32 domainSeparator = keccak256(
            abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(name)), getChainId(), address(this))
        );
        bytes32 structHash = keccak256(abi.encode(BALLOT_TYPEHASH, proposalId_, support_));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signer = ecrecover(digest, v_, r_, s_);

        console.log("SIGNER ADDRESS: ", signer);

        // TODO do all invalid signatures resolve to address(0)?
        require(signer != address(0), "_castVote: invalid signature");
        require(members[signer], "_castVote: signer is not a member");

        /* Cast Vote */
        Proposal storage proposal = proposals[proposalId_];
        Receipt storage receipt = proposal.receipts[signer];
        require(!receipt.hasVoted, "_castVote: signer has already cast a vote.");

        if (support_ == uint8(Support.AGAINST)) {
            proposal.againstVotes++;
        } else if (support_ == uint8(Support.FOR)) {
            proposal.forVotes++;
        } else if (support_ == uint8(Support.ABSTAIN)) {
            proposal.abstainVotes++;
        }

        receipt.hasVoted = true;
        receipt.support = support_;

        emit VoteCast(signer, proposalId_, support_);
    }

    function castVotesBulk(
        uint256[] calldata proposalIdList_,
        uint8[] calldata supportList_,
        uint8[] calldata vList_,
        bytes32[] calldata rList_,
        bytes32[] calldata sList_
    ) public {
        require(
            proposalIdList_.length == supportList_.length,
            "castVotesBulk: information arity mismatch; supportList"
        );
        require(proposalIdList_.length == vList_.length, "castVotesBulk: information arity mismatch; vList");
        require(proposalIdList_.length == rList_.length, "castVotesBulk: information arity mismatch; rList");
        require(proposalIdList_.length == sList_.length, "castVotesBulk: information arity mismatch; sList");

        for (uint256 i = 0; i < proposalIdList_.length; i++) {
            _castVote(proposalIdList_[i], supportList_[i], vList_[i], rList_[i], sList_[i]);
        }
    }

    // TODO test how payable works here
    function execute(uint256 proposalId_) external payable {
        require(state(proposalId_) == ProposalState.QUEUED, "execute: proposal must be queued");

        Proposal storage proposal = proposals[proposalId_];
        proposal.executed = true;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{ value: proposal.values[i] }(proposal.calldatas[i]);
            require(success, "execute: call failed");
        }
    }

    function buyMembership() external payable {
        require(!members[msg.sender], "Already a member.");
        require(msg.value == 1 ether, "Membership costs exactly 1 ETH.");

        members[msg.sender] = true;
        memberCount++;
    }
}
