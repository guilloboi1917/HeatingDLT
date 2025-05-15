// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TNCY is ERC20 {
    // If at some point we need more than one admin
    mapping(address => bool) public billingAdmins;
    address owner;

    uint256 public ratePerKwh = 1; // 1 TNCY per kWh (placeholder)

    constructor(address _initialOwner) ERC20("Tency Token", "TNCY") {
        owner = _initialOwner;
        _mint(msg.sender, 1_000_000 * 10 ** 18); // Some initial supply, do we need that? Tokens are only minted when pellets are purchased
        billingAdmins[owner] = true;
    }

    // ================= BALANCE ADJUSTMENTS =================
    function adjustTenantBalance(
        address tenant,
        uint256 tokens
    ) external onlyBillingAdmins {
        require(balanceOf(tenant) >= tokens, "Insufficient tokens for tenant");
        _burn(tenant, tokens);
        _mint(owner, tokens);

        emit BalanceAdjusted(tenant, tokens, block.timestamp);
    }

    // ================= CONFIGURATION =================
    function setRatePerKwh(uint256 newRate) external onlyBillingAdmins {
        ratePerKwh = newRate;
    }

    function setNewOwner(address newOwner) external {
        require(msg.sender == owner, "Unauthorized");

        owner = newOwner;
    }

    // ================= ADMIN MANAGEMENT =================

    modifier onlyBillingAdmins() {
        require(
            billingAdmins[msg.sender] || msg.sender == owner,
            "Unauthorized"
        );
        _;
    }

    function addBillingAdmin(address admin) public onlyBillingAdmins {
        billingAdmins[admin] = true;
    }

    // Landlord can mint new TNCY when buying pellets (e.g., 1 TNCY = 1 kWh or 1 Pellet)
    function mint(address to, uint256 amount) external onlyBillingAdmins {
        _mint(to, amount);
    }

    // ================= EVENTS =================
    event BalanceAdjusted(
        address indexed tenant,
        uint256 amount,
        uint256 timestamp
    );
}
