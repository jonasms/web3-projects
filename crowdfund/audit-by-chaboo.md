# Micro audit performed on Nov 13, 2021

> Author: Dragan Cabarkapa - chaboo

> commmit: 1d7b885

## issue-1

**[Medium]** Broken specification requirement related to refunds

Contributor can get refund even after project reached its funding goal successfully. By specification it is only possible for campaign owner to withdraw funds at this stage.

On line 47, Campaign.sol has the following code:

    require(canceled || getDaysSince(createdAt) > 30, "This campaign is not eligible for refunds");
    require(contributors[msg.sender] > 0, "You don't have any funds to be refunded");

Notice that there is no condition check that project's goal has not been met.

## issue-2

**[Medium]** Improper calculation for NFT rewards 

Improper calculation for rewarding contributors with NFT badges in cases when contribution amounts are not divisible by 1 ether. Remainders should accrue and be accounted in case of followup contributions.

On line 68, Campaign.sol has the following code:

    while (i >= 1 ether) {
        mintToken(msg.sender);
        i = i - 1 ether;
    }

Notice that there is no code for handling remainders in case when contribution is not divisible by 1 ether.

## issue-3

**[Medium]** Broken specification requirement related to project cancelation

Owner can cancel project even after project reached its funding goal successfully.

On line 33, Campaign.sol has the following code:

    function cancel() external onlyOwner {
        require(!canceled, "Campaign is already canceled");
        canceled = true;
    }

Notice that there is no check that project's goal has not been met. Owner can withdraw funds because project goal has been met and then cancel project since there is no check. In this scenario even though project is canceled contributors won't be able to get any refund.

Not marked as __High__ because owner by specification has capability of taking contributor funds anyways in situation when campaign funding goal has been reached.

## issue-4

**[Code quality]** Performance optimization

Consider calculating campaign deadline in constructor instead of storing campaign's createdAt. With that change Helper.sol becomes unnecessary and it reduces gas costs since there will be no additional arithmetic operations on each condition check

## issue-5

**[Code quality]** Duplicate code

On line 21, Factory.sol has the following code:

    function getCampaign(uint256 _id) public view returns (Campaign) {
      return campaigns[_id];
    }

Function with almost identically signature is automatically generated for public variable __campaigns__. Remove function from source code, recompile contract and check Factory.json in dir artifacts/contracts/Factory.sol.

## issue-6

**[Code quality]** Duplicate code

On line 25, Campaign.sol has the following code:

    function getContributor(address _contributor) public view returns (uint256) {
        return contributors[_contributor];
    }

Function with almost identically signature is automatically generated for public variable __contributors__. Remove function from source code, recompile contract and check Campaign.json in dir artifacts/contracts/Campaign.sol.

## issue-7

**[Code quality]** Unnecessary use of SafeMath

On line 10, Campaign.sol has the following code:

    using SafeMath for uint256;

Solidity since version 0.8.0 [see here](https://docs.soliditylang.org/en/v0.8.0/080-breaking-changes.html#silent-changes-of-the-semantics) provides built in protections from underflow and overflow on arithmetic operations. Therefore, there is no need for using SafeMath anymore.

## Nitpicks

- Unnecessary import of Ownable.sol in Factory.sol
- While Ownable contract provides additional flexibility, and capability of doing transfer ownership, consider setting Campaign contract owner through constructor argument and not using Ownable at all since it doesn't provide additional value in this concrete scenario with such simple specification
- In Campaign.sol refund function has mutability attribute of payable which is not necessary since users are not required to send ether to this function
- While receive can be used instead of concrete contribute payable function, I believe having specific function is considered best practice because it is part of your custom interface. Also in absence of receive, transactions that send ether directly to contract will fail so we don't need to worry about ether getting trapped.
- Consider adding events on important changes within contract for easier tracking and monitoring by 3rd parties off chain

