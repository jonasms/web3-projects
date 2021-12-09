// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/utils/Create2.sol";
import "./libraries/BananaswapV1Library.sol";
import "./BananaswapV1Pair.sol";

contract BananaswapV1Factory {
    address public owner;
    address[] public pairs;
    // Token address to Pair address
    mapping(address => address) public getPair;

    event PairCreated(address indexed token, address pair, uint256);

    constructor() {
        owner = msg.sender;
    }

    function createPair(address token_) external returns (address pair) {
        require(getPair[token_] == address(0), "BananaswapV1Factory.createPair(): PAIR_EXISTS");
        bytes memory bytecode = type(BananaswapV1Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token_));
        pair = Create2.deploy(0, salt, bytecode);
        BananaswapV1Pair(payable(pair)).initialize(token_);
        getPair[token_] = pair;
        pairs.push(pair);

        emit PairCreated(token_, pair, pairs.length);
    }

    function setOwner(address newOwner_) external {
        require(msg.sender == owner, "BananaswapV1Factory.setOwner(): ONLY OWNER");
        owner = newOwner_;
    }
}
