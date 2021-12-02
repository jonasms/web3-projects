// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./BananaswapV1.sol";

contract BananaswapV1Pair is BananaswapV1 {
    address token0;
    address token1;

    constructor(address token0_, address token1_) {
        token0 = token0_;
        token1 = token1_;
    }
    // mint()
    // burn
    // swap
    // _update
}
