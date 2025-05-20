// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./TNCY.sol";
import "./SharedStructs.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BillingManager {
    IERC20 public tncyToken;

    address public masterOwner;

    constructor(address _master, IERC20 _tncyToken) {
        masterOwner = _master;
        tncyToken = _tncyToken;
    }

    modifier onlyMasterOwner() {
        require(msg.sender == masterOwner, "Only MasterOwner");
        _;
    }
}
