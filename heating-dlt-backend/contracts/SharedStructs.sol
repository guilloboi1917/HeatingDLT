// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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

// Who, when and how are bills issued?
// Do we need a start and enddate for the bill
struct Bill {
    string billId; // should be a unique hash from biller, billee, amount and date issuance
    bool paid;
    address biller;
    address billee;
    uint256 amountHEAT;
    uint256 dateIssuance;
    uint256 datePaid;
    string description;
}
