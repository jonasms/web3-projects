The following is a micro audit of https://github.com/Hacker-DAO/student.JonasMS/tree/ec1dd53f5e012f9f18b3c36f443cc5bf14041f6b/crowdfund by Gab

## Design Exercise

Only mentioning token metadata is an incomplete answer. Where is this information stored? How exactly do you keep track of which tokens are which tiers?


## General Comments

- `campaignToOwner` is an extra feature. It's also unnecessary; if you know the campaignId, you can call the `owner()` function of that campaign.
- `_projectName` is an extra feature.


## issue-1

**[High]**  The logic for awarding badges is wrong

An user should be awarded a badge for every ETH he contributed, however, following the logic on your receive() function, he's only going to get a badge according to the value he donates per-call.
The contract should keep track of how much the user has contributed in total (which it does) and then award a badge based on total contribution, in your contract, if an user donates 0.9 ETH and follows up with a 0.1 ETH donation, they wouldn't get a badge, but they should! 


## issue-2

**[Medium]** Contributors can withdraw from a successful project

`Campaign.refund()` allows anyone to call it after 30 days. Per the requirements, contributors cannot withdraw unless the project fails or is cancelled.


## issue-3

**[low]** Project can be canceled after the goal is met

`Campaign.cancel()` doesn't check if the campaign has been fully funded already, this could be an issue since the owner may have already withdrawn x amount of funds and only some users would get their money back


## issue-4

**[Code quality]** Unnecessary import

`Factory.sol`, imports `Ownable` but never uses it


## issue-5

**[Code Quality]** Unnecessary use of `Counters`

The use of the Counters contract is not necessary. Simply use a uint and increment it.


## issue-6

**[Code Quality]** public functions could be external (reduces gas costs)

- `Campaign.getContributor(address)` should be declared external
- `Factory.createCampaign(string,uint256)` should be declared external


## issue-7

**[Code Quality]** isGoalMet unnecessarily a function

`isGoalMet` is defined, but only used in one place within the contract. It is also not useful as a public view function, since the caller needs to supply a balance argument.

Consider removing the paramater & using the contract balance directly, or removing the function entirely.


## Nitpicks

-  `SafeMath` isn't needed from Solidity 0.8 onwards
-  I like the approach of a Helper contract, but Solidity offers a specific "Library" for this case: [https://www.tutorialspoint.com/solidity/solidity_libraries.htm](https://www.tutorialspoint.com/solidity/solidity_libraries.htm)
- `mapping(address => uint256) public contributors` could be named more clearly
- `canceled || getDaysSince(createdAt) > 30` could be moved to a modifier 


## Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | 2 |
| Vulnerability              | 6 |
| Unanswered design exercise | - |

Total: 8
Good effort!

