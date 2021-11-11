// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Campaign.sol";

contract Factory {
    Campaign[] public campaigns;
    mapping(uint256 => address) public campaignToOwner;

    function createCampaign(string memory _name, uint256 _goal) public returns (uint256) {
        Campaign campaign = new Campaign(_name, _goal);
        campaign.transferOwnership(msg.sender);
        campaigns.push(campaign);
        uint256 campaignID = campaigns.length - 1;
        campaignToOwner[campaignID] = msg.sender;
        // TODO emit event
        return campaignID;
    }

    function getCampaign(uint256 _id) public view returns (Campaign) {
        return campaigns[_id];
    }
}
