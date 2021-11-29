//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// TODO remove
import "hardhat/console.sol";

interface NftMarketplaceInt {
    function getPrice(uint256 nftContract, uint256 nftId) external returns (uint256 price);

    function buy(
        uint256 nftContract,
        uint256 nftId,
        address buyer
    ) external payable returns (bool success);

    function addNftContract(uint256 nftContract_, uint256[2][] calldata nfts_) external;
}

contract Proposal {
    address marketplaceAddr;

    constructor(address marketplaceAddr_) {
        marketplaceAddr = marketplaceAddr_;
    }

    function buyNft(uint256 nftContractId_, uint256 nftId_) external payable {
        uint256 price = NftMarketplaceInt(marketplaceAddr).getPrice(nftContractId_, nftId_);

        if (price >= msg.value) {
            bool success = NftMarketplaceInt(marketplaceAddr).buy{ value: price }(nftContractId_, nftId_, msg.sender);
            require(success, "buyNft: nft purchase failed");
        } else {
            revert("NFT price is greater than the value given.");
        }
    }
}
