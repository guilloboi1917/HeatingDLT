// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct SmartMeter {
    string name;
    string ownerName;
    address smartMeterAddress;
    string smartMeterId;
    address assignedTenant;
    bool isActive;
}

struct UtilityExpense {
    address issuer;
    uint256 amountTNCY;
    uint256 dateIssuance;
    bool validated; // The validator validates this expense
    bytes messageHash; // The validator hashes the message
    string utilityType; // For now let's say there is heating, repairs, etc.
    string description;
    string ipfsCID; // For any other infos
    address[] tenants; // Which tenants does this concern
}

struct Tenant {
    string fullName;
    address tenantAddress;
    address assignedSmartMeter;
}

struct DailyMeasurement {
    uint256 timestamp;
    uint256 usage;
    string unit;
    string ipfsCID;
}

// Who, when and how are bills issued?
// Do we need a start and enddate for the bill
struct Bill {
    string billId; // should be a unique hash from biller, billee, amount and date issuance
    bool paid;
    address biller;
    address billee;
    uint256 amountTNCY;
    uint256 dateIssuance;
    uint256 datePaid;
    string description;
}

struct AddressInfo {
    string ownerName;
    string streetName;
    string cityCode;
    string cityName;
    string country;
    string email;
    string phone;
}
