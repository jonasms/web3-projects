// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/utils/Create2.sol";
import "../interfaces/IBananaswapV1Factory.sol";
import "../interfaces/IBananaswapV1Pair.sol";

library BananaswapV1Library {
    function getPair(address factory_, address token_) internal pure returns (address pair) {
        bytes32 salt = keccak256(abi.encodePacked(token_));
        pair = Create2.computeAddress(
            salt,
            hex"04e64c39f3e01d48508c8c4f1f39f59b09903259d537a99d90c39a45943c0778", // BananaswapV1Pair bytecode hash
            factory_
        );
    }

    function getReserves(address factory_, address token_)
        internal
        view
        returns (uint256 tokenReserves, uint256 ethReserves)
    {
        address pair = getPair(factory_, token_);
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

    // given an amount in, returns the corresponding amount out required to maintain K, less fees
    function getAmountOutLessFee(
        uint256 amountIn_,
        uint256 reserveIn_,
        uint256 reserveOut_
    ) internal pure returns (uint256 amountOut) {
        uint256 amountInLessFee = amountIn_ * 99;
        amountOut = (amountInLessFee * reserveOut_) / ((reserveIn_ * 100) + amountInLessFee);
    }

    // given an amount out, returns the corresponding amount in required to maintain K, less fees
    function getAmountInLessFee(
        uint256 amountOut_,
        uint256 reserveIn_,
        uint256 reserveOut_
    ) internal pure returns (uint256 amountOut) {
        uint256 amountInLessFee = amountOut_ * 99;
        amountOut = (amountInLessFee * reserveOut_) / (reserveIn_ * 100) + amountInLessFee;
    }

    // copied from https://github.com/Uniswap/solidity-lib/blob/master/contracts/libraries/TransferHelper.sol
    function transfer(
        address token_,
        address to_,
        uint256 value_
    ) internal {
        // bytes4(keccak256(bytes('transfer(address,uint256)')));
        (bool success, bytes memory data) = token_.call(abi.encodeWithSelector(0xa9059cbb, to_, value_));
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "TransferHelper::safeTransfer: transfer failed"
        );
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
