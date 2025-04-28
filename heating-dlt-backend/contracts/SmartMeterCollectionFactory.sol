// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SmartMeterCollection.sol";
import "hardhat/console.sol";

contract SmartMeterCollectionFactory {
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

    function createCollectionContract(
        string memory _name,
        string memory _ownerName,
        address _smartMeterAddress,
        string memory _smartMeterId
    ) external onlyMaster returns (address) {
        SmartMeterCollection newContract = new SmartMeterCollection(msg.sender);

        // Register the initial smart meter during creation
        newContract.registerSmartMeter(
            _name,
            _ownerName,
            _smartMeterAddress,
            _smartMeterId
        );

        masterContracts[msg.sender].push(address(newContract));
        emit ContractCreated(address(newContract), msg.sender);
        return address(newContract);
    }

    function getMasterContracts() external view returns (address[] memory) {
        return masterContracts[msg.sender];
    }
}
