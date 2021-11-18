// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// TODO REMOVE
import "hardhat/console.sol";

contract SotanoCoin is ERC20, Ownable {
    enum Phase {
        None,
        Seed,
        General,
        Open
    }

    struct PhaseDetails {
        uint256 individualTokenLimit;
        uint256 totalTokenLimit;
    }

    // TODO reconsider accessiblity of each var
    uint256 private constant MAX_TOTAL_SUPPLY = 500000 * 10**18;
    uint256 private constant MAX_ICO_RAISE = 150000 * 10**18;
    uint256 private constant EXCHANGE_RATE = 5;
    // note: 2% is equiv. to 1/50 -- divide tokens by TAX_RATE to get 2%
    uint256 private constant TAX_RATE = 50;
    address payable private treasuryAddress;
    bool public feesEnabled;
    mapping(Phase => PhaseDetails) public phaseToDetails;
    Phase public curPhase = Phase.None;
    mapping(address => bool) public whitelistedInvestors;
    mapping(address => uint256) public investorToTokensOwed;
    address[] private investors;
    uint256 public totTokensPurchased;

    constructor(address payable _treasuryAddress) ERC20("Sotano", "SOT") {
        treasuryAddress = _treasuryAddress;

        phaseToDetails[Phase.None] = PhaseDetails(0, 0);
        phaseToDetails[Phase.Seed] = PhaseDetails(7500 * 10**18, 75000 * 10**18);
        phaseToDetails[Phase.General] = PhaseDetails(5000 * 10**18, MAX_ICO_RAISE);
        phaseToDetails[Phase.Open] = PhaseDetails(MAX_ICO_RAISE, MAX_ICO_RAISE);
    }

    /**
        @dev Qualifies requests to purchase tokens during the fundraise.
    */
    modifier meetsPhaseReqs() {
        if (curPhase == Phase.None) {
            revert("Fundraising hasn't started.");
        }

        // TODO confirm that `storage` uses less gas than `memory` here.
        PhaseDetails storage phase = phaseToDetails[curPhase];
        if (curPhase == Phase.Seed && !whitelistedInvestors[msg.sender]) {
            revert("Purchaser is not whitelisted.");
        }

        if (curPhase < Phase.Open && investorToTokensOwed[msg.sender] >= phase.individualTokenLimit) {
            revert("Purchaser has already met individual token limit.");
        }

        if (getNumTokensOutstanding() >= phase.totalTokenLimit) {
            revert("Total tokens purchased has already met phase limit.");
        }

        _;
    }

    /** STATE HANDLERS */
    /**
        @dev
    */
    function purchase() external payable meetsPhaseReqs {
        // TODO confirm that `storage` uses less gas than `memory` here.
        PhaseDetails storage phase = phaseToDetails[curPhase];
        uint256 tokensOwedTo = investorToTokensOwed[msg.sender];

        /**
            The current token purchase limit is
            the lower of the total and individual limits.
        */
        uint256 tokenPurchaseLimit = Math.min(
            phase.totalTokenLimit - getNumTokensOutstanding(), // TODO change name; "Purchased" to "Owed"?
            phase.individualTokenLimit - tokensOwedTo
        );

        uint256 etherToRefund;
        uint256 etherForPurchasing;

        // Convert tokenPurchaseLimit to ETH equivalent
        if (msg.value > (tokenPurchaseLimit / EXCHANGE_RATE)) {
            etherToRefund = msg.value - (tokenPurchaseLimit / EXCHANGE_RATE);
            etherForPurchasing = msg.value - etherToRefund;
        } else {
            etherForPurchasing = msg.value;
        }

        uint256 numTokensToPurchase = etherForPurchasing * EXCHANGE_RATE;

        if (curPhase == Phase.Open) {
            mint(msg.sender, numTokensToPurchase);
        } else {
            investorToTokensOwed[msg.sender] += numTokensToPurchase;
            investors.push(msg.sender);
            totTokensPurchased += numTokensToPurchase;
        }

        if (etherToRefund > 0) {
            (bool success, ) = msg.sender.call{ value: etherToRefund }("");
            require(success, "Refund failed");
        }
    }

    function advancePhase() external onlyOwner {
        if (curPhase == Phase.None) {
            curPhase = Phase.Seed;
        } else if (curPhase == Phase.Seed) {
            curPhase = Phase.General;
        } else if (curPhase == Phase.General) {
            curPhase = Phase.Open;

            address investorAddress;
            for (uint256 i = 0; i < investors.length; i++) {
                investorAddress = investors[i];
                mint(investorAddress, investorToTokensOwed[investorAddress]);
            }
        }
    }

    function addToWhitelist(address[] memory _toWhitelist) external onlyOwner {
        for (uint256 i = 0; i < _toWhitelist.length; i++) {
            whitelistedInvestors[_toWhitelist[i]] = true;
        }
    }

    function toggleFees() external onlyOwner {
        feesEnabled = !feesEnabled;
    }

    // TODO setTreasuryAddress ?

    /** TOKEN HANDLERS */
    /**
        @dev `_amount` represents tokens, not ETH.
        Transaction fees are deducted from `_amount`, not tacked on.
    */
    function mint(address _to, uint256 _amount) internal {
        (uint256 amountToMint, uint256 transactionFee) = handleFee(_amount);

        _mint(_to, amountToMint);

        if (transactionFee > 0) {
            _mint(treasuryAddress, transactionFee);
        }
    }

    function transfer(address _to, uint256 _amount) public virtual override returns (bool) {
        (uint256 amountToTransfer, uint256 transactionFee) = handleFee(_amount);

        _transfer(_msgSender(), _to, amountToTransfer);

        if (transactionFee > 0) {
            _transfer(_msgSender(), treasuryAddress, transactionFee);
        }

        return true;
    }

    function handleFee(uint256 _amount) internal view returns (uint256, uint256) {
        uint256 amountToMint;
        uint256 transactionFee;

        if (feesEnabled) {
            transactionFee = _amount / TAX_RATE;
            amountToMint = _amount - transactionFee;
        } else {
            amountToMint = _amount;
        }

        return (amountToMint, transactionFee);
    }

    /** UTILS */
    function getNumTokensOutstanding() internal view returns (uint256) {
        return curPhase == Phase.Open ? totalSupply() : totTokensPurchased;
    }
}
