// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "../interfaces/IBananaswapV1Factory.sol";
import "../interfaces/IBananaswapV1Pair.sol";

library BananaswapV1Library {
    // TODO remove, not being used
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "BananswapLibrary.sortTokens(): IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "BananswapLibrary.sortTokens(): ZERO_ADDRESS");
    }

    function getReserves(address factory, address token)
        internal
        view
        returns (uint256 tokenReserves, uint256 ethReserves)
    {
        // TODO can get pair address w/out an external call using CREATE2 in factory.createPair()
        address pair = IBananaswapV1Factory(factory).getPair(token);
        (tokenReserves, ethReserves) = IBananaswapV1Pair(pair).getReserves();
    }

    // copied from https://github.com/Uniswap/v2-periphery/blob/master/contracts/libraries/UniswapV2Library.sol
    function quote(
        uint256 amountA_,
        uint256 reserveA_,
        uint256 reserveB_
    ) internal pure returns (uint256 amountB) {
        require(amountA_ > 0, "BananaswapV1Library::quote(): INSUFFICIENT_AMOUNT");
        require(reserveA_ > 0 && reserveB_ > 0, "BananaswapV1Library::quote(): INSUFFICIENT_LIQUIDITY");
        amountB = (amountA_ * reserveB_) / reserveA_;
    }

    // copied from https://github.com/Uniswap/solidity-lib/blob/master/contracts/libraries/TransferHelper.sol
    function transferFrom(
        address token_,
        address from_,
        address to_,
        uint256 value_
    ) internal {
        // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
        (bool success, bytes memory data) = token_.call(abi.encodeWithSelector(0x23b872dd, from_, to_, value_));
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "BananaswapV1Library::transferFrom: TRANSACTION_FAILED"
        );
    }

    function transferEth(address to_, uint256 value_) internal {
        (bool success, bytes memory data) = to_.call{ value: value_ }("");
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "BananaswapV1Library::transferEth: TRANSACTION_FAILED"
        );
    }

    // getAmountOut()
}
