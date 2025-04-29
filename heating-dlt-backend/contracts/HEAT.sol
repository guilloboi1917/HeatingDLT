// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract HEAT is ERC20, ERC20Burnable, Ownable {
    constructor(address initialOwner) ERC20("HEAT Token", "HEAT") Ownable(initialOwner) {
        // Tokens are only minted when pellets are purchased
        // Owner is the smartCollectionContract
    }

    // Landlord can mint new HEAT when buying pellets (e.g., 1 HEAT = 1 kWh or 1 Pellet)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}