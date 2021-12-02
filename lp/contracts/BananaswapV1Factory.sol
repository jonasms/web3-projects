// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

contract BananaswapV1Factory {
    address public owner;
    address[] public pairs;
    mapping(address => mapping(address => address)) public getPair;

    // constructor: set owner
    constructor() {
        owner = msg.sender;
    }

    // createPair()

    // setOwner()
    function setOwner(address newOwner_) external {
        require(msg.sender == owner, "BananaswapV1Factory.setOwner(): ONLY OWNER");
        owner = newOwner_;
    }
}
