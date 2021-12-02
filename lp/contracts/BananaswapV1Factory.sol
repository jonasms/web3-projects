// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./libraries/BananaswapV1Library.sol";
import "./BananaswapV1Pair.sol";

contract BananaswapV1Factory {
    address public owner;
    address[] public pairs;
    mapping(address => mapping(address => address)) public getPair;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    constructor() {
        owner = msg.sender;
    }

    function createPair(address tokenA_, address tokenB_) external returns (address pair) {
        (address token0, address token1) = BananaswapV1Library.sortTokens(tokenA_, tokenB_);
        require(getPair[token0][token1] == address(0), "BananaswapV1Factory.createPair(): PAIR_EXISTS");
        pair = address(new BananaswapV1Pair(token0, token1));
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        pairs.push(pair);

        emit PairCreated(token0, token1, pair, pairs.length);
    }

    function setOwner(address newOwner_) external {
        require(msg.sender == owner, "BananaswapV1Factory.setOwner(): ONLY OWNER");
        owner = newOwner_;
    }
}
