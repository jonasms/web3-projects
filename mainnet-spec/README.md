# Mainnet Project

## Description

A smart contract for collective ownership of an asset and distribution of profits of said asset.

The contract has a guardian account with special privileges to execute arbitrary transactions for the contract.

The purpose of this feature is to enable the contract to invest collected revenues and liquidate said investments in order to make the funds available for withdraw.

## Spec

1. Users can purchase and transfer shares of the given asset with ERC20 tokens.
2. The contract's guardian can execute arbitrary transactions.
3. Collected revenues are made available to token owners for withdrawl, according to a schedule, via a `withdraw()` method.
   - Users can withdraw funds according to their share of tokens and for what portion of the given collection period those tokens were owned for.
