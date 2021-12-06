// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./interfaces/IBananaswapV1Factory.sol";
import "./interfaces/IBananaswapV1Pair.sol";
import "./libraries/BananaswapV1Library.sol";

// TODO remove
import "hardhat/console.sol";

contract BananaswapV1Router {
    address factory;

    constructor(address factory_) {
        factory = factory_;
    }

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

    // TODO look into utility of to_ and deadline_
    // TODO handle token fees
    function depositLiquidity(
        address token_,
        uint256 targetTokenAmount_,
        uint256 minTokenAmount_,
        uint256 minEthAmount_
    ) external payable returns (uint256 liquidity) {
        (uint256 tokenAmount, uint256 ethAmount) = _getAmountsToDeposit(
            token_,
            targetTokenAmount_,
            msg.value,
            minTokenAmount_,
            minEthAmount_
        );

        address pair = IBananaswapV1Factory(factory).getPair(token_);

        // requires `msg.sender` to grant allowance to `pair` before calling `depositLiquidity()`
        BananaswapV1Library.transferFrom(token_, msg.sender, pair, tokenAmount);
        BananaswapV1Library.transferEth(pair, ethAmount);

        // refund dif btween msg.value and ethAmount
        if (msg.value - ethAmount > 0) {
            BananaswapV1Library.transferEth(msg.sender, msg.value - ethAmount);
        }

        liquidity = IBananaswapV1Pair(pair).mint(msg.sender);
    }

    // TODO handle token fees
    function withdrawLiquidity(address token_, uint256 liquidityToWithdraw_)
        external
        returns (uint256 tokensToWithdraw, uint256 ethToWidthraw)
    {
        address pair = IBananaswapV1Factory(factory).getPair(token_);

        // transfer liquidity to pair contract
        IBananaswapV1Pair(pair).transferFrom(msg.sender, pair, liquidityToWithdraw_);

        (tokensToWithdraw, ethToWidthraw) = IBananaswapV1Pair(pair).burn(msg.sender);

        // TODO require amts burned >= minAmts
    }

    function swap(
        address token_,
        uint256 tokensIn_,
        uint256 minTokensOut_,
        uint256 minEthOut_
    ) external payable {
        (uint256 tokenReserve, uint256 ethReserve) = BananaswapV1Library.getReserves(factory, token_);

        // given an amount in, get the corresponding amount out, less fees
        (uint256 tokensOut, uint256 ethOut) = tokensIn_ > 0
            ? (0, BananaswapV1Library.quoteWithFees(tokensIn_, tokenReserve, ethReserve))
            : (BananaswapV1Library.quoteWithFees(msg.value, ethReserve, tokenReserve), 0);

        address pair = IBananaswapV1Factory(factory).getPair(token_);

        IBananaswapV1Pair(pair).swap(tokensOut, ethOut, msg.sender);
    }
}
