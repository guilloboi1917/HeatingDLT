import { create } from "zustand";
import { ethers, BigNumberish, BigNumber } from "ethers";
import { toast } from "@/components/ui/use-toast";
import TencyManagerAbi from "@/contracts/TencyManager.json";
import TNCYAbi from "@/contracts/TNCY.json";
import {
  Tenant,
  SmartMeter,
  Bill,
  AddressInfo,
  DailyMeasurementData,
  UtilityExpense,
} from "@/types/types";
import {
  parseBill,
  parseDailyMeasurements,
  parseSmartMeter,
  parseUtilityExpense,
} from "@/lib/parseTypes";
import { add } from "date-fns";
import { putPDFToIPFSHelper } from "@/lib/ipfs";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

type ContractState = {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  contract: ethers.Contract | null;
  tokenContract: ethers.Contract | null;
  isConnected: boolean;
  isAdmin: boolean;
  isTenant: boolean;
  tokenBalance: number; // maybe change to bigint and already format
  fullName: string | null;
  ownerName: string | null;
  ownerContactInfo: AddressInfo | null;

  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;

  // tenant management
  getTenants: () => Promise<Tenant[]>;
  addTenant: (address: string, name: string) => Promise<boolean>;
  removeTenant: (address: string) => Promise<boolean>;

  // smart meter management
  getSmartMeters: () => Promise<SmartMeter[]>;
  registerSmartMeter: (
    name: string,
    ownerName: string,
    address: string,
    smartMeterId: string
  ) => Promise<boolean>;
  //   getSmartMeterInfo: (address: string) => Promise<SmartMeter>;
  assignSmartMeter: (
    tenantAddress: string,
    smartMeterAddress: string
  ) => Promise<void>;

  getEnergyUsage: (address: string) => Promise<DailyMeasurementData[]>;

  // Utility Expenses
  getUtilityExpenses: () => Promise<UtilityExpense[]>;
  getTenantUtilityExpenses: (address: string) => Promise<UtilityExpense[]>;
  recordUtilityExpense: (
    amount: number,
    date: Date,
    utilityType: string,
    description: string,
    cid: string,
    tenants: string[]
  ) => Promise<void>;
};

