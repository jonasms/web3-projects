## issue-1
**[High]** refund() doesn't check if the goal isn't met

On lines 47, Campaign.sol has the following code:

    require(canceled || getDaysSince(createdAt) > 30, "This campaign is not eligible for refunds");

Consider: Add a check to ensure that the goal amount is not met.

**[High]** withdraw() doesn't check if the time is not completed.

On lines 39, Campaign.sol has the following code:

    require(!canceled && goalMet, "Requirements to withdraw not met");

## issue-2
An owner can remove funds before the time period is over. If a crowdfund was going to unsuccessful, the owner can drain
all funds and stop users from withdrawing. 

Consider: Add a check to ensure that the time is not completed.

## issue-3
**[Low]** receive() doesn't correctly calculate NFT mint amount

On lines 67-71, Campaign.sol has the following code:

        uint256 i = msg.value;
        while (i >= 1 ether) {
            mintToken(msg.sender);
            i = i - 1 ether;
        }

This only checks the msg.value of the current transaction. It is possible for a user to contribute 1.5 ETH in one tx
and another 1.5 ETH in another tx. They should be minted 3 NFTs but will only be minted 2. 

Consider: Adding checking the user's NFT balance and subtracting that from their contribution total to calculate the 
required mints.

## issue-4
**[Low]** isGoalMet uses this.balance

On lines 63, Campaign.sol has the following code:

    if (isGoalMet(address(this).balance)) 

Consider: Saving the total contribution amount and use that for the goal check.

## issue-5
**[Low]** Owner can cancel after the goal is met and block his withdrawals

On lines 34 and 38-9, Campaign.sol has the following code:

    require(!canceled, "Campaign is already canceled"); //34
    
    function withdraw(uint256 _amount) external onlyOwner {
        require(!canceled && goalMet, "Requirements to withdraw not met");

An owner can cancel the campaign after it was succesful and will not able to withdraw.

Consider: Add a check in cancel() that checks if the campaign was succesful.

## issue-6
**[Code Quality]** SafeMath not required in >= 0.8 code

Consider: Remove: using SafeMath for uint256;

## issue-7
**[Code Quality]** mintToken returns an unused value

On line 13, ContributorBadge.sol has the following code:

    function mintToken(address _contributor) internal returns (uint256) {

Consider: Removing the return value from mintToken.
