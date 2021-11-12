// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Helper.sol";
import "./ContributorBadge.sol";

contract Campaign is Ownable, Helper, ContributorBadge {
    using SafeMath for uint256;

    string public campaignName;
    uint256 public goal;
    uint256 public createdAt;
    bool public canceled;
    bool public goalMet;
    mapping(address => uint256) public contributors;

    constructor(string memory _campaignName, uint256 _goal) {
        campaignName = _campaignName;
        goal = _goal;
        createdAt = block.timestamp;
    }

    function getContributor(address _contributor) public view returns (uint256) {
        return contributors[_contributor];
    }

    function isGoalMet(uint256 _balance) internal view returns (bool) {
        return _balance >= goal;
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
        require(!goalMet && !canceled && getDaysSince(createdAt) <= 30, "This campaign is no longer active");
        require(msg.value >= 0.01 ether, "Need to contribute at least 0.01ETH");

        contributors[msg.sender] = contributors[msg.sender].add(msg.value);

        if (isGoalMet(address(this).balance)) {
            goalMet = true;
        }

        uint256 i = msg.value;
        while (i >= 1 ether) {
            mintToken(msg.sender);
            i = i - 1 ether;
        }
    }

    function refund() external payable {
        require(canceled || getDaysSince(createdAt) > 30, "This campaign is not eligible for refunds");
        require(contributors[msg.sender] > 0, "You don't have any funds to be refunded");

        uint256 amountToRefund = contributors[msg.sender];
        contributors[msg.sender] = 0;
        (bool success, ) = msg.sender.call{ value: amountToRefund }("");
        require(success, "Transaction failed");
        // TODO Refund event
    }
}
