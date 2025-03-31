// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract SmartMeterCollection {
    address public masterOwner;

    struct SmartMeter {
        string name;
        string ownerName;
        address smartMeterAddress;
        string smartMeterId;
        bool isActive;
    }

    struct Tenant {
        string fullName;
        address assignedSmartMeter;
    }

    struct Measurement {
        uint256 timestamp;
        uint256 value;
        string unit;
    }

    // Map meter address to SmartMeter struct
    mapping(address => SmartMeter) public smartMeters;

    // Map tenant address to Tenant struct
    mapping(address => Tenant) public tenants;

    // Map meter address to Measurement data
    mapping(address => Measurement[]) public meterData;

    // Whitelist meters
    mapping(address => bool) private whitelistedMeters;

    // Whitelisted tenants that can access parts of this collection
    mapping(address => bool) public whitelistedTenants;

    // EVENTS

    // Event for meter registration
    event MeterRegistered(
        string name,
        string ownerName,
        address indexed smartMeterAddress,
        string smartMeterId
    );

    // Event for meter data recording
    event DataRecorded(address indexed meter, uint256 timestamp, uint256 value);

    // MODIFIERS
    modifier onlyMaster() {
        require(msg.sender == masterOwner, "Only master");
        _;
    }

    modifier onlyWhitelistedActiveMeter() {
        require(
            whitelistedMeters[msg.sender] && smartMeters[msg.sender].isActive,
            "Not a whitelisted active meter"
        );
        _;
    }

    modifier onlyTenant() {
        require(whitelistedTenants[msg.sender], "Not whitelisted tenant");
        _;
    }

    // Constructor for Smart Meter Collection
    constructor(address _master) {
        console.log("Creating collection for", _master);
        masterOwner = _master;
    }

    // FUNCTIONS

    // Register a smart meter
    function registerSmartMeter(
        string memory _name,
        string memory _ownerName,
        address _smartMeterAddress,
        string memory _smartMeterId
    ) external onlyMaster {
        require(
            !smartMeters[_smartMeterAddress].isActive,
            "Meter already exists"
        );

        smartMeters[_smartMeterAddress] = SmartMeter({
            name: _name,
            ownerName: _ownerName,
            smartMeterAddress: _smartMeterAddress,
            smartMeterId: _smartMeterId,
            isActive: true
        });

        whitelistedMeters[_smartMeterAddress] = true; // Adding to whitelist
    }

    // Add and remove tenants
    function addTenant(
        address _tenant,
        string memory _fullName,
        address _smartMeterAddress
    ) external onlyMaster {
        tenants[_tenant] = Tenant({
            fullName: _fullName,
            assignedSmartMeter: _smartMeterAddress
        });

        whitelistedTenants[_tenant] = true;
    }

    function removeTenant(address _tenant) external onlyMaster {
        whitelistedMeters[_tenant] = false;

        // Also removed from mapping
        delete tenants[_tenant];
    }

    function getMeterInfo(
        address _meterAddress
    ) external view returns (SmartMeter memory) {
        // Need to apply permissioning here for both master and tenant
        return smartMeters[_meterAddress];
    }

    // Record a basic measurement
    function recordData(
        uint256 _value,
        string calldata _unit
    ) external onlyWhitelistedActiveMeter {
        meterData[msg.sender].push(
            Measurement({
                timestamp: block.timestamp, // Maybe use a different timestamp
                value: _value,
                unit: _unit
            })
        );
        emit DataRecorded(msg.sender, block.timestamp, _value);
    }

    function getMeterData(
        address _meterAddress // Also need to apply permissioning here for both master and tenant
    ) external view returns (Measurement[] memory) {
        return meterData[_meterAddress];
    }
}
