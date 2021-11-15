# Exercises: Set 1
URL: [https://hackerdao.school/training/project-ico/p/2](https://hackerdao.school/training/project-ico/p/2)

## Types
1. **The type uint is equivalent with the type _____.:** uint256
2. **The type string is equivalent with the type _____.:** array, as represented in `input data`.
3. **Internally, enum is represented as _____.:** an unsigned (non-negative) integer (32-bit)
4. **What is the max value of a uint256 in decimal? In hex?:** 2^256 - 1
5. **How do you compare strings? How do you concat them?:**
    String comparison:
    ```
    function compare(string memory s1, string memory s2) public pure returns (bool) {
        return keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
    }
    ```
    String concatenation: 
    ```
    function concatenate(string memory s1, string memory s2) public pure returns (string memory) {
        return string(abi.encodePacked(s1, s2));
    }
    ```
6. **What is the difference between type address and type address payable?:**
Only addresses typed as `payable` have the `transfer` and `send` methods for sending ethers.
While the type `address` alone has the `call` method, testing in Remix shows that sending ethers did not work.
7. **What is the purpose of the private keyword in Solidity?:**
The private keyword can be used to make functions and variables only visible/accessible by the contract
that they are defined in. Even contracts inheriting from the given contract can't access private
functions and variables.

## Transactions
1. **What are all the fields of an Ethereum transaction?:**
    1. The recipient of the message
    2. A signature id'ing the sender
    3. value: amount of wei to send
    4. data (optional): can contain the message sent to a contract
    5. startgas: max. number of computational steps the transaction execution is allowed to take
    6. gasprice: the fee one is willing to pay per unit of gas (i.e. each one atomic instruction).
2. **What is msg in Solidity? What non-deprecated fields do you have access to via msg?:**
    Messages are "function calls". They are like transactions but are produced by a contract not by an EOA (externally-owned account).
    A message is produced when a contract executed either `call` or `delegateCall`. Messages result in the receiving contract
    running code.

    Props:
    1. data (bytes): calldata
    2. gasLeft (uint): remaining gas
    3. sender (address): the address that sent the message
    4. sig (bytes4): function identifier (1st 4 bytes of the calldata)
    5. value (uint): number of wei sent w/ the message

3. **What is tx in Solidity? What fields do you have access to via tx?:**
    `tx` is the transaction object. Transactions are signed data packages sent from an EOA
    to another account.

    Props:
    1. gasprice (uint): gas price of the transaction
    2. origin (address): sender of the transaction (an EOA).

4. **What is block in Solidity? What non-deprecated fields do you have access to via block?:**
    A block is a set of transactions. Blocks contain mulitple transactions.

    Props:
    1. basefee (uint): current block's basefee
    2. chainid (uint): current chain id
    3. coinbase (address): the current block's miner's address
    4. difficulty (uint)
    5. gaslimit (uint)
    6. number (uint)
    7. timestamp (uint): timestamp as seconds since unix epoch
5. **What persists after a transaction gets reverted?:**
    [HELP]

    Low-level methods `call` and `delegateCall` don't bubble up exceptions. Thus, if a message sent from one of those methods
    is reverted then the transactoin will continue from the callsite of the low-level method.
6. **When you deploy a contract, what are you sending in the data field of that transaction?:**
    The `data` field of a contract that deploys a contract is the contract's bytecode.


## Gas Costs
1. **What is the standard gas cost of a transaction?:**
    21,000 units * gas price
2. **What is the gas cost of deploying a constract?:**
    * Transaction: 21k
    * Contract creation: 32k
    * Bytecode: 200 per byte (includes inherited parent contracts)
    * Transaction data: 68 per non-zero byte and 4 per zero byte
    * Code run before creation (i.e. constructor)
3. **How did the recent (Aug 9th) London upgrade affect gas costs?:**
    The London upgrade made gas costs more predictable because gas costs can increase a maximum of 12.5%
    relative to the previous block.

    This means that the max gas fee for the upcoming block can be reliably predicted.
4. **What version of Solidity introduced automatic "safe math" operations?:**
    Solidity 0.8.0 introduce "arithmetic checking".
5. **What is the tradeoff of having all math operations safe?:**
    Safe math operations require more computational power and thus higher gas costs.
6. **What is the syntax for performing an unchecked math operation?:**
    `unchecked { some math op(s) here }` e.g.
    ```
    function f() public pure returns (uint) {
        uint x = 0;
        unchecked { x--; }
        return x;
    }
    ```
7. **What causes the difference in gas cost between Foo memory x = ... and Foo storage x = ...?:**
    Depends. If `memory x` is being set to a variable in storage then it's copying the contents of storage
    which costs more than just referencing the data in storage.

    On the other hand, if `storage x` is being manipulated then writes are happening and that's more expensive
    than copying data to memory.

## EVM
1. **What are the three different areas EVM programs can store data?:**
    1. Storage
    2. Memory
    3. Stack
2. **What is the difference between assert(), revert(), and require()? What EVM opcodes do they use?:**
    Opcodes
    `revert`: `0xfd`
    `require` `0xfd` (REVERT opcode)
    `assert`: `0xfe` (invalid opcode)

    Behavior:
    `revert` and `require` use the same opcode and thsu behave the same. They will both revert all changes
    and refund any unused gas.

    `assert` will also revert all changes but will use up all of the gas.

3. **What is the difference between CALL, CALLCODE, and DELEGATECALL? Which one is deprecated?:**
    Each method is used to call a function in another contract. They differ in their values of `msg.sender` and `msg.value`.
    Re `CALL` and `CALLCODE`, `msg.sender` will refer to the callsite (i.e. contract) of the method.
    Re `DELEGATECALL`, `msg.sender` will refer to the address that invoked the initial message (i.e. the transaction).
        So, if contract A calls contract B which in turn uses `DELEGATECALL` to call contract C, then in contract C:
            * `msg.sender` refers to contract A
            * Changes to storage in the contract C method will result in changes to storage in contract B, not contract C.
            * `CALLCODE` works the same way re storage, but `msg.sender` would refer to contract B, not contract A.
            * `DELEGATECALL` is considered to be a bug fix for `CALLCODE` in order that `msg.sender` refers to the orignal caller.
    
4. **What is the syntax for writing inline assembly in Solidity? Where are the docs for this?:**
    ```
    assembly {
        ...
    }
    ```
    Docs can be found at [https://docs.soliditylang.org/en/v0.8.9/assembly.html](https://docs.soliditylang.org/en/v0.8.9/assembly.html).

    ## Legacy Solidity
1. **What was the original purpose of Solidity's .send() and .transfer() functions? How did it fail?:**
    The original purpose of `send` and `transfer` is to send ether.

    Failures:
    * Forwards a static 2,300 gas stipend. Doesn't allow the user to set the amount of gas to send w/ the transaction.
        - The set gas stipend guards against re-entrancy.
        - Only sufficient gas for a transaction, not function calls.

2. **The type var is equivalent with the type _____.:**
    The type `var` is equivalent to the type of the value it is based on. For instance, in:
    ```
    uint a = 200;
    var b = a;
    ```
    `b` would be of type `uint`.

3. **What version of Solidity introduced the receive() function definition? What was the equivalent before it?:**
    `receive()` was released in version `0.6.x` and is equivalent to `fallback()`.

4. **What version of Solidity introduced length checking for msg.data? What manual check does this cover?:**
    Autoamtic length checking was introduced in version `0.5.x`.
    
    The manual check could be `msg.data.length == size + 4` where `size` is something like `64`.
5. **What version of Solidity make checking for accidental zero addresses obsolete?:**
