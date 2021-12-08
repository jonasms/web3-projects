# Liquidity Pool Project README

## Design Exercise

**How would you extend your LP contract to award additional rewards – say, a separate ERC-20 token – to further incentivize liquidity providers to deposit into your pool?**

Hook pattern:

1. Add a virtual (i.e. overridable) method, perhaps named `_transfer()`, to `BananaswapV1Pair::mint` and `BananaswapV1Pair::burn`.

2. Overwrite `BananaswapV1Pair::_transfer` in `BananaswapV1Router` in such a way that calculates the award tokens to be distributed and executes the transactions.

This pattern would enable an existing pool to add this feature just by deploying a new Router contract. Furthermore, this pattern would allow for granting award tokens on mint, burn, or both.

Adding separate hooks for `BananaswapV1Pair::mint` and `BananaswapV1Pair::burn` may work better, (e.g. `BananaswapV1Pair::_onMint` and `BananaswapV1Pair::_onBurn`).

## Notes to auditor

### No Front End Extension

As I'm familiar with front end development and rather focus on smart contracts, I decided against spending the time to extend the front end.

### Using a factory; perhaps out of spec

I'm not sure if using a factory to create Pair contracts is out of spec. I decided to do so because I wanted to deepen my familiarity with factories.

## Deployed Contracts (Rinkeby Network)

Token Contract: 0x388154F2dBe394F2aE2124d4E93b0D81A1BC2516
BananaswapV1Factory: 0x684220239c61d8cb784f339FC0562b7A54B2c354
BananaswapV1Router: 0x5c2722375dC9fba306258764d0d2Fc3b58B2DBA8
BananaswapV1Pair:

(note: the Pair contract is deployed via `BananaswapV1Router::depositLiquidity`. As doing so on a testnet (or the mainnet) effectively requires a UI compatable w/ a wallet, I didn't deploy the Pair contract to Rinkeby.)

## Changes I would make given more time

### Use CREATE2 in BananaswapV1Factory::createPair when creating a new pair contract.

As CREATE2 produces contracts with a deterministic address, Pair contract addresses can be fetched without making a transaction. Currently, Pair contract addresses are fetched using `BananaswapV1Factory::getPair` which instantiates a transaction.

### Create functions for swapping Tokens for ETH, and vice versa, that don't support Token transaction fees.

Currently, the only two methods in `BananaswapV1Router` for swapping Tokens <=> ETH support Token transaction fees. While I believe they both would work when token fees are turned off, the extra checks they made in order to account for the fees would unecessarily increase gas costs.

Given more time, I would implement swap functions that don't take into account Token transaction fees. The frontend would need to only call them when the Token is not taxing transactions -- otherwise, I expect, the swaps would fail, invoking the following error: `BananaswapV1Pair::swap: INVALID_K`.

### Implement the **lock** modifier pattern for the following methods

1. `BananaswapV1Pair::mint`
2. `BananaswapV1Pair::burn`
3. `BananaswapV1Pair::swap`

As each of the methods above is deal with moving funds AND is making calls to external, unknown, contracts, the `lock` pattern would protect against re-entrancy attacks. As are, these methods are exposed to such attacks.
