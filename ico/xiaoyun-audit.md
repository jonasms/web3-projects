## Can purchase tokens over limit
Inside Line 76 function purchase(), it seems `tokenPurchaseLimit` in certain situations won't return the correct limit.

Since users need to manually call `mintTokens` for the tokens they purchased during SEED and GENERAL phase, and `totalSupply` won't increase until `mintTokens` is called, if whitelisted users buy tokens during SEED and GENERAL phase, then after entering OPEN phase, but before they have minted their tokens, another user wants to buy tokens, then he can purchase over limit because `tokenPurchaseLimit` in line 84 would return  `MAX_ICO_RAISE`

Steps:
- Whitelisted user A buys 1500 ethers of tokens during SEED phase (should have 7500 tokens, leaving 142500 available for other users to purchase)
- Owner advances phase into OPEN
(** user A haven't called mintTokens to mint yet)
- Now user B wants to buy tokens, what should be available to hims is:
```
MAX_ICO_RAISE - user A's token
150000 - 7500 = 142500
```

but in purchase(), 
```
uint256 tokenPurchaseLimit = Math.min(
    phase.totalTokenLimit - getNumTokensOutstanding(),
    phase.individualTokenLimit - tokensOwedTo
);
```
- `getNumTokensOutstanding()` would return `totalSupply()` during OPEN phase, which is 0, because no one has minted any tokens yet
- `tokensOwedTo` would return 0 because user B is purchasing for the first time

So `tokenPurchaseLimit` would be:
```
Math.min(150000 - 0, 150000 - 0) 
```
which equals to 150000, is over what should be available to him (142500).

## Initialize all variables
Probably optional but recommended by slither docs
- line 89: could explicitly initialize `etherToRefund` to 0 for improving code readability: https://github.com/crytic/slither/wiki/Detector-Documentation#uninitialized-local-variables
- same for line 185: `transactionFee`


## Nitpicks 

- line 116: Mentioned in the lecture, enum should bea able to automatically handle going over Phase.Open, probably can remove the require statement to shrink the code size
- line 143: typo: iff