//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract CollectorBase {
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
        uint256 abstainVotes;
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

    enum Support {
        AGAINST,
        FOR,
        ABSTAIN
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

    function getChainId() internal view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }

    function _votingPeriod() internal pure returns (uint256) {
        // ~3 days in blocks (assuming 15s blocks)
        return 17280;
    }
}
