// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Helper.sol";

// contract Factory {
//     Campaign[] public campaigns;
//     mapping(uint256 => address) public campaignToOwner;

//     function createCampaign(string memory _name, uint256 _goal) public returns (uint256) {
//         Campaign campaign = new Campaign(_name, _goal);
//         campaign.transferOwnership(msg.sender);
//         campaigns.push(campaign);
//         uint256 campaignID = campaigns.length - 1;
//         campaignToOwner[campaignID] = msg.sender;
//         // TODO emit event
//         return campaignID;
//     }

//     function getCampaign(uint256 _id) public view returns (Campaign) {
//         return campaigns[_id];
//     }
// }

contract Campaign is Ownable, Helper {
    string public name;
    uint256 public goal;
    uint256 public createdAt;
    bool public canceled;
    bool public goalMet;
    mapping(address => uint256) public contributors;

    constructor(string memory _name, uint256 _goal) {
        name = _name;
        goal = _goal;
        createdAt = block.timestamp;
    }

    function getContributor(address _contributor) public view returns (uint256) {
        return contributors[_contributor];
    }

    function cancel() external onlyOwner {
        require(!canceled, "Campaign is already canceled");
        canceled = true;
    }

    function withdraw(uint256 _amount) external onlyOwner {
        require(!canceled && goalMet, "Requirements to withdraw not met");
        require(_amount <= address(this).balance, "Cannot withdraw more than total value");
        (bool success, ) = msg.sender.call{ value: _amount }("");
        require(success, "Transaction failed");
    }

    function contribute() external payable {
        require(address(this).balance < goal, "This campaign has already reached its goal");
        require(getDaysSince(createdAt) <= 30, "This campaign has expired");
        require(msg.value >= 0.01 ether, "Need to contribute at least 0.01ETH");

        contributors[msg.sender] += msg.value; // TODO scrutinize for vulnerability
        // TODO handle transfering NFT to contributer
    }
}
