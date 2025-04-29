// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./HEAT.sol";
import "./SharedStructs.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BillingManager {
    IERC20 public heatToken;

    address public masterOwner;
    uint256 public heatPerKwh = 1 * 10 ** 18; // 1 HEAT = 1 kWh (with decimals)

    // Tenant => Outstanding balance (in HEAT)
    mapping(address => uint256) public outstandingBalance;

    // Bill ID => Bill
    mapping(string => Bill) public billsById;

    // Tenant address => array of bill IDs
    mapping(address => string[]) public tenantBillIds;

    // EVENTS
    event PaymentMade(address indexed billee, uint256 amount, string billId);
    event BillIssued(
        address indexed biller,
        address indexed billee,
        uint256 amount,
        string billId
    );

    event HEATBurned(uint256 amount);

    constructor(address _master, IERC20 _heatToken) {
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

    modifier onlyMasterOwner() {
        require(msg.sender == masterOwner, "Only MasterOwner");
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
        billsById[_billId] = newBill;
        tenantBillIds[_billee].push(_billId);

        outstandingBalance[_billee] += _amountHEAT;

        emit BillIssued(msg.sender, _billee, _amountHEAT, _billId);
    }

    function payBill(string memory _billId, address _payer) external {
        Bill storage bill = billsById[_billId];
        require(!bill.paid, "Bill already paid");
        require(_payer == bill.billee, "Not the billee");

        uint256 amount = bill.amountHEAT;
        require(
            heatToken.transferFrom(_payer, masterOwner, amount), // Pull from _payer, not msg.sender
            "Payment failed"
        );

        bill.paid = true;
        bill.datePaid = block.timestamp;
        outstandingBalance[_payer] -= amount;

        emit PaymentMade(_payer, amount, _billId);
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
