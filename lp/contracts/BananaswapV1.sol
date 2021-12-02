// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

contract BananaswapV1 {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    function _mint(address to_, uint256 value_) internal {
        balanceOf[to_] += value_;
        totalSupply += value_;
    }

    function _burn(address from_, uint256 value_) internal {
        require(from_ != address(0), "Bananswap._burn: ZERO_ADDRESS");

        uint256 amount = balanceOf[from_];
        require(amount >= value_, "Bananswap._burn: INSUFFICIENT_FUNDS");

        balanceOf[from_] -= value_;
        totalSupply -= value_;
    }
    // transfer(), transferFrom()?
}
