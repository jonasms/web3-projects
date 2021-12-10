# Liquidity Pool Project README

## Design Exercise

**How would you extend your LP contract to award additional rewards – say, a separate ERC-20 token – to further incentivize liquidity providers to deposit into your pool?**

Hook pattern:

1. Add a virtual (i.e. overridable) method, perhaps named `_transfer()`, to `BananaswapV1Pair::mint` and `BananaswapV1Pair::burn`.

2. Overwrite `BananaswapV1Pair::_transfer` in `BananaswapV1Router` in such a way that calculates the award tokens to be distributed and executes the transactions.

This pattern would enable an existing pool to add this feature just by deploying a new Router contract. Furthermore, this pattern would allow for granting award tokens on mint, burn, or both.

Adding separate hooks for `BananaswapV1Pair::mint` and `BananaswapV1Pair::burn` may work better, (e.g. `BananaswapV1Pair::_onMint` and `BananaswapV1Pair::_onBurn`).

## Notes to auditor

I implemented a factory and various functions to support that architecture in `BananaswapV1Library`. This is out of spec and would require more of your time to audit. For the sake of saving your own time, please feel free to ignore them and only take a look at the Pair and Router contracts.

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
