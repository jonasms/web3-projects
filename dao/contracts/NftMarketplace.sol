//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
    THIS IS A MOCK CONTRACT FOR TESTING PURPOSES
*/

contract NftMarketplace {
    struct Nft {
        address owner;
        uint256 price;
    }

    struct NftContract {
        mapping(uint256 => Nft) nfts;
    }

    mapping(address => NftContract) nfts;

    function addNftContract(address nftContract_, uint256[2][] calldata nfts_) external {
        NftContract storage nftContract = nfts[nftContract_];

        for (uint256 i = 0; i < nfts_.length; i++) {
            nftContract.nfts[nfts_[i][0]] = Nft(msg.sender, nfts_[i][1]);
        }
    }

    function getPrice(address nftContract_, uint256 nftId_) external view returns (uint256 price) {
        NftContract storage nftContract = nfts[nftContract_];
        return nftContract.nfts[nftId_].price;
    }

    function buy(address nftContract_, uint256 nftId_) external payable returns (bool success) {
        NftContract storage nftContract = nfts[nftContract_];
        Nft storage nft = nftContract.nfts[nftId_];

        require(msg.value >= nft.price, "buy: insufficient funds");

        nft.owner = msg.sender;

        return true;
    }
}
