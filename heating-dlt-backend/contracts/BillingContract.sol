// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./HeatingToken.sol";
import "./SharedStructs.sol";

contract BillingContract {
    address public masterOwner;
    HeatingToken public heatToken;

    // billing mapping, which is a set of bills mapped to tenant addresses
    mapping(address => Bill[]) public tenantBills;

    // outstanding balance
    mapping(address => uint256) public outstandingBalance;

    // New mapping for direct bill access by ID
    mapping(string => Bill) public billsById;

    // Mapping from tenant to their bill IDs
    mapping(address => string[]) public tenantBillIds;

    // EVENTS
    event PaymentMade(address indexed billee, uint256 amount, string billId);
    event BillIssued(
        address indexed biller,
        address indexed billee,
        uint256 amount,
        string billId
    );

    constructor(address _master, HeatingToken _heatToken) {
        masterOwner = _master;
        heatToken = _heatToken;
    }

    modifier billDoesNotExist(string memory billId) {
        require(
            bytes(billsById[billId].billId).length == 0,
            "Bill ID already exists"
        );
        _;
    }

    function createBill(
        address _billee,
        address _biller,
        uint256 _amountHEAT,
        string memory _description,
        string memory _billId
    ) external billDoesNotExist(_billId) {
        Bill memory newBill = Bill({
            billId: _billId,
            paid: false,
            billee: _billee,
            biller: _biller,
            amountHEAT: _amountHEAT,
            dateIssuance: block.timestamp,
            datePaid: 0,
            description: _description
        });

        // Store in both data structures
        tenantBills[_billee].push(newBill);
        billsById[_billId] = newBill;
        tenantBillIds[_billee].push(_billId);

        outstandingBalance[_billee] += _amountHEAT;

        emit BillIssued(msg.sender, _billee, _amountHEAT, _billId);
    }

    function payBill(
        string memory _billId,
        uint256 _amount,
        address _billee
    ) external {
        // We first allow the value
        require(
            heatToken.approveFor(_billee, masterOwner, _amount),
            "Couldn't approve allowance"
        );

        Bill storage bill = billsById[_billId];

        require(bytes(bill.billId).length != 0, "Bill not found");
        require(!bill.paid, "Bill already paid");
        require(_amount == bill.amountHEAT, "Incorrect payment amount"); // necessary? Bills should be payed in full
        require(_billee == bill.billee, "Not the bill recipient");

        // Transfer HEAT tokens from tenant to contract
        require(
            heatToken.transferFrom(_billee, masterOwner, _amount),
            "Token transfer failed"
        );

        bill.paid = true;
        bill.datePaid = block.timestamp;
        outstandingBalance[_billee] -= _amount;

        emit PaymentMade(_billee, _amount, _billId);
    }

    function getBills(address _tenant) external view returns (Bill[] memory) {
        string[] memory ids = tenantBillIds[_tenant];
        Bill[] memory result = new Bill[](ids.length);

        for (uint i = 0; i < ids.length; i++) {
            result[i] = billsById[ids[i]];
        }

        return result;
    }

    // maybe extend such that master can also access
    function getOutstandingBalance(
        address _tenant
    ) external view returns (uint256) {
        return outstandingBalance[_tenant];
    }
}
