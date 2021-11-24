//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface NftMarketplaceInt {
    function getPrice(address nftContract, uint256 nftId) external returns (uint256 price);

    function buy(address nftContract, uint256 nftId) external payable returns (bool success);

    function addNftContract(address nftContract_, uint256[2][] calldata nfts_) external;
}

contract Proposal {
    address marketplaceAddr;

    constructor(address marketplaceAddr_) {
        marketplaceAddr = marketplaceAddr_;
    }

    function buyNft(address nftContract, uint256 nftId) external payable {
        uint256 price = NftMarketplaceInt(marketplaceAddr).getPrice(nftContract, nftId);

        if (price >= msg.value) {
            bool success = NftMarketplaceInt(marketplaceAddr).buy{ value: price }(nftContract, nftId);
            require(success, "buyNft: nft purchase failed");
        }
    }
}
