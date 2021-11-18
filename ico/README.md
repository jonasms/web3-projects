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