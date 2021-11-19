# ICO Project

## Design Question
### Question:
The base requirements give contributors their SPC tokens immediately. How would you design your contract to vest the awarded tokens instead, i.e. award tokens to users over time?

### Solution:
The exact implementation depends on vesting details such as whether a static number of tokens vest over a period of time, or a % of tokens that vest per vesting period.

In the current contract I have the following:
```
mapping(address => uint256) public investorToTokensOwed;
```

I would change this to:
```
struct Investment {
    uint tokensOwed;
    uint vestPerPeriod;
}

mapping(address => Investment) public investorToTokensOwed;
```

Where `vestPerPeriod` represents the exact number of tokens to vest per period.

Writing to `investorToTokensOwed` would look something like:
```
Investment memory investment = investorToTokensOwed[msg.sender];
uint newTokensOwed = numTokensToPurchase + investment.tokensOwed;
uint newVestPerPeriod = newTokensOwed / 4; // 4 vesting periods, for example.
investorToTokensOwed[msg.sender] = Investment(newTokensOwed, newVestPerPeriod)
```

I would then automate executing on the vesting period using a web2 server, most likely written in either Node or Python.


## Running in Rinkeby
### Set up ENV variables:
Add the following to `/ico/.env`
```
INFURA_API_KEY=01e220f616c64549a5f86f8ea456ad40
DEV_WALLET_PRIVATE_KEY=[private_key_to_a_wallet_on_the_rinkeby_network]
```
For `DEV_WALLET_PRIVATE_KEY` don't include `0x` -- that's included for you in the hardhat config.

If you get an error about a "mnemonic", add the following to that `.env`:
`MNEMONIC=exotic accident planet click stem age cotton treat supreme chronic ice track update talk walk`

And add the following to `/ico/web/.env`
```
REACT_APP_CONTRACT_ADDRESS=0xc160275989DF70234d0Ae606428BCcfA5B57dBeF
```

That's the address of this contract deployed to the rinkeby network.

### Run the front end locally:
1. From `/ico/web` run `yarn start`.
2. If a browser window doesn't open automatically for you, navigate to `http://localhost:3000/`.
3. Once you login via Metamask you should be redirected to `http://localhost:3000/investor`.

### Interact with the contract via hardhat's console:
```
npx hardhat console --network rinkeby

...

Coin = await ethers.getContractFactory("SotanoCoin");
c = await Coin.attach("0xc160275989DF70234d0Ae606428BCcfA5B57dBeF");
await c.advancePhase(
```

### Deploy the contract to Rinkeby with you as the owner:
```
npx hardhat run scripts/deploy.js --network rinkeby
```


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
        - If 1 ETH is sent w/ `purchase` then 2% of that 1 ETH in tokens is sent to the treasury.


### Questions
1. Store both ETH and tokens in the treasury?

## Architecture
    * Whitelist investors
    * Max contribution limit per phase
    * enum for phases
    * way to advance phase
    * way to get current phase
    * track number of tokens someone owns
    * track ETH raised

    ```
    
    enum Phase {
        None,
        Seed,
        General,
        Open
    }

    struct PhaseDetails {
        uint individualTokenLimit;
        uint totalTokenLimit;
    }

    uint private constant MAX_TOTAL_SUPPLY = 500000 * 10**18;
    uint private constant MAX_ICO_RAISE = 150000 * 10**18;
    uint private constant EXCHANGE_RATE = 5/1;
    uint private constant TAX_RATE = 0.02;
    address payable private treasuryAddress;
    bool taxEnabled;
    mapping (Phase => PhaseDetails) phaseToDetails;
    Phase public curPhase;

    // init phaseToDetails in constructor   
    address[] whitelistedInvestors = [];

    function meetsPhaseReqs() internal {
        if (phase == Phase.Seed) {
            // if investor can purchase more token
                // check total and individual limit
            // return true
        } else if (phase == Phase.General) {
            // if investor can purchase more token
                // check total and individual limit
            // return true
        } else if (phase == Phase.Open) {
            return true;
        }

        // if phase not set
        // return false; don't allow purchases
        return false;
    }
    
    function purchase() external payable {
        // meets reqs for current phase
        // allow investor to purchase up to Seed contribution limit
        // refund remainder
        // if tax enabled, reduce tax fee

        uint numTokens = msg.value * 5;
        ownerToTokens[msg.sender] = ownerToTokens[msg.sender] + numTokens; // TODO may not need, may come w/ ERC20
    }

    function advancePhase() external onlyOwner {
        // distribute tokens from here
    }

    function pauseFundraising() external onlyOwner {}

    function toggleTax() external onlyOwner {}

    function whitelistInvestor(address _investor) external onlyOwner {}


    ```

    ### How to manage phases:
    ```
    // Decision: Option 2
    // Changing the phase is more readable, easier to understand

    // Option 1:
    FundingPhase public phase;
    FundingPhase[4] public phases;

    FundingPhase currentPhase = phases[phase];
    currentPhase.phase;
    currentPhase.contributionLimit;

    // incrementing
    phase++;

    // Option 2:
    Phase public phase;
    mapping (Phase => uint) public phases;

    uint currentPhase = phases[phase]

    // incrementing
    if (phase == Phase.Seed) {
        phase = Phase.General
    } else if ( ... ) {
        ...
    }
    ...

    ```

    ### How to manage list of investors and tokens owed
    ```
    // Option 1
    mapping(address => uint256) public investorToTokensOwed; // SSTORE
    address[] private investorAddresses; // SSTORE

    // Option 2
    struct Investment {
        address addr;
        uint tokensOwed;
    }

    Investment[] public investments; // SSTORE, SLOAD

    investments.push(Investment(msg.sender, someNumTokens));

    for (uint i = 0; i < investments.length; i++) {

    }
    ```