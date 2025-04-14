// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./HeatingToken.sol";
import "./BillingContract.sol";
import "./SharedStructs.sol";

contract SmartMeterCollection {
    address public masterOwner;
    HeatingToken public heatToken;
    BillingContract public billingContract;

    uint256 public constant INITIAL_TENANT_SUPPLY = 500 * 10 ** 18;

    // Map meter address to SmartMeter struct
    mapping(address => SmartMeter) public smartMeters;

    // Map tenant address to Tenant struct
    mapping(address => Tenant) public tenants;

    // Map meter address to Measurement data
    // Later to be replaced with ipfs
    mapping(address => Measurement[]) public meterData;

    // Whitelist meters
    mapping(address => bool) private whitelistedMeters;

    // Whitelisted tenants that can access parts of this collection
    mapping(address => bool) public whitelistedTenants;

    // EVENTS
    event MeterRegistered(
        string name,
        string ownerName,
        address indexed smartMeterAddress,
        string smartMeterId
    );

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

        // Deploy a new HeatingToken contract with initial supply
        heatToken = new HeatingToken(1000000 * 10 ** 18, _master); // 1 million tokens with 18 decimals

        billingContract = new BillingContract(_master, heatToken);
    }

    // FUNCTIONS

    function getRole() external view returns (string memory) {
        if (msg.sender == masterOwner) return "admin";
        if (whitelistedMeters[msg.sender]) return "smartMeter";
        if (whitelistedTenants[msg.sender]) return "tenant";

        // if not known
        return "unknown";
    }

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

        whitelistedMeters[_smartMeterAddress] = true;
        emit MeterRegistered(
            _name,
            _ownerName,
            _smartMeterAddress,
            _smartMeterId
        );
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

        // allow billingContract to spend up to 500 tokens from tenant account
        heatToken.tenantOnboarding(_tenant, INITIAL_TENANT_SUPPLY);

        whitelistedTenants[_tenant] = true;
    }

    function removeTenant(address _tenant) external onlyMaster {
        whitelistedTenants[_tenant] = false;
        delete tenants[_tenant];
    }

    function getAssignedSmartMeterAddress(
        address _tenantAddress
    ) external view onlyTenant returns (address) {
        return tenants[_tenantAddress].assignedSmartMeter;
    }

    function getMeterInfo(
        address _meterAddress
    ) external view returns (SmartMeter memory) {
        require(
            msg.sender == masterOwner ||
                (whitelistedTenants[msg.sender] &&
                    tenants[msg.sender].assignedSmartMeter == _meterAddress),
            "Not authorized"
        );
        return smartMeters[_meterAddress];
    }

    function recordData(
        uint256 _value,
        string calldata _unit
    ) external onlyWhitelistedActiveMeter {
        meterData[msg.sender].push(
            Measurement({
                timestamp: block.timestamp,
                value: _value,
                unit: _unit
            })
        );
        emit DataRecorded(msg.sender, block.timestamp, _value);
    }

    function getMeterData(
        address _meterAddress
    ) external view returns (Measurement[] memory) {
        require(
            msg.sender == masterOwner ||
                (whitelistedTenants[msg.sender] &&
                    tenants[msg.sender].assignedSmartMeter == _meterAddress),
            "Not authorized"
        );
        return meterData[_meterAddress];
    }

    // Master can withdraw collected payments
    function withdrawCollectedFunds() external onlyMaster {
        uint256 balance = heatToken.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        require(heatToken.transfer(masterOwner, balance), "Transfer failed");

        // Not sure if complete
    }

    // WRAPPERS FOR BILLINGCONTRACT
    function createBill(
        address _billee,
        uint256 _amountHEAT,
        string memory _description,
        string memory _billId
    ) public onlyMaster {
        require(whitelistedTenants[_billee], "Invalid tenant address");

        // maybe let's create billId from hash
        billingContract.createBill(
            _billee,
            msg.sender,
            _amountHEAT,
            _description,
            _billId
        );
    }

    function payBill(string memory _billId, uint256 _amount) public onlyTenant {
        billingContract.payBill(_billId, _amount, msg.sender);
    }

    function getTokenSupply(
    ) public view onlyTenant returns (uint256) {
        return heatToken.balanceOf(msg.sender);
    }

    function getBills(address _tenant) external view returns (Bill[] memory) {
        require(
            msg.sender == masterOwner ||
                (msg.sender == _tenant && whitelistedTenants[_tenant]),
            "Not authorized"
        );

        return billingContract.getBills(_tenant);
    }

    function getOutstandingBalance() external view returns (uint256) {
        return billingContract.getOutstandingBalance(msg.sender);
    }
}
