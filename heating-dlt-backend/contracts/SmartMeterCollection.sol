// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./TNCY.sol";
import "./BillingManager.sol";
import "./SharedStructs.sol";

contract SmartMeterCollection {
    address public masterOwner;
    TNCY public heatToken;
    BillingManager public billingManager;

    AddressInfo private masterContactInfo;

    // Map meter address to SmartMeter struct
    mapping(address => SmartMeter) public smartMeters;

    address[] private smartMetersArray;

    // Map tenant address to Tenant struct
    mapping(address => Tenant) public tenants;

    address[] private tenantsArray;

    string[] private tenantNamesArray;

    // Map meter address to Measurement data
    // Later to be replaced with ipfs
    mapping(address => DailyMeasurement[]) dailyEnergyUsage;
    mapping(address => string[]) detailedUsageIPFS;

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
    constructor(address _master, AddressInfo memory _ownerContactInfo) {
        console.log("Creating collection for", _master);
        masterOwner = _master;
        masterContactInfo = _ownerContactInfo;

        // Deploy a new HeatingToken contract w
        // Owner of heattoken is this smartmetercollection
        heatToken = new TNCY(address(this));

        billingManager = new BillingManager(_master, heatToken);
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
        // check that address is not also a tenant and vice versa
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
        smartMetersArray.push(_smartMeterAddress);

        emit MeterRegistered(
            _name,
            _ownerName,
            _smartMeterAddress,
            _smartMeterId
        );
    }

    // Also add remove smartmeter

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

        tenantsArray.push(_tenant);

        tenantNamesArray.push(_fullName);

        whitelistedTenants[_tenant] = true;
    }

    function removeTenant(address _tenant) external onlyMaster {
        whitelistedTenants[_tenant] = false;

        // Find and remove from array
        for (uint i = 0; i < tenantsArray.length; i++) {
            if (tenantsArray[i] == _tenant) {
                // Swap with last element and pop (more gas efficient than shifting)
                tenantsArray[i] = tenantsArray[tenantsArray.length - 1];
                tenantsArray.pop();
                tenantNamesArray[i] = tenantNamesArray[
                    tenantNamesArray.length - 1
                ];
                tenantNamesArray.pop();
                break;
            }
        }
        // also delete from mapping
        delete tenants[_tenant];
    }

    // returns array of addresses
    function getTenants()
        external
        view
        onlyMaster
        returns (address[] memory, string[] memory)
    {
        return (tenantsArray, tenantNamesArray);
    }

    // Get the tenant's name
    function getTenantName(
        address _tenant
    ) external view onlyTenant returns (string memory) {
        return tenants[_tenant].fullName;
    }

    // Get the owner's name
    function getOwnerName() external view returns (string memory) {
        return masterContactInfo.ownerName;
    }

    // Get the owner's contact info
    function getOwnerContactInfo() external view returns (AddressInfo memory) {
        return masterContactInfo;
    }

    // returns array of addresses
    function getSmartMeters()
        external
        view
        onlyMaster
        returns (address[] memory)
    {
        return smartMetersArray;
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

    // We store the usage here, and detailed summaries to ipfs
    function recordDailyUsage(
        uint256 timestamp,
        uint256 _usage,
        string calldata _unit,
        string calldata _ipfsCID // Store raw bytes
    ) external onlyWhitelistedActiveMeter {
        dailyEnergyUsage[msg.sender].push(
            DailyMeasurement({
                timestamp: timestamp, // maybe other than block timestamp would be good for testing
                usage: _usage,
                unit: _unit,
                ipfsCID: _ipfsCID
            })
        );
        emit DataRecorded(msg.sender, block.timestamp, _usage);
    }

    function storeDetailedUsage(
        string calldata _ipfsCID
    ) external onlyWhitelistedActiveMeter {
        detailedUsageIPFS[msg.sender].push(_ipfsCID);
    }

    function getDailyUsage(
        address _meterAddress
    ) external view returns (DailyMeasurement[] memory) {
        require(
            msg.sender == masterOwner ||
                (whitelistedTenants[msg.sender] &&
                    tenants[msg.sender].assignedSmartMeter == _meterAddress),
            "Not authorized"
        );
        return dailyEnergyUsage[_meterAddress];
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
        uint256 _amountTNCY,
        string memory _description,
        string memory _billId
    ) public onlyMaster {
        require(whitelistedTenants[_billee], "Invalid tenant address");

        // maybe let's create billId from hash
        billingManager.createBill(
            _billee,
            msg.sender,
            _amountTNCY,
            _description,
            _billId
        );
    }

    function payBillOnBehalf(
        string memory _billId,
        address payer
    ) external returns (bool) {
        return billingManager.payBill(_billId, payer); // Forward msg.sender as payer
    }

    function getTokenBalance() public view returns (uint256) {
        require(
            msg.sender == masterOwner || whitelistedTenants[msg.sender],
            "Not authorized"
        );
        return heatToken.balanceOf(msg.sender);
    }

    function getBills(address _tenant) external view returns (Bill[] memory) {
        require(
            msg.sender == masterOwner ||
                (msg.sender == _tenant && whitelistedTenants[_tenant]),
            "Not authorized"
        );

        return billingManager.getBills(_tenant);
    }

    // Token specific

    function getOutstandingBalance() external view returns (uint256) {
        return billingManager.getOutstandingBalance(msg.sender);
    }

    function mintTNCY(address to, uint256 amount) external onlyMaster {
        heatToken.mint(to, amount);
    }

    function getTNCYAddress() public view returns (address) {
        require(
            msg.sender == masterOwner || whitelistedTenants[msg.sender],
            "Unauthorized"
        );
        return address(heatToken);
    }
}
