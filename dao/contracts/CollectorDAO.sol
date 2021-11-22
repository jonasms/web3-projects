//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// TODO remove
import "hardhat/console.sol";

contract CollectorDAO {
    string private greeting;

    constructor(string memory _greeting) {
        console.log("Deploying a Greeter with greeting:", _greeting);
        greeting = _greeting;
    }
}
