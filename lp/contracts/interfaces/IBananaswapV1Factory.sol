// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

interface IBananaswapV1Factory {
    event PairCreated(address indexed token, address pair, uint256);

    function getPair(address token) external view returns (address pair);

    function createPair(address token) external returns (address pair);

    function setOwner(address newOwner_) external;
}
