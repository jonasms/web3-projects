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

    uint256 private constant MAX_TOTAL_SUPPLY = 500000 * 10**18;
    uint256 private constant MAX_ICO_RAISE = 150000 * 10**18;
    uint256 private constant EXCHANGE_RATE = 5 / 1;
    // uint256 private constant TAX_RATE = 0.02;
    address payable private treasuryAddress;
    bool taxEnabled;
    mapping(Phase => PhaseDetails) phaseToDetails;
    Phase public curPhase = Phase.None;
    mapping(address => bool) whitelistedInvestors;
    mapping(address => uint256) investorToTokensOwed;
    uint256 totTokensPurchased;

    constructor() ERC20("Sotano", "SOT") {
        phaseToDetails[Phase.None] = PhaseDetails(0, 0);
        phaseToDetails[Phase.Seed] = PhaseDetails(7500 * 10**18, 75000 * 10**18);
        phaseToDetails[Phase.General] = PhaseDetails(5000 * 10**18, 150000 * 10**18);
        phaseToDetails[Phase.Open] = PhaseDetails(MAX_ICO_RAISE, MAX_ICO_RAISE);
    }

    /**
        @dev Returns a boolean indicating whether or not the purchaser can
        purchase tokens.
     */
    // TODO I would prefer a pattern that enables descriptive error messages.
    function meetsPhaseReqs() internal view returns (bool) {
        if (curPhase == Phase.None) {
            return false;
        }

        // TODO confirm that `storage` uses less gas than `memory` here.
        PhaseDetails storage phase = phaseToDetails[curPhase];
        if (curPhase == Phase.Seed && !whitelistedInvestors[msg.sender]) {
            return false;
        }

        if (investorToTokensOwed[msg.sender] >= phase.individualTokenLimit) {
            return false;
        }

        if (totTokensPurchased >= phase.totalTokenLimit) {
            return false;
        }

        return true;
    }

    /**
        @dev
     */
    function purchase() external payable {
        require(meetsPhaseReqs());
        // TODO confirm that `storage` uses less gas than `memory` here.
        PhaseDetails storage phase = phaseToDetails[curPhase];
        uint256 tokensOwned = investorToTokensOwed[msg.sender];

        uint256 tokenPurchaseLimit = Math.max(
            totTokensPurchased - phase.totalTokenLimit,
            tokensOwned - phase.individualTokenLimit
        );

        uint256 etherForPurchase;
        uint256 etherToRefund;

        if (msg.value > tokenPurchaseLimit / 5 ether) {
            etherForPurchase = (msg.value - tokenPurchaseLimit / 5 ether);
            etherToRefund = msg.value - etherForPurchase;
        } else {
            etherForPurchase = msg.value;
        }

        uint256 numTokensToPurchase = etherForPurchase * 5;
        investorToTokensOwed[msg.sender] += numTokensToPurchase;

        if (etherToRefund > 0) {
            (bool success, ) = msg.sender.call{ value: etherToRefund }("");
            require(success, "Refund failed");
        }
    }
}