export const useContractStore = create<ContractState>((set, get) => ({
  provider: null,
  signer: null,
  account: null,
  contract: null,
  tokenContract: null,
  isConnected: false,
  isAdmin: false,
  isTenant: false,
  tokenBalance: 0,
  fullName: null,
  ownerName: null,
  ownerContactInfo: null,

  connectWallet: async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast({
        title: "No Wallet",
        description: "Install MetaMask",
        variant: "destructive",
      });
      return;
    }

    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const signer = await web3Provider.getSigner();
      const account = accounts[0];
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        TencyManagerAbi.abi,
        signer
      );

      // Assume getRole() and getTokenBalance() exist on your contract
      const role = await contract.getRole();
      const isAdmin = role === "admin";
      const isTenant = role === "tenant";

      let fullName = null;
      if (isTenant) {
        fullName = await contract.getTenantName(account);
      }
      const ownerName = await contract.getOwnerName();
      const ownerContactInfo = await contract.getOwnerContactInfo();

      let tokenBalance = 0;
      tokenBalance = Number(await contract.getTokenBalance());

      const TOKENCONTRACT_ADDRESS = await contract.getTNCYAddress();

      const tokenContract = new ethers.Contract(
        TOKENCONTRACT_ADDRESS,
        TNCYAbi.abi,
        signer
      );

      set({
        provider: web3Provider,
        signer,
        account,
        contract,
        tokenContract,
        isConnected: true,
        isAdmin,
        isTenant,
        tokenBalance,
        fullName,
        ownerName,
        ownerContactInfo,
      });

      toast({ title: "Connected", description: "Wallet connected!" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Connection Failed",
        description: "Could not connect wallet",
        variant: "destructive",
      });
    }
  },

  disconnectWallet: () => {
    set({
      provider: null,
      signer: null,
      account: null,
      contract: null,
      tokenContract: null,
      isConnected: false,
      isAdmin: false,
      isTenant: false,
      tokenBalance: 0,
      fullName: null,
      ownerName: null,
      ownerContactInfo: null,
    });

    toast({ title: "Disconnected", description: "Wallet disconnected." });
  },

  getTenants: async (): Promise<Tenant[]> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      return [];
    }
    try {
      const fetchedInfo = await contract.getTenants();
      const fetchedTenantsName: string[] = fetchedInfo[2];
      const fetchedTenantsAddress: string[] = await fetchedInfo[0];
      const fetchedAssignedSmartMeterAddress: string[] = fetchedInfo[1];

      const tenants: Tenant[] = fetchedTenantsAddress.map(
        (address: string, index) => ({
          address: address,
          name: fetchedTenantsName[index] + " (Tenant " + (index + 1) + ")",
          assignedSmartMeterAddress: fetchedAssignedSmartMeterAddress[index],
        })
      );

      return tenants;
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch tenants.",
        variant: "destructive",
      });
      return [];
    }
  },

  addTenant: async (address: string, name: string): Promise<boolean> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const tx = await contract.addTenant(address, name);
      return true;
    } catch (error) {
      console.error("Error adding tenant:", error);
      return false;
    }
  },

  removeTenant: async (address: string): Promise<boolean> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const tx = await contract.removeTenant(address);
      return true;
    } catch (error) {
      console.error("Error removing tenant:", error);
      return false;
    }
  },

  getSmartMeters: async (): Promise<SmartMeter[]> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      // return empty array
      return [] as SmartMeter[];
    }

    try {
      const smartMetersAddress: string[] = await contract.getSmartMeters();

      // Use Promise.all for async mapping
      const smartMeterPromises = smartMetersAddress.map(
        async (address: string) => {
          try {
            const rawInfo = await contract.getMeterInfo(address);
            return parseSmartMeter(rawInfo);
          } catch (err) {
            console.error(`Error fetching smartMeter ${address}:`, err);
            // Return a fallback object or null (will be filtered out)
            return {
              address: address,
              name: "Unknown",
              ownerName: "Unknown",
              smartMeterAddress: "Unknown",
              smartMeterId: "Unknown",
              assignedTenantAddress: "Unknown",
              isActive: false,
              // other required SmartMeter properties
            } as SmartMeter;
          }
        }
      );

      // Wait for all promises and filter out nulls if needed
      const smartMeters: SmartMeter[] = (
        await Promise.all(smartMeterPromises)
      ).filter(Boolean);
      return smartMeters;
    } catch (error) {
      console.error("Error fetching smartMeters:", error);
      return [];
    }
  },

  registerSmartMeter: async (
    name: string,
    ownerName: string,
    address: string,
    smartMeterId: string
  ): Promise<boolean> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      // return empty array
      return false;
    }

    try {
      const tx = await contract.registerSmartMeter(
        name,
        ownerName,
        address,
        smartMeterId
      );

      console.log("SmartMeter Registered: ", {
        name,
        ownerName,
        address,
        smartMeterId,
      });

      return true;
    } catch (error) {
      console.error("Error Registering SmartMeter:", error);

      toast({
        title: "Smart Meter Registration Error",
        description: "Smart Meter Registration Failed",
        variant: "destructive",
      });

      return false;
    }
  },

  assignSmartMeter: async (
    tenantAddress: string,
    smartMeterAddress: string
  ): Promise<void> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      return;
    }
    console.log(
      "Assigning smart meter :",
      ethers.getAddress(tenantAddress),
      ethers.getAddress(smartMeterAddress)
    );

    try {
      const response = await contract.assignSmartMeter(
        ethers.getAddress(tenantAddress),
        ethers.getAddress(smartMeterAddress)
      );
      console.log(response);
    } catch (error) {
      console.error("Error Assigning smart meter:", error);
      return;
    }
  },

  getEnergyUsage: async (address: string): Promise<DailyMeasurementData[]> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      // return empty array
      return [] as DailyMeasurementData[];
    }

    try {
      // First get the smart meter address
      console.log("Fetching smart Meter address");
      const assignedSmartMeterAddress =
        await contract.getAssignedSmartMeterAddress(address);
      if (
        assignedSmartMeterAddress === null ||
        assignedSmartMeterAddress === ""
      ) {
        console.error("Coulnd't fetch assigned smart meter address");
        return [] as DailyMeasurementData[];
      }

      // Then get the readings
      console.log("Fetching Energy Usage");
      const rawEnergyUsage: DailyMeasurementData[] =
        await contract.getDailyUsage(assignedSmartMeterAddress);
      return rawEnergyUsage.map(parseDailyMeasurements);
    } catch (error) {
      console.error("Error fetching Daily Measurements:", error);
      return [] as DailyMeasurementData[];
    }
  },

  getUtilityExpenses: async (): Promise<UtilityExpense[]> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      // return empty array
      return [] as UtilityExpense[];
    }

    try {
      const rawUtiltyExpenses = await contract.getUtilityExpenses();

      console.log("Fetched utilityExpenses: ", rawUtiltyExpenses);

      return rawUtiltyExpenses.map(parseUtilityExpense);
    } catch (err) {
      console.error("Error fetching Utility Expenses:", err);
      return [] as UtilityExpense[];
    }
  },

  getTenantUtilityExpenses: async (
    address: string
  ): Promise<UtilityExpense[]> => {
    const { contract, account } = get();
    if (!contract || !account) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      // return empty array
      return [] as UtilityExpense[];
    }

    try {
      const rawUtiltyExpenses = await contract.getTenantUtilityExpenses(
        account
      );

      console.log("Fetched utilityExpenses: ", rawUtiltyExpenses);

      return rawUtiltyExpenses.map(parseUtilityExpense);
    } catch (err) {
      console.error("Error fetching Utility Expenses:", err);
      return [] as UtilityExpense[];
    }
  },

  recordUtilityExpense: async (
    amount: number,
    date: Date,
    utilityType: string,
    description: string,
    cid: string,
    tenants: string[]
  ): Promise<void> => {
    const { contract, account } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedAmount = ethers.parseEther(amount.toString());
      console.log(formattedAmount);
      const formattedDate = ethers.toBigInt(Math.floor(date.getTime() / 1000));
      const formattedTenantsAddress: string[] = tenants.map(
        (address: string, index) => ethers.getAddress(address)
      );

      console.log("Uploading Utility Expense: ", {
        amount: formattedAmount.toString(),
        date: formattedDate.toString(),
        type: utilityType,
        description: description,
        cid: cid,
        tenants: formattedTenantsAddress,
      });

      const recordTx = await contract.recordUtilityExpense(
        formattedAmount,
        formattedDate,
        utilityType,
        description,
        cid,
        formattedTenantsAddress
      );

      return;
    } catch (err) {
      console.error("Error fetching Utility Expenses:", err);
      return;
    }

    return;
  },
}));
