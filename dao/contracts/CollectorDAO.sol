//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./CollectorBase.sol";

// TODO remove
import "hardhat/console.sol";

contract CollectorDAO is CollectorBase {
    address guardian;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => bool) members;
    uint256 membershipFeeCollected;

    constructor() {
        // TODO send guardian_ in as a param
        guardian = msg.sender;
    }

    function _hashProposal(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal returns (uint256) {
        return uint256(keccak256(abi.encode(targets, values, signatures, calldatas, descriptionHash)));
    }

    function propose(
        address[] memory targets_,
        uint256[] memory values_,
        string[] memory signatures_,
        bytes[] memory calldatas_,
        string memory description_
    ) external returns (uint256) {
        require(members[msg.sender], "Only members can vote.");
        require(targets_.length == values_.length, "");
        require(tagets.length == signatures_.length, "");
        require(target.length == calldatas_.length, "");

        uint256 proposalId = _hasProposal(targets_, values_, signatures_, calldatas_, keccak256(bytes(description_)));

        Proposal storage proposal = proposals[proposalId]; // creates proposal
        require(proposal.startBlock == 0, "This proposal already exists.");

        uint256 endBlock = block.number + votingDelay();

        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        // eta = 0; // TODO ??
        proposal.targets = targets_;
        proposal.values = values_;
        proposal.signatures = signatures_;
        proposal.calldatas = calldatas_;
        proposal.startBlock = block.number;
        proposal.endBlock = endBlock;
        // forVotes: 0;
        // againstVotes: 0;
        // abstainVotes: 0;
        // canceled: false;
        // executed: false

        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets_,
            values_,
            signatures_,
            calldatas_,
            block.number,
            endBlock,
            description
        );
    }
}
