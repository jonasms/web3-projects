// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

contract Helper {
    function getDaysSince(uint256 startDate) internal view returns (uint256) {
        uint256 todayDate = block.timestamp;
        return (todayDate - startDate) / 60 / 60 / 24;
    }
}
