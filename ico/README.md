# ICO Project

## Spec
1. Aims to raise 30,000 ETH via an ICO
2. Has a max total supply of 500,000 tokens.
3. The ICO has 3 phases
    a. Phase Seed
        i. Only available to whitelisted investors.
        ii. Max total contribution limit of 15,000 ETH.
        iii. Max individual contribution limit of 1,500 ETH.
        iv. Should not automatically enter this phase at time of contract deployment.
    b. Phase General
        i. Total contribution limit of 30,000 ETH, inclusive of funds raised during Phase Seed.
        ii. Max individual contribution limit is 1,000 ETH.
    c. Phase Open
        i. No max individual contribution limit.
        ii. ICO contract releases ERC20-compatible tokens to all contributors.
    d. Misc
        i. If a contribution exceed's the phase's limit then only accept up to the limit. Refund the rest.
        ii. Individual limits do not reset when phases change.
        iii. Each phase has the same exchange rate of 5 tokens per 1 ETH.
4. Owner of the contract can
    a. Pause/resume fundraising (sale of tokens) at any time.
    b. Move a phase forward (but not backwards)
5. Can collect a 2% tax on every transfer
    i. Can be toggled on/off by the owner. Initialized to 'off'.
    ii. Collected tax revenue is placed into a treasury account.
    iii. 2% is reduced from each transfer.


### Questions
