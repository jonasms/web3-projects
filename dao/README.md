# DAO Project by Jonas_M

## Design Exercises

1. **Per project specs, there is no vote delegation. This means for someone's vote to count, they must manually participate every time. How would you design your contract to allow for non-transitive vote delegation?**

Non-transitive vote delegation could be achieved by using `msg.sender` as one of the values when decoding the signature for a vote. This would require the delegate's address to be included in the vote's signature at the time of delegation.

2. **What are some problems with implementing transitive vote delegation on-chain?**
   Tracking votes. If a delegate votes and then passes their votes on to another delegate, and this can occur n times, the smart contract at hand needs to track votes in order to make they aren't counted more than once. This can be solved for, perhaps, by disallowing executed votes from being delegated.

## Repo Set up

1. Create a `.env` with the following values before compiling:

```
MNEMONIC=exotic accident planet click stem age cotton treat supreme chronic ice track update talk walk
INFURA_API_KEY=0
REACT_APP_DEV_WALLET_ADDRESS=0
```

2. Run `yarn compile` or `npm run compile`.

## Spec

## Spec Notes

### Features

1. Anyone can buy a membership for 1 ETH.
2. Members can propose an NFT to buy.
   - Proposals point to a contract and specify which fxns to call.
3. Members can vote on proposals.
4. Proposals require a 25% quorum to pass.
5. Automate NFT purchases for proposals that pass.
6. DAO contract should be designed such that it supports calling arbitrary functions.
7. DAO contract has a fxn that accepts, validates, and writes vote signatures.
   - Write a separate fxn that conducts the above fxn in bulk.
8. NFT Marketplace Interface
   ```
   interface NftMarketplace {
       function getPrice(address nftContract, uint nftId) external returns (uint price);
       function buy(address nftContract, uint nftId) external payable returns (bool success);
   }
   ```
9. Voting mechanism(s)
   - 1 membership per address
   - 1 vote per membership

## Security Concerns

1. Users voting more than expected
2. Votes being changed or removed
3. Votes being cast before/after voting is permitted

## Architecture

### Membership

Users can purchase members by paying 1 ETH
Users can create and vote on proposals

### Create Proposal

A member can create a proposal which is a series of calls for the DAO contract to make, if passed.
The call(s) are made, ostensibly, to a contract created by the proposer.

### Voting

Only members can vote.
Each member can vote once for a given proposal.

Votes are kept track of in the given proposal object itself (i.e. forVotes, againstVotes).

### Proposal Processing

If a proposal is executed after its voting period expires then the proposal should be evaluated for whether or not is passed.

To pass, the proposal needs to have met quorum (25% or more of all members voted) and received more forVotes than againstVotes.

### Bonus features

1. Hash proposals
2. Get signatures for votes (EIP-712)
3. Implement EIP-1559 transactions

## API

struct Proposal {}

struct Receipt {
bool: hasVoted;
uint8: support;
}

enum ProposalState

/// @notice The EIP-712 typehash for the contract's domain
bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");

/// @notice The EIP-712 typehash for the delegation struct used by the contract
bytes32 public constant DELEGATION_TYPEHASH = keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");

/// @notice A record of states for signing / validating signatures
mapping (address => uint) public nonces;

mapping (uint => Proposal) public proposals;
mapping (address => bool) members;

uint proposalCount;

// @note compare Compound and OZ implementations
function state() public view returns(ProposalState) {}

// @return proposalId
function propose(

    address[] memory targets,
    uint[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas,
    string memory description
    ) external returns(uint) {
    // require isMember
    // require is valid proposal
    // require is not duplicate proposal

    // generate proposalId
    // bonus: store call(s) as hash
    // bonus: implement votingDelay
    // create and store proposal

}

function \_castVote(address voter, uint proposalId, bool support) internal {

    // require isMember
    // require hasn't voted for this proposal
    // require proposal state is Active

    // add vote to proposal.forVotes or proposal.againstVotes
    // add vote to proposal.receipts

}

function castVote (address voter, uint proposalId, bool support) external {

    \_castVote(msg.sender, proposalId, support)

}

function castVoteBySig(uint proposalId, bool support, uint8 v, bytes32 r, bytes32 s) public) external {

        bytes32 domainSeparator = keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(name)), getChainId(), address(this)));
        bytes32 structHash = keccak256(abi.encode(BALLOT_TYPEHASH, proposalId, support));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signatory = ecrecover(digest, v, r, s);
        require(signatory != address(0), "GovernorAlpha::castVoteBySig: invalid signature");
        return _castVote(signatory, proposalId, support);

}

function execute(uint proposalId, proposalParams...) external {
// require proposal state is Successful or Queued
// require proposal has met quorum and has more forVotes than againstVotes

    // set proposal state to Executed
    // execute proposal

}

function buyMembership() external payable {
// require is not already member
// require msg.value == 1 ETH

    // add msg.sender to members

}

### Design Notes

