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
        require(getPair[token] == address(0), "BananaswapV1Factory.createPair(): PAIR_EXISTS");
        /**
            TODO
            Use CREATE2
            1. Gas efficiency: Generates deterministic contract address that can be generated elsewhere
                instead of using a transaction to fetch the address.
            
            2. Gas efficiency: Doesn't require importing the BananaswapV1Pair contract into this factory contract,
                thus reducing gas costs on deployment significantly.
        */
        pair = address(new BananaswapV1Pair(token));
        getPair[token] = pair;
        pairs.push(pair);

        emit PairCreated(token, pair, pairs.length);
    }

    function setOwner(address newOwner_) external {
        require(msg.sender == owner, "BananaswapV1Factory.setOwner(): ONLY OWNER");
        owner = newOwner_;
    }
}
