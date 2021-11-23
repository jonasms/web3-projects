//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract CollectorCore {
    struct Receipt {
        bool hasVoted;
        uint8 support;
    }

    struct Proposal {
        uint256 id;
        address proposer;
        uint256 eta;
        address[] targets;
        uint256[] values;
        string[] signatures;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        bool canceled;
        bool executed;
        mapping(address => Receipt) receipts;
    }

    enum ProposalState {
        PENDING,
        ACTIVE,
        CANCELED,
        SUCCEEDED,
        DEFEATED,
        QUEUED,
        EXPIRED,
        EXECUTED
    }

    event ProposalCreated(
        uint256 id,
        address proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock,
        string description
    );

    function _votingPeriod() internal pure returns (uint256) {
        // ~3 days in blocks (assuming 15s blocks)
        return 17280;
    }
}
