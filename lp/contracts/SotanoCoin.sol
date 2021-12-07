// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// TODO remove
import "hardhat/console.sol";

contract SotanoCoin is ERC20, Ownable {
    enum Phase {
        Closed,
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
    uint256 private constant EXCHANGE_RATE = 5;
    // note: 2% is equiv. to 1/50 -- divide tokens by TAX_RATE to get 2%
    uint256 private constant TAX_RATE = 50;
    address payable private treasuryAddress;
    bool private feesEnabled;
    mapping(Phase => PhaseDetails) private phaseToDetails;
    Phase public curPhase = Phase.Closed;
    bool private fundraisingPaused;
    mapping(address => bool) public whitelistedInvestors;
    mapping(address => uint256) public investorToTokensOwed;
    uint256 public totTokensPurchased;

    constructor(address payable _treasuryAddress) ERC20("Sotano", "SOT") {
        treasuryAddress = _treasuryAddress;

        phaseToDetails[Phase.Closed] = PhaseDetails(0, 0);
        phaseToDetails[Phase.Seed] = PhaseDetails(7500 * 10**18, 75000 * 10**18);
        phaseToDetails[Phase.General] = PhaseDetails(5000 * 10**18, MAX_ICO_RAISE);
        phaseToDetails[Phase.Open] = PhaseDetails(MAX_ICO_RAISE, MAX_ICO_RAISE);
    }

    /**
        @dev Qualifies requests to purchase tokens during the fundraise.
    */
    modifier meetsPhaseReqs() {
        if (curPhase == Phase.Closed) {
            revert("Fundraising hasn't started.");
        }

        if (fundraisingPaused) {
            revert("Purchasing tokens has been paused.");
        }

        PhaseDetails memory phase = phaseToDetails[curPhase];
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
        PhaseDetails memory phase = phaseToDetails[curPhase];
        uint256 tokensOwedTo = investorToTokensOwed[msg.sender];

        /**
            The current token purchase limit is
            the lower of the total and individual limits.
        */
        uint256 tokenPurchaseLimit = Math.min(
            phase.totalTokenLimit - getNumTokensOutstanding(),
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
            totTokensPurchased += numTokensToPurchase;
        }

        if (etherToRefund > 0) {
            (bool success, ) = msg.sender.call{ value: etherToRefund }("");
            require(success, "Refund failed");
        }
    }

    function advancePhase() external onlyOwner {
        require(curPhase != Phase.Open, "Cannot advance past the 'Open' phase.");

        if (curPhase == Phase.Closed) {
            curPhase = Phase.Seed;
        } else if (curPhase == Phase.Seed) {
            curPhase = Phase.General;
        } else if (curPhase == Phase.General) {
            curPhase = Phase.Open;
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

    function toggleFundraising() external onlyOwner {
        fundraisingPaused = !fundraisingPaused;
    }

    /** TOKEN HANDLERS */
    /**
        @dev mints all tokens owed to an investor iff
        the contract is in the 'Open' phase.
    */
    function mintTokens() external {
        require(curPhase == Phase.Open, "Can only mint tokens in the 'Open' phase.");

        uint256 tokensOwed = investorToTokensOwed[msg.sender];

        require(tokensOwed > 0, "User doesn't have any tokens to mint.");

        mint(msg.sender, tokensOwed);
        investorToTokensOwed[msg.sender] = 0;
    }

    /**
        @dev `_amount` represents tokens, not ETH.
        Transaction fees are deducted from `_amount`, not tacked on.
    */
    function mint(address _to, uint256 _amount) internal {
        (uint256 amountToMint, uint256 transactionFee) = getTransferAndFeeAmounts(_amount);

        _mint(_to, amountToMint);

        if (transactionFee > 0) {
            _mint(treasuryAddress, transactionFee);
        }
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual override {
        if (feesEnabled) {
            uint256 taxAmount = (_amount * 2) / 100;
            _amount = _amount - taxAmount;
            super._transfer(_to, treasuryAddress, taxAmount);
        }
        super._transfer(_from, _to, _amount);
    }

    function getTransferAndFeeAmounts(uint256 _amount) internal view returns (uint256, uint256) {
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

    /**
        @notice: only the treasury can call this method.
        @notice: requires sending ETH with this method execution.
        @notice: requires the treasury to transfer SOT to the contract before executing withdraw().
     */
    function withdraw(
        address _to,
        uint256 _ethAmount,
        string memory _signature,
        bytes memory _data
    ) external payable {
        require(msg.sender == treasuryAddress, "SotanoCoin::withdraw: ONLY_TREASURY");
        bytes memory callData = abi.encodePacked(bytes4(keccak256(bytes(signature_))), _data);

        (bool success, ) = to_.call{ value: _ethAmount }(callData);
        require(success, "SotanoCoin::withdraw: TRANSACTION_FAILED");
    }

    /** UTILS */
    function getNumTokensOutstanding() internal view returns (uint256) {
        return curPhase == Phase.Open ? totalSupply() : totTokensPurchased;
    }
}
