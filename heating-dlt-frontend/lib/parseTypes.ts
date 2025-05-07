import { Bill, DailyMeasurementData, UtilityExpense } from "@/types/types";
import { ethers, hexlify } from "ethers";
import { Anonymous_Pro } from "next/font/google";

export function parseBill(raw: any): Bill {
  return {
    billId: raw.billId,
    paid: raw.paid,
    biller: raw.biller,
    billee: raw.billee,
    amountTNCY: BigInt(raw.amountTNCY),
    dateIssuance: Number(raw.dateIssuance),
    datePaid: Number(raw.datePaid),
    description: raw.description,
  };
}

export function parseDailyMeasurements(raw: any): DailyMeasurementData {
  return {
    timestamp: new Date(Number(raw.timestamp) * 1000),
    usage: Number(raw.usage) / 1e18,
    unit: raw.unit,
    ipfsCID: raw.ipfsCID,
  };
}

export function parseUtilityExpense(raw: any): UtilityExpense {
  // Ensure raw[8] is treated as an array
  const tenants = raw[8].map(String);

  return {
    issuer: String(raw[0]), // Ethereum address
    amountTNCY: BigInt(raw[1]), // Large number as string
    dateIssuance: new Date(Number(raw[2]) * 1000), // Unix timestamp
    validated: Boolean(raw[3]),
    messageHash: hexlify(raw[4]), // Keep hash as hex string
    utilityType: String(raw[5]),
    description: String(raw[6]),
    ipfsCID: String(raw[7]),
    tenants: tenants, // Now always an array
  };
}
