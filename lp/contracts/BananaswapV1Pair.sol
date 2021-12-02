// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./BananaswapV1.sol";

contract BananaswapV1Pair is BananaswapV1 {
    address token;

    // address token1;
    uint256 tokenReserve;
    uint256 ethReserve;

    constructor(address token_) {
        token = token_;
        // token0 = token0_;
        // token1 = token1_;
    }

    function getReserves() public view returns (uint256, uint256) {
        return (tokenReserve, ethReserve);
    }
    // mint()
    // burn
    // swap
    // _update
}
