// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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
    uint256 private constant EXCHANGE_RATE = 5 / 1;
    // uint256 private constant TAX_RATE = 0.02;
    address payable private treasuryAddress;
    bool taxEnabled;
    mapping(Phase => PhaseDetails) phaseToDetails;
    Phase public curPhase = Phase.None;
    mapping(address => bool) public whitelistedInvestors;
    mapping(address => uint256) public investorToTokensOwed;
    uint256 public totTokensPurchased;

    constructor() ERC20("Sotano", "SOT") {
        phaseToDetails[Phase.None] = PhaseDetails(0, 0);
        phaseToDetails[Phase.Seed] = PhaseDetails(7500 * 10**18, 75000 * 10**18);
        phaseToDetails[Phase.General] = PhaseDetails(5000 * 10**18, MAX_ICO_RAISE);
        phaseToDetails[Phase.Open] = PhaseDetails(MAX_ICO_RAISE, MAX_ICO_RAISE);
    }

    /**
        @dev Returns a boolean indicating whether or not the purchaser can
        purchase tokens.
     */
    // TODO I would prefer a pattern that enables descriptive error messages.
    modifier meetsPhaseReqs() {
        if (curPhase == Phase.None) {
            revert("Fundraising hasn't started.");
        }

        // TODO confirm that `storage` uses less gas than `memory` here.
        PhaseDetails storage phase = phaseToDetails[curPhase];
        if (curPhase == Phase.Seed && !whitelistedInvestors[msg.sender]) {
            revert("Purchaser is not whitelisted.");
        }

        if (investorToTokensOwed[msg.sender] >= phase.individualTokenLimit) {
            revert("Purchaser has already met individual token limit.");
        }

        if (totTokensPurchased >= phase.totalTokenLimit) {
            revert("Total tokens purchased has already met phase limit.");
        }

        _;
    }

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
            phase.totalTokenLimit - totTokensPurchased, // TODO change name; "Purchased" to "Owed"?
            phase.individualTokenLimit - tokensOwedTo
        );

        uint256 etherForPurchasing;
        uint256 etherToRefund;

        // TODO handle taxes here?

        // Convert tokenPurchaseLimit to ETH equivalent
        // TODO use constant for `5`
        if (msg.value > (tokenPurchaseLimit / 5)) {
            etherToRefund = msg.value - (tokenPurchaseLimit / 5);
            etherForPurchasing = msg.value - etherToRefund;
        } else {
            etherForPurchasing = msg.value;
        }

        uint256 numTokensToPurchase = etherForPurchasing * 5;

        // TODO:
        // if phase is Open, distribute token
        // else, update record of tokens owed
        investorToTokensOwed[msg.sender] += numTokensToPurchase;
        totTokensPurchased += numTokensToPurchase;

        if (etherToRefund > 0) {
            (bool success, ) = msg.sender.call{ value: etherToRefund }("");
            require(success, "Refund failed");
        }
    }

    function addToWhitelist(address[] memory _toWhitelist) external onlyOwner {
        for (uint256 i = 0; i < _toWhitelist.length; i++) {
            whitelistedInvestors[_toWhitelist[i]] = true;
        }
    }

    function advancePhase() external onlyOwner {
        if (curPhase == Phase.None) {
            curPhase = Phase.Seed;
        } else if (curPhase == Phase.Seed) {
            curPhase = Phase.General;
        } else if (curPhase == Phase.General) {
            curPhase = Phase.Open;
            // TODO distribute owed tokens
        }
    }
}
