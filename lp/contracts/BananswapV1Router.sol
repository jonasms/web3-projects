// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./interfaces/IBananaswapV1Factory.sol";
import "./interfaces/IBananaswapV1Pair.sol";

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

    // TODO look into utility of to_ and deadlie_
    function depositLiquidity(
        address token_,
        uint256 targetTokenAmount_,
        // uint256 ethAmountTarget,
        uint256 minTokenAmount_,
        uint256 minEthAmount_
    ) external payable {
        (uint256 tokenAmount, uint256 ethAmount) = _getAmountsToDeposit(
            token_,
            targetTokenAmount_,
            // ethAmountTarget,
            msg.value,
            minTokenAmount_,
            minEthAmount_
        );

        address pair = IBananaswapV1Factory(factory).getPair(token_);

        // transfer tokenAmount to pair via token.transferFrom
        BananaswapV1Library.transferFrom(token_, msg.sender, pair, tokenAmount);

        // transfer ethAmount to pair
        BananaswapV1Library.transferEth(pair, ethAmount);

        // refund dif btween msg.value and ethAmount
        uint256 refundAmt = msg.value - ethAmount;
        if (refundAmt > 0) {
            BananaswapV1Library.transferEth(msg.sender, refundAmt);
        }

        // mint liquidity to msg.sender
    }
    // depositLiquidity()
    // withdrawLiquidity()
    // safeTransfer() ?
}
