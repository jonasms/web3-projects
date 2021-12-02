// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

contract BananaswapV1 {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    function _mint(address to, uint256 value) internal {
        balanceOf[to] += value;
        totalSupply += value;
    }

    function _burn(address from, uint256 value) internal {
        require(from != address(0), "Bananswap._burn: CANNOT BURN FROM ADDRESS 0");

        uint256 amount = balanceOf[from];
        require(amount >= value, "Bananswap._burn: INSUFFICIENT FUNDS");

        balanceOf[from] -= value;
        totalSupply -= value;
    }
    // transfer(), transferFrom()?
}
