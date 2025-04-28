// add types for bills, tenants, etc.
export interface Tenant {
  address: string;
  name?: string;
}

export interface SmartMeter {
  name: string;
  ownerName: string;
  smartMeterAddress: string;
  smartMeterId: string;
  isActive?: boolean;
}

export interface Bill {
  billId: string; // should be a unique hash from biller, billee, amount and date issuance
  paid: boolean;
  biller: string;
  billee: string;
  amountHEAT: number;
  dateIssuance: number;
  datePaid: number;
  description: string;
}
