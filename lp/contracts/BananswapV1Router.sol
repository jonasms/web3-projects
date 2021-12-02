// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./interfaces/IBananaswapV1Factory.sol";
import "./libraries/BananaswapV1Library.sol";

contract BananaswapV1Router {
    address factory;

    constructor(address factory_) {
        factory = factory_;
    }

    // _getAmountsToDeposit()
    function _getAmountsToDeposit(
        address token_,
        uint256 targetTokenAmount_,
        uint256 targetEthAmount_,
        uint256 minTokenAmount_,
        uint256 minEthAmount_
    ) internal returns (uint256 tokenAmount, uint256 ethAmount) {
        // create pair if doesn't exist
        if (IBananaswapV1Factory(factory).getPair(token_) == address(0)) {
            IBananaswapV1Factory(factory).createPair(token_);
        }
        (uint256 tokenReserve, uint256 ethReserve) = BananaswapV1Library.getReserves(factory, token_);
        // first deposit sets the intial reserve amount
        if (tokenReserve == 0 && ethReserve == 0) {
            (tokenAmount, ethAmount) = (targetTokenAmount_, targetEthAmount_);
        } else {
            // otherwise, calculate optimal amounts of each token to deposit

            /**
                First, try to peg the returned amounts based on the ETH provided,
                for the sake of not waisting ETH or using gas to refund the user.
            */
            uint256 optimalTokenAmt = BananaswapV1Library.quote(targetEthAmount_, ethReserve, tokenReserve);
            if (optimalTokenAmt <= targetTokenAmount_) {
                require(optimalTokenAmt >= minTokenAmount_, "");
                (tokenAmount, ethAmount) = (optimalTokenAmt, targetEthAmount_);
            } else {
                uint256 optimalEthAmt = BananaswapV1Library.quote(targetTokenAmount_, tokenReserve, ethReserve);
                require(optimalEthAmt <= targetEthAmount_, "");
                require(optimalEthAmt >= minEthAmount_, "");
                (tokenAmount, ethAmount) = (targetTokenAmount_, optimalEthAmt);
            }
        }
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

        // transfer tokenAmount to pool via token.transferFrom
        // transfer ethAmount to pool
        // refund dif btween msg.value and ethAmount
    }
    // depositLiquidity()
    // withdrawLiquidity()
    // safeTransfer() ?
}
