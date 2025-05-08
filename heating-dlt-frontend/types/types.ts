// add types for bills, tenants, etc.
export interface Tenant {
  address: string;
  assignedSmartMeterAddress: string;
  name: string;
}

export interface DailyMeasurementData {
  timestamp: Date;
  usage: number;
  unit: string;
  ipfsCID: string;
}

export interface HourlyData {
  timestamp: string;
  value: number;
  unit: string;
}

export interface ChartData {
  ipfsCID: string;
  date: number;
  usage: number;
  formattedDate: string;
}

export interface SmartMeter {
  name: string;
  ownerName: string;
  smartMeterAddress: string;
  smartMeterId: string;
  assignedTenantAddress: string;
  isActive?: boolean;
}

export interface Bill {
  billId: string; // should be a unique hash from biller, billee, amount and date issuance
  paid: boolean;
  biller: string;
  billee: string;
  amountTNCY: bigint;
  dateIssuance: number;
  datePaid: number;
  description: string;
}

export interface AddressInfo {
  ownerName: string;
  streetName: string;
  cityCode: string;
  cityName: string;
  country: string;
  email: string;
  phone: string;
}

export interface UtilityExpense {
  issuer: string;
  amountTNCY: bigint;
  dateIssuance: Date;
  validated: boolean;
  messageHash: string; // hex string
  utilityType: string;
  description: string;
  ipfsCID: string;
  tenants: string[]; // Always an array
}
