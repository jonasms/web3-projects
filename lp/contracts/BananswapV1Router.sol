// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./interfaces/IBananaswapV1Factory.sol";

contract BananaswapV1Router {
    address factory;

    constructor(address factory_) {
        factory = factory_;
    }

    // _getAmountsToDeposit()
    function _getAmountsToDeposit(
        address token,
        uint256 tokenAmountTarget,
        uint256 ethAmountTarget,
        uint256 tokenAmountMin,
        uint256 ethAmountMin
    ) internal returns (uint256 tokenAmount, uint256 ethAmount) {
        // create pair if doesn't exist
        if (IBananaswapV1Factory(factory).getPair(token) == address(0)) {
            IBananaswapV1Factory(factory).createPair(token);
        }
        // if reserves are empty, set amounts to given target amounts
        // else, calculate amounts of each token to deposit
    }

    function depositLiquidity(
        address token,
        uint256 tokenAmountTarget,
        // uint256 ethAmountTarget,
        uint256 tokenAmountMin,
        uint256 ethAmountMin
    ) external payable {
        (uint256 tokenAmount, uint256 ethAmount) = _getAmountsToDeposit(
            token,
            tokenAmountTarget,
            // ethAmountTarget,
            msg.value,
            tokenAmountMin,
            ethAmountMin
        );
    }
    // depositLiquidity()
    // withdrawLiquidity()
    // safeTransfer() ?
}
