// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

library BananaswapV1Library {
    // TODO remove, not being used
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "BananswapLibrary.sortTokens(): IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "BananswapLibrary.sortTokens(): ZERO_ADDRESS");
    }
    // quote()
    // getAmountOut()
}
