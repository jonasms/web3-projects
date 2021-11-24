//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface NftMarketplace {
    function getPrice(address nftContract, uint256 nftId) external returns (uint256 price);

    function buy(address nftContract, uint256 nftId) external payable returns (bool success);
}

contract Proposal {
    address marketplaceAddr;

    constructor(address marketplaceAddr_) {
        marketplaceAddr = marketplaceAddr_;
    }

    function buyNft(address nftContract, uint256 nftId) external payable {
        uint256 price = NftMarketplace(marketplaceAddr).getPrice(nftContract, nftId);

        if (price >= msg.value) {
            bool success = NftMarketplace(marketplaceAddr).buy{ value: price }(nftContract, nftId);
            require(success, "buyNft: nft purchase failed");
        }
    }
}
