// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TencyManager.sol";
import "hardhat/console.sol";

contract TencyManagerFactory {
    address public masterParticipant;
    mapping(address => bool) public isMasterParticipant;
    mapping(address => address[]) public masterContracts;

    event ContractCreated(
        address indexed contractAddress,
        address indexed creator
    );

    constructor() {
        masterParticipant = msg.sender;
        isMasterParticipant[msg.sender] = true;
    }

    modifier onlyMaster() {
        require(isMasterParticipant[msg.sender], "Only master participants");
        _;
    }

    function addMasterParticipant(address _master) external {
        require(msg.sender == masterParticipant, "Only main master");
        isMasterParticipant[_master] = true;
    }

    function createManagerContract(
        string memory _name,
        string memory _ownerName,
        address _smartMeterAddress,
        string memory _smartMeterId,
        AddressInfo memory _ownerContactInfo
    ) external onlyMaster returns (address, AddressInfo memory) {
        TencyManager newContract = new TencyManager(msg.sender, _ownerContactInfo);

        // Register the initial smart meter during creation
        newContract.registerSmartMeter(
            _name,
            _ownerName,
            _smartMeterAddress,
            _smartMeterId
        );

        masterContracts[msg.sender].push(address(newContract));
        emit ContractCreated(address(newContract), msg.sender);
        return (address(newContract), _ownerContactInfo);
    }

    function getMasterContracts() external view returns (address[] memory) {
        return masterContracts[msg.sender];
    }
}
