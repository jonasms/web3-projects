# README
This project is comprised of a series of contracts for achieving the following:
1. Set up liquidity pools that enable swapping any ETH - ERC20 pair.
2. Provide a contract that abstracts away the complexity of depositing perfectly balanced ETH - ERC20 pairs.
3. Factory contract for deploying ETH - ERC20 pairs.
4. Transfer funds from an ERC20 ICO contract to the LP contract

# Known Issues
1. It would be simpler, safer, and less expensive to transfer funds from the ICO contract to an ETH - STO pool by executing `BananaswapV1Router::depositLiquidity()` from `SotanoCoin::purchase()` (when ETH is received).

## Deployed Contracts (Rinkeby Network)
Token Contract: 0x388154F2dBe394F2aE2124d4E93b0D81A1BC2516
BananaswapV1Factory: 0x684220239c61d8cb784f339FC0562b7A54B2c354
