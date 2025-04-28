// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract HeatingToken {
    string public name = "Heating Token";
    string public symbol = "HEAT";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public owner; // Track contract owner

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(uint256 initialSupply, address _owner) {
        owner = _owner;
        totalSupply = initialSupply * 10 ** uint256(decimals);
        balanceOf[_owner] = totalSupply;
        emit Transfer(address(0), _owner, totalSupply); // Minting event
    }

    // tenant allowance during onboarding
    function tenantOnboarding(
        address _tenant,
        uint256 INITIAL_TENANT_SUPPLY
    ) public {
        // Transfer initial supply to tenant
        require(
            balanceOf[owner] >= INITIAL_TENANT_SUPPLY,
            "Owner balance insufficient"
        );
        balanceOf[owner] -= INITIAL_TENANT_SUPPLY;
        balanceOf[_tenant] += INITIAL_TENANT_SUPPLY;
        emit Transfer(owner, _tenant, INITIAL_TENANT_SUPPLY);
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value);
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    // rework as msg.sender is SmartMeterCollection
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function approveFor(
        address _owner,
        address spender,
        uint256 allowanceAmount
    ) external returns (bool) {
        allowance[_owner][spender] = allowanceAmount;
        emit Approval(_owner, spender, allowanceAmount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public returns (bool) {
        require(value <= balanceOf[from], "Balance too low");
        require(value <= allowance[from][to], "Allowance too low");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][to] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
