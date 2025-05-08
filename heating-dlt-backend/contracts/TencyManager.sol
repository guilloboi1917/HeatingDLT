// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./TNCY.sol";
import "./SharedStructs.sol";
import "./UtilityValidator.sol";

contract TencyManager {
    // TOKEN
    TNCY public tncyToken;

    // CONTRACT OWNER --> LANDLORD or PROPERTY MANAGER
    address public masterOwner;

    UtilityValidator public utilityValidator;

    AddressInfo private masterContactInfo;

    // SMART METERS
    mapping(address => SmartMeter) public smartMeters;
    address[] private smartMetersArray;

    // TENANT SPECIFIC
    mapping(address => Tenant) public tenants;
    address[] private tenantsArray;
    string[] private tenantNamesArray;

    // SMART METER READINGS
    mapping(address => DailyMeasurement[]) dailyEnergyUsage;
    mapping(address => string[]) detailedUsageIPFS;

    // Whitelist meters
    mapping(address => bool) private whitelistedMeters;

    // Whitelisted tenants that can access parts of this manager
    mapping(address => bool) public whitelistedTenants;

    // All expenses
    UtilityExpense[] private utilityExpenses;

    // Utility expenses for a tenant
    mapping(address => UtilityExpense[]) private tenantUtitlityExpenses;

    // ================= EVENTS =================
    event MeterRegistered(
        string name,
        string ownerName,
        address indexed smartMeterAddress,
        string smartMeterId
    );

    event DataRecorded(address indexed meter, uint256 timestamp, uint256 value);

    // ================= CONSTRUCTOR =================

    constructor(address _master, AddressInfo memory _ownerContactInfo) {
        console.log("Creating manager for", _master);
        masterOwner = _master;
        masterContactInfo = _ownerContactInfo;

        // Create TOKEN, BillingManager and UtilityValidator
        tncyToken = new TNCY(address(this));

        // We pass on the ownership
        tncyToken.setNewOwner(_master);
        // We add the landlord as a billing manager, but also have this contract as a billingManager
        tncyToken.addBillingAdmin(_master);

        utilityValidator = new UtilityValidator(address(this));
    }

    // ================= UTILTY EXPENSES =================
    function recordUtilityExpense(
        uint256 _amountTNCY,
        uint256 _dateIssuance,
        string calldata _utilityType,
        string calldata _description,
        string calldata _ipfsCID,
        address[] calldata _tenants
    ) external onlyMaster {
        // Maybe some checks here

        UtilityExpense memory unvalidatedUtilityExpense = UtilityExpense(
            msg.sender,
            _amountTNCY,
            _dateIssuance,
            false,
            "",
            _utilityType,
            _description,
            _ipfsCID,
            _tenants
        );

        // Now we validate
        UtilityExpense memory validatedUtilityExpense = utilityValidator
            .validateExpense(unvalidatedUtilityExpense);

        utilityExpenses.push(validatedUtilityExpense);

        uint numberOfTenants = _tenants.length;
        uint256 amountsEach = _amountTNCY / numberOfTenants;

        for (uint i = 0; i < numberOfTenants; i++) {
            tenantUtitlityExpenses[_tenants[i]].push(validatedUtilityExpense);

            // Adjust balance, only placeholder
            tncyToken.adjustTenantBalance(_tenants[i], amountsEach);
        }

        // No need for event here, as validator already creates one
    }

    // ADMIN ONLY
    function getUtilityExpenses()
        external
        view
        onlyMaster
        returns (UtilityExpense[] memory)
    {
        return utilityExpenses;
    }

    // ================= TENANT UTILITY MANAGMENT =================
    function getTenantUtilityExpenses(
        address _tenant
    ) external view onlyTenant returns (UtilityExpense[] memory) {
        return tenantUtitlityExpenses[_tenant];
    }

    // ================= ADMIN MANAGEMENT =================

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
            assignedTenant: address(0),
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

    function assignSmartMeter(
        address _tenant,
        address _smartMeterAddress
    ) external onlyMaster {
        require(whitelistedTenants[_tenant], "Tenant not found");
        require(whitelistedMeters[_smartMeterAddress], "SmartMeter not found");
        require(smartMeters[_smartMeterAddress].assignedTenant != _tenant || tenants[_tenant].   != _smartMeterAddress, "Already Assigned!");

        smartMeters[_smartMeterAddress].assignedTenant = _tenant;
        tenants[_tenant].assignedSmartMeter = _smartMeterAddress;
    }

    function removeAssignedSmartMeter(
        address _tenant,
        address _smartMeterAddress
    ) external onlyMaster {
        require(
            _smartMeterAddress == address(_smartMeterAddress),
            "Invalid address"
        );
        require(_tenant == address(_tenant), "Invalid address");
        require(whitelistedMeters[_smartMeterAddress], "Smart Meter not found");

        bool isAssignedTenant = smartMeters[_smartMeterAddress]
            .assignedTenant == _tenant;
        bool isAssignedSmartMeter = tenants[_tenant].assignedSmartMeter ==
            _smartMeterAddress;

        require(
            isAssignedTenant || isAssignedSmartMeter,
            "Smart Meter not assigned"
        );

        if (isAssignedSmartMeter) {
            tenants[_tenant].assignedSmartMeter = address(0);
        }

        if (isAssignedTenant) {
            smartMeters[_smartMeterAddress].assignedTenant = address(0);
        }

        // Emit event
    }

    // Add and remove tenants
    function addTenant(
        address _tenant,
        string memory _fullName
    ) external onlyMaster {
        require(_tenant == address(_tenant), "Invalid Address");
        require(!whitelistedTenants[_tenant], "Tenant already exists");
        tenants[_tenant] = Tenant({
            fullName: _fullName,
            tenantAddress: _tenant,
            assignedSmartMeter: address(0)
        });

        console.log("Tenant Added");
        console.log(tenants[_tenant].assignedSmartMeter);

        tenantsArray.push(_tenant);

        tenantNamesArray.push(_fullName);

        whitelistedTenants[_tenant] = true;
    }

    function removeTenant(address _tenant) external onlyMaster {
        whitelistedTenants[_tenant] = false;

        // Remove reference from smart meter
        address assignedSmartMeter = tenants[_tenant].assignedSmartMeter;
        smartMeters[assignedSmartMeter].assignedTenant = address(0);

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
        returns (address[] memory, address[] memory, string[] memory)
    {
        uint length = tenantsArray.length;
        address[] memory assignedSmartMeterAddresses = new address[](length);
        for (uint i = 0; i < tenantsArray.length; i++) {
            assignedSmartMeterAddresses[i] = tenants[tenantsArray[i]]
                .assignedSmartMeter;
        }
        return (tenantsArray, assignedSmartMeterAddresses, tenantNamesArray);
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

    // ================= SMARTMETERS =================

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
        uint256 _timestamp,
        uint256 _usage,
        string calldata _unit,
        string calldata _ipfsCID // Store raw bytes
    ) external onlyWhitelistedActiveMeter {
        dailyEnergyUsage[msg.sender].push(
            DailyMeasurement({
                timestamp: _timestamp, // maybe other than block timestamp would be good for testing
                usage: _usage,
                unit: _unit,
                ipfsCID: _ipfsCID
            })
        );

        // Costs in TNCY
        uint256 _tokens = _usage * tncyToken.ratePerKwh();
        string memory description = string.concat(
            "HEATING Recorded by SMARTMETER ID: ",
            smartMeters[msg.sender].smartMeterId
        );

        address assignedTenant = smartMeters[msg.sender].assignedTenant;
        address[] memory _tenants = new address[](1);
        _tenants[0] = assignedTenant;

        // We also create utilityExpenses for this
        UtilityExpense memory unvalidatedUtilityExpense = UtilityExpense(
            msg.sender,
            _tokens,
            _timestamp,
            false,
            "",
            "HEATING",
            description,
            _ipfsCID,
            _tenants
        );

        // Now we validate
        UtilityExpense memory validatedUtilityExpense = utilityValidator
            .validateExpense(unvalidatedUtilityExpense);

        utilityExpenses.push(validatedUtilityExpense);

        tenantUtitlityExpenses[assignedTenant].push(validatedUtilityExpense);

        tncyToken.adjustTenantBalance(assignedTenant, _tokens);

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

    function getTokenBalance() public view returns (uint256) {
        require(
            msg.sender == masterOwner || whitelistedTenants[msg.sender],
            "Not authorized"
        );
        return tncyToken.balanceOf(msg.sender);
    }

    function getTNCYAddress() public view returns (address) {
        require(
            msg.sender == masterOwner || whitelistedTenants[msg.sender],
            "Unauthorized"
        );
        return address(tncyToken);
    }

    // ================= MODIFIERS =================

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
}
