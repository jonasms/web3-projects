// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

interface IBananaswapV1Pair {
    function getReserves() external view returns (uint256, uint256);

    function mint(address to_) external returns (uint256 liquidity);

    function burn(address to_) external returns (uint256 tokenAmt, uint256 ethAmt);

    function transferFrom(
        address from_,
        address to_,
        uint256 value_
    ) external returns (bool);
}
