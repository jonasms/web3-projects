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
        address payable[] targets;
        uint256[] values;
        string[] signatures;
        bytes[] calldatas;
        uint256 startTime;
        uint256 endTime;
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
        address payable[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startTime,
        uint256 endTime,
        string description
    );

    event VoteCast(address signer, uint256 proposalId, uint8 support);

    function getChainId() internal view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }

    function _votingPeriod() internal pure returns (uint256) {
        return 3 days;
    }

    function _gracePeriod() internal pure returns (uint256) {
        return 14 days;
    }
}
