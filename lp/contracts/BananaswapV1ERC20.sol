// // SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./interfaces/IBananaswapV1ERC20.sol";

// TODO remove
import "hardhat/console.sol";

contract BananaswapV1ERC20 is IBananaswapV1ERC20 {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function _mint(address to_, uint256 value_) internal {
        balanceOf[to_] += value_;
        totalSupply += value_;
    }

    function _burn(address from_, uint256 value_) internal {
        require(from_ != address(0), "Bananswap::_burn: ZERO_ADDRESS");
        uint256 amount = balanceOf[from_];
        require(amount >= value_, "Bananswap::_burn: INSUFFICIENT_FUNDS");
        balanceOf[from_] -= value_;
        totalSupply -= value_;
    }

    // transfer

    // transferFrom
    function transferFrom(
        address from_,
        address to_,
        uint256 value_
    ) external returns (bool) {
        require(from_ != address(0), "Bananswap::transferFrom: TRANSFER_FROM_ZERO_ADDRESS");
        require(to_ != address(0), "Bananswap::transferFrom: TRANSFER_TO_ZERO_ADDRESS");
        require(allowance[from_][to_] >= value_, "Bananswap::transferFrom: INSUFFICIENT_ALLOWANCE");

        // reduce allowance by value
        allowance[from_][to_] -= value_;

        console.log("CUR BAL: ", balanceOf[from_]);
        console.log("VALUE: ", value_);
        // transfer
        // TODO use _transfer()?
        balanceOf[from_] -= value_;
        balanceOf[to_] += value_;
        return true;
    }

    // approve
    function approve(address to_, uint256 amount_) external returns (bool) {
        allowance[msg.sender][to_] = amount_;
        return true;
    }

    // permit
}
