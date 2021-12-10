// // SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "./interfaces/IBananaswapV1ERC20.sol";

contract BananaswapV1ERC20 is IBananaswapV1ERC20 {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function _mint(address to_, uint256 value_) internal {
        balanceOf[to_] += value_;
        totalSupply += value_;
    }

    function _burn(address from_, uint256 value_) internal {
        require(from_ != address(0), "BananswapV1ERC20::_burn: ZERO_ADDRESS");
        uint256 amount = balanceOf[from_];
        require(amount >= value_, "BananswapV1ERC20::_burn: INSUFFICIENT_FUNDS");
        balanceOf[from_] -= value_;
        totalSupply -= value_;
    }

    function _transfer(
        address from_,
        address to_,
        uint256 value_
    ) internal {
        balanceOf[from_] -= value_;
        balanceOf[to_] += value_;
    }

    function transfer(address to_, uint256 value_) external returns (bool) {
        require(to_ != address(0), "BananswapV1ERC20::transferFrom: TRANSFER_TO_ZERO_ADDRESS");
        require(balanceOf[msg.sender] >= value_, "BananswapV1ERC20::transfer: INSUFFICIENT_FUNDS");

        _transfer(msg.sender, to_, value_);

        // TODO emit Transfer event

        return true;
    }

    // transferFrom
    function transferFrom(
        address from_,
        address to_,
        uint256 value_
    ) external returns (bool) {
        require(from_ != address(0), "BananswapV1ERC20::transferFrom: TRANSFER_FROM_ZERO_ADDRESS");
        require(to_ != address(0), "BananswapV1ERC20::transferFrom: TRANSFER_TO_ZERO_ADDRESS");
        require(allowance[from_][to_] >= value_, "BananswapV1ERC20::transferFrom: INSUFFICIENT_ALLOWANCE");

        allowance[from_][to_] -= value_;
        _transfer(from_, to_, value_);

        // TODO emit TransferFrom event

        return true;
    }

    function approve(address to_, uint256 amount_) external returns (bool) {
        allowance[msg.sender][to_] = amount_;
        return true;
    }
}
