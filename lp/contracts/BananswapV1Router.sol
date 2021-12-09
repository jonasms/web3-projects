// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./interfaces/IBananaswapV1Factory.sol";
import "./interfaces/IBananaswapV1Pair.sol";
import "./libraries/BananaswapV1Library.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

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

        address pair = BananaswapV1Library.getPair(factory, token_);

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
        address pair = BananaswapV1Library.getPair(factory, token_);

        // transfer liquidity to pair contract
        IBananaswapV1Pair(pair).transferFrom(msg.sender, pair, liquidityToWithdraw_);

        (tokensToWithdraw, ethToWidthraw) = IBananaswapV1Pair(pair).burn(msg.sender);

        // TODO require amts burned >= minAmts
    }

    function _swap(
        address pair_,
        uint256 tokensOut_,
        uint256 ethOut_,
        address to_
    ) internal {
        IBananaswapV1Pair(pair_).swap(tokensOut_, ethOut_, to_);
    }

    function swapTokensForETH(
        address token_,
        uint256 tokensIn_,
        uint256 minEthOut_
    ) external {
        address pair = BananaswapV1Library.getPair(factory, token_);
        BananaswapV1Library.transferFrom(token_, msg.sender, pair, tokensIn_);

        (uint256 tokenReserve, uint256 ethReserve) = BananaswapV1Library.getReserves(factory, token_);
        uint256 ethOut = BananaswapV1Library.getAmountOutLessFee(tokensIn_, tokenReserve, ethReserve);

        require(ehtOut >= minEthOut_, "BananaswapV1Router::swapTokensForEth: INSUFFICIENT_ETH_OUT");

        _swap(pair, uint256(0), ethOut, msg.sender);
    }

    // TODO only use when token's fees are turned on?
    function swapTokensWithFeeForETH(
        address token_,
        uint256 tokensIn_,
        uint256 minEthOut_
    ) external {
        address pair = BananaswapV1Library.getPair(factory, token_);
        BananaswapV1Library.transferFrom(token_, msg.sender, pair, tokensIn_);

        (uint256 tokenReserve, uint256 ethReserve) = BananaswapV1Library.getReserves(factory, token_);
        uint256 tokenBal = IERC20(token_).balanceOf(pair);
        uint256 actualTokensIn = tokenBal - tokenReserve;

        uint256 ethOut = BananaswapV1Library.getAmountOutLessFee(actualTokensIn, tokenReserve, ethReserve);

        require(ethOut >= minEthOut_, "BananaswapV1Router::swapTokensWithFeeForETH: INSUFFICIENT_ETH_OUT");

        _swap(pair, uint256(0), ethOut, msg.sender);
    }

    function swapETHForTokens(address token_, uint256 minTokensOut_) external payable {
        address pair = IBananaswapV1Factory(factory).getPair(token_);
        BananaswapV1Library.transferEth(pair, msg.value);

        (uint256 tokenReserve, uint256 ethReserve) = BananaswapV1Library.getReserves(factory, token_);
        uint256 tokensOut = BananaswapV1Library.getAmountOutLessFee(msg.value, ethReserve, tokenReserve);

        require(tokensOut >= minTokensOut_, "BananaswapV1Router::swapETHForTokens: INSUFFICIENT_TOKENS_OUT");

        _swap(pair, tokensOut, uint256(0));
    }

    // TODO only use when token's fees are turned on?
    function swapETHForTokensWithFee(address token_, uint256 minTokensOut_) external payable {
        address pair = IBananaswapV1Factory(factory).getPair(token_);

        // transfer ETH to pair
        BananaswapV1Library.transferEth(pair, msg.value);

        uint256 tokensBalBeforeSwap = IERC20(token_).balanceOf(msg.sender);

        // given ethIn, get tokensOut
        (uint256 tokenReserve, uint256 ethReserve) = BananaswapV1Library.getReserves(factory, token_);
        uint256 tokensOut = BananaswapV1Library.getAmountOutLessFee(msg.value, ethReserve, tokenReserve);

        _swap(pair, tokensOut, uint256(0), msg.sender);

        uint256 tokensBalAfterSwap = IERC20(token_).balanceOf(msg.sender);
        // Actual tokens sent to msg.sender. Equiv. to tokensOut less transaction fees.
        uint256 actualTokensOut = tokensBalAfterSwap - tokensBalBeforeSwap;
        require(
            actualTokensOut >= minTokensOut_,
            "BananaswapV1Router::swapETHForTokensWithFee: INSUFFICIENT_TOKENS_OUT"
        );
    }
}
