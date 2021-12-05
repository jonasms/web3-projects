// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

interface IBananaswapV1ERC20 {
    function transferFrom(
        address from_,
        address to_,
        uint256 value_
    ) external returns (bool);
}
