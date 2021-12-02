// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

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

    function createPair(address token) external returns (address pair) {
        // (address token0, address token1) = BananaswapV1Library.sortTokens(token, tokenB_);
        require(getPair[token] == address(0), "BananaswapV1Factory.createPair(): PAIR_EXISTS");
        pair = address(new BananaswapV1Pair(token));
        getPair[token] = pair;
        // getPair[token1][token0] = pair;
        pairs.push(pair);

        emit PairCreated(token, pair, pairs.length);
    }

    function setOwner(address newOwner_) external {
        require(msg.sender == owner, "BananaswapV1Factory.setOwner(): ONLY OWNER");
        owner = newOwner_;
    }
}
