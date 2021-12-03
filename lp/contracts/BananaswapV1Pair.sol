// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./BananaswapV1.sol";
import "./libraries/Math.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract BananaswapV1Pair is BananaswapV1 {
    uint256 public constant MIN_LIQUIDITY = 10**3;

    address token;
    uint256 tokenReserve;
    uint256 ethReserve;
    uint256 ethBalance; // TODO just use native balance?

    constructor(address token_) {
        token = token_;
    }

    function getReserves() public view returns (uint256, uint256) {
        return (tokenReserve, ethReserve);
    }

    function mint(address to_) external returns (uint256 liquidity) {
        // get qty of deposits
        uint256 tokenBal = IERC20(token).balanceOf(address(this));
        uint256 _ethBal = ethBalance;

        uint256 tokenAmt = tokenBal - tokenReserve;
        uint256 ethAmt = _ethBal - ethReserve;

        // calculate liquidity to grant to LP
        uint256 _totalSupply = totalSupply;

        // handle initial liquidity deposit
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(tokenAmt * ethAmt) - MIN_LIQUIDITY;
            _mint(address(0), MIN_LIQUIDITY);
        } else {
            liquidity = Math.min((tokenAmt / tokenReserve) * _totalSupply, (ethAmt / ethReserve) * _totalSupply);
        }

        _mint(to_, liquidity);
    }

    // receives ETH payments
    function _receiveEth(uint256 amount_) internal {
        ethBalance += amount_;
    }

    function transferEth() external payable {
        _receiveEth(msg.value);
    }

    // burn
    // swap
    // _update

    receive() external payable {
        _receiveEth(msg.value);
    }
}
