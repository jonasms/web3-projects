// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

interface IBananaswapV1Pair {
    function getReserves() external view returns (uint256, uint256);
}