- Managing votes

  - Simple Voting

    ```
    // @return proposalId
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight
    ) internal virtual;

    // @dev calls _countVote
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    ) internal virtual returns (uint256) {
        ProposalCore storage proposal = _proposals[proposalId];
        require(state(proposalId) == ProposalState.Active, "Governor: vote not currently active");

        uint256 weight = getVotes(account, proposal.voteStart.getDeadline());
        _countVote(proposalId, account, support, weight);

        emit VoteCast(account, proposalId, support, weight, reason);

        return weight;

    // @dev calls _castVote
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override returns (uint256) {}
    ```

  - Vote delegation

    ```
        /// @notice A checkpoint for marking number of votes from a given block
        struct Checkpoint {
            uint32 fromBlock;
            uint96 votes;
        }

        /// @notice A record of votes checkpoints for each account, by index
        mapping (address => mapping (uint32 => Checkpoint)) public checkpoints;

        /// @notice The number of checkpoints for each account
        mapping (address => uint32) public numCheckpoints;

        // See Compound Comp.sol
        function _writeCheckpoint(address voter_, uint32 nCheckpoints_, uint96 oldVotes_, uint96 newVotes_) internal {}
    ```

- Managing membership/tokens

  - ```
    /// @notice Official record of token balances for each account
    mapping (address => uint96) public balances;
    ```

  - ```
        /**
        * @notice Transfer `amount` tokens from `msg.sender` to `dst`
        * @param to_ The address of the destination account
        * @param amount_ The number of tokens to transfer
        * @return Whether or not the transfer succeeded
        * @notice calls _transferTokens
        */
        function transfer(address to_, uint amount_) external returns (bool) {}

        function _transferTokens(address from_, address to_, uint96 amount_) internal {}
    ```

- Signatures

  - ```
        /// @notice The EIP-712 typehash for the contract's domain
        bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");

        /// @notice The EIP-712 typehash for the delegation struct used by the contract
        bytes32 public constant DELEGATION_TYPEHASH = keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");

        /// @notice A record of states for signing / validating signatures
        mapping (address => uint) public nonces;
    ```

  ```

  ```

- Proposing and executing arbitrary fxns

  - store fxn calls on-chain vs as hashes

  - ```
        mapping (uint => Proposal) public proposals;
    ```

  - ```
    /**
      * @notice Function used to propose a new proposal. Sender must have delegates above the proposal threshold
      * @param targets Target addresses for proposal calls
      * @param values Eth values for proposal calls
      * @param signatures Function signatures for proposal calls
      * @param calldatas Calldatas for proposal calls
      * @param description String description of the proposal
      * @return Proposal id of new proposal
    */
    function propose(address[] memory targets, uint[] memory values, string[] memory signatures, bytes[] memory calldatas, string memory description) public returns (uint)
    ```

  - ```
    // STRUCTS, ENUMS, INTERFACES
    struct Proposal {
        /// @notice Unique id for looking up a proposal
        uint id;

        /// @notice Creator of the proposal
        address proposer;

        /// @notice The timestamp that the proposal will be available for execution, set once the vote succeeds
        uint eta;

        /// @notice the ordered list of target addresses for calls to be made
        address[] targets;

        /// @notice The ordered list of values (i.e. msg.value) to be passed to the calls to be made
        uint[] values;

        /// @notice The ordered list of function signatures to be called
        string[] signatures;

        /// @notice The ordered list of calldata to be passed to each call
        bytes[] calldatas;

        /// @notice The block at which voting begins: holders must delegate their votes prior to this block
        uint startBlock;

        /// @notice The block at which voting ends: votes must be cast prior to this block
        uint endBlock;

        /// @notice Current number of votes in favor of this proposal
        uint forVotes;

        /// @notice Current number of votes in opposition to this proposal
        uint againstVotes;

        /// @notice Current number of votes for abstaining for this proposal
        uint abstainVotes;

        /// @notice Flag marking whether the proposal has been canceled
        bool canceled;

        /// @notice Flag marking whether the proposal has been executed
        bool executed;

        /// @notice Receipts of ballots for the entire set of voters
        mapping (address => Receipt) receipts;
    }

    struct Receipt {
        /// @notice Whether or not a vote has been cast
        bool hasVoted;

        /// @notice Whether or not the voter supports the proposal or abstains
        uint8 support;

        /// @notice The number of votes the voter had, which were cast
        uint96 votes;
    }

    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    interface TimelockInterface {
        function delay() external view returns (uint);
        function GRACE_PERIOD() external view returns (uint);
        function acceptAdmin() external;
        function queuedTransactions(bytes32 hash) external view returns (bool);
        function queueTransaction(address target, uint value, string calldata signature, bytes calldata data, uint eta) external returns (bytes32);
        function cancelTransaction(address target, uint value, string calldata signature, bytes calldata data, uint eta) external;
        function executeTransaction(address target, uint value, string calldata signature, bytes calldata data, uint eta) external payable returns (bytes memory);
    }
    ```

  ```

  ```

- EIP-1559
- EIP-2718 (transaction types)
- EIP-712 (improving UX for signing transactions)
- ERC20Votes contract/extension

### Bonus Features?

- Support voting delegation
