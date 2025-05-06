// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SharedStructs.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract UtilityValidator {
    using ECDSA for bytes32;
    mapping(bytes32 => bool) public usedHashes;

    // This is mainly a mock contract
    address public manager;
    address public validatorAddress;

    // The validator belongs to a TencyManager
    constructor(address _manager) {
        manager = _manager;
    }

    // This function is called by the validator, which has to be an EOA
    function validateExpense(
        UtilityExpense memory _expense
    ) external onlyManager returns (UtilityExpense memory) {
        require(!_expense.validated, "Expense already validated");
        require(_expense.issuer != address(0), "Invalid issuer");

        // 1. Create mock validation
        UtilityExpense memory validatedExpense = _expense;
        validatedExpense.validated = true;

        // 2. Generate mock signature (contract's own approval)
        bytes32 messageHash = keccak256(
            abi.encode(
                _expense.issuer,
                _expense.amountTNCY,
                _expense.dateIssuance,
                _expense.utilityType,
                _expense.description,
                _expense.ipfsCID,
                _expense.tenants,
                block.chainid // Include chain ID to prevent cross-chain replay
            )
        );

        // 3. Store the hash as a "signature" (mock)
        validatedExpense.messageHash = abi.encodePacked(messageHash);

        emit ExpenseValidated(
            validatedExpense.issuer,
            validatedExpense.amountTNCY,
            validatedExpense.dateIssuance,
            validatedExpense.utilityType,
            validatedExpense.messageHash
        );

        return validatedExpense;
    }

    // ================= MODIFIERS =================

    modifier onlyManager() {
        require(msg.sender == manager, "Unauthorized");
        _;
    }

    // ================= EVENTS =================
    event ExpenseValidated(
        address issuer,
        uint256 amountTNCY,
        uint256 dateIssuance,
        string utilityType,
        bytes messageHash
    );
}
