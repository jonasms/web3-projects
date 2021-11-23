//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./CollectorCore.sol";

// TODO remove
import "hardhat/console.sol";

contract CollectorDAO is CollectorCore {
    address guardian;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => bool) members;
    uint256 membershipFeeCollected;

    constructor() {
        // TODO send guardian_ in as a param
        guardian = msg.sender;
    }
}
