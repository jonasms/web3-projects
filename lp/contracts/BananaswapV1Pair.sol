// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./BananaswapV1ERC20.sol";
import "./libraries/Math.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract BananaswapV1Pair is BananaswapV1ERC20 {
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

        _update(tokenBal, _ethBal);
        // TODO emit Mint event
    }

    function burn(address from_) external returns (uint256 tokenAmt, uint256 ethAmt) {
        // get liquidity burned
        uint256 liqudityToBurn = balanceOf[address(this)];
        uint256 tokenBal = IERC20(token).balanceOf(address(this));
        // get balances?

        // get tokenAmt and ethAmt
        tokenAmt = tokenBal * (liqudityToBurn / totalSupply);
        ethAmt = address(this).balance * (liqudityToBurn / totalSupply);

        // burn liquidity
        _burn(from_, liqudityToBurn);
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
    function _update(uint256 tokenBalance_, uint256 ethBalance_) private {
        tokenReserve = tokenBalance_;
        ethReserve = ethBalance_;

        // emit Sync event
    }

    receive() external payable {
        _receiveEth(msg.value);
    }
}
